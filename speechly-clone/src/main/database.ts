import initSqlJs, { Database, SqlValue } from 'sql.js';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { Settings, TranscriptHistory, CustomDictionary, GeminiModel } from '../shared/types';
import { CONTEXT_NAMES } from '../shared/constants';

let db: Database | null = null;
let dbPath: string = '';

function getDbPath(): string {
  if (!dbPath) {
    dbPath = path.join(app.getPath('userData'), 'speechly.db');
  }
  return dbPath;
}

function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(getDbPath(), buffer);
  }
}

function getWasmPath(): string {
  const isDev = !app.isPackaged;
  if (isDev) {
    return path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm');
  }
  return path.join(process.resourcesPath, 'sql-wasm.wasm');
}

export async function initDatabase(): Promise<void> {
  const wasmBuffer = fs.readFileSync(getWasmPath());
  const wasmBinary = wasmBuffer.buffer.slice(wasmBuffer.byteOffset, wasmBuffer.byteOffset + wasmBuffer.byteLength);
  const SQL = await initSqlJs({ wasmBinary });
  const filePath = getDbPath();
  
  try {
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
  } catch (e) {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      geminiApiKey TEXT DEFAULT '',
      geminiModel TEXT DEFAULT 'gemini-2.0-flash',
      defaultLanguage TEXT DEFAULT 'fr-FR',
      autoDetectLanguage INTEGER DEFAULT 0,
      hotkeyRecord TEXT DEFAULT 'CommandOrControl+Shift+Space',
      hotkeyInsert TEXT DEFAULT 'CommandOrControl+Shift+V',
      autoCleanup INTEGER DEFAULT 1,
      contextAwareCleanup INTEGER DEFAULT 1,
      saveHistory INTEGER DEFAULT 1,
      historyRetentionDays INTEGER DEFAULT 30,
      theme TEXT DEFAULT 'dark',
      minimizeToTray INTEGER DEFAULT 1,
      launchAtStartup INTEGER DEFAULT 0,
      CHECK (id = 1)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transcript_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original TEXT NOT NULL,
      cleaned TEXT NOT NULL,
      language TEXT NOT NULL,
      context TEXT DEFAULT 'general',
      contextName TEXT DEFAULT 'Général',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      wordCount INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS custom_dictionary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL,
      replacement TEXT NOT NULL,
      context TEXT DEFAULT 'all',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const countResult = db.exec("SELECT COUNT(*) as count FROM settings WHERE id = 1");
  const count = countResult.length > 0 && countResult[0].values.length > 0 ? countResult[0].values[0][0] as number : 0;
  if (count === 0) {
    db.run("INSERT INTO settings (id) VALUES (1)");
  }

  migrateDatabase();
  cleanupOldHistory();
  saveDatabase();
}

function migrateDatabase(): void {
  if (!db) return;
  
  const columnsResult = db.exec("PRAGMA table_info(settings)");
  const columnNames: string[] = [];
  if (columnsResult.length > 0) {
    columnsResult[0].values.forEach((row: SqlValue[]) => {
      columnNames.push(row[1] as string);
    });
  }

  const newColumns = [
    { name: 'geminiModel', def: "TEXT DEFAULT 'gemini-2.0-flash'" },
    { name: 'autoDetectLanguage', def: 'INTEGER DEFAULT 0' },
    { name: 'hotkeyInsert', def: "TEXT DEFAULT 'CommandOrControl+Shift+V'" },
    { name: 'contextAwareCleanup', def: 'INTEGER DEFAULT 1' },
    { name: 'saveHistory', def: 'INTEGER DEFAULT 1' },
    { name: 'historyRetentionDays', def: 'INTEGER DEFAULT 30' },
    { name: 'minimizeToTray', def: 'INTEGER DEFAULT 1' },
    { name: 'launchAtStartup', def: 'INTEGER DEFAULT 0' },
  ];

  for (const col of newColumns) {
    if (!columnNames.includes(col.name)) {
      try {
        db.run(`ALTER TABLE settings ADD COLUMN ${col.name} ${col.def}`);
      } catch (e) {
      }
    }
  }

  const historyColumnsResult = db.exec("PRAGMA table_info(transcript_history)");
  const historyColumnNames: string[] = [];
  if (historyColumnsResult.length > 0) {
    historyColumnsResult[0].values.forEach((row: SqlValue[]) => {
      historyColumnNames.push(row[1] as string);
    });
  }
  
  if (!historyColumnNames.includes('contextName')) {
    try {
      db.run("ALTER TABLE transcript_history ADD COLUMN contextName TEXT DEFAULT 'Général'");
    } catch (e) {
    }
  }

  const dictColumnsResult = db.exec("PRAGMA table_info(custom_dictionary)");
  const dictColumnNames: string[] = [];
  if (dictColumnsResult.length > 0) {
    dictColumnsResult[0].values.forEach((row: SqlValue[]) => {
      dictColumnNames.push(row[1] as string);
    });
  }
  
  if (!dictColumnNames.includes('createdAt')) {
    try {
      db.run("ALTER TABLE custom_dictionary ADD COLUMN createdAt TEXT DEFAULT CURRENT_TIMESTAMP");
    } catch (e) {
    }
  }
}

function cleanupOldHistory(): void {
  if (!db) return;
  const settings = getSettings();
  if (settings && settings.historyRetentionDays > 0) {
    db.run(
      `DELETE FROM transcript_history WHERE datetime(createdAt) < datetime('now', '-' || ? || ' days')`,
      [settings.historyRetentionDays]
    );
  }
}

const VALID_GEMINI_MODELS: GeminiModel[] = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash-preview-09-2025',
  'gemini-2.5-flash-lite-preview-09-2025',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

function isValidGeminiModel(model: string): model is GeminiModel {
  return VALID_GEMINI_MODELS.includes(model as GeminiModel);
}

function isValidTheme(theme: string): theme is 'dark' | 'light' | 'system' {
  return ['dark', 'light', 'system'].includes(theme);
}

export function getSettings(): Settings | null {
  if (!db) return null;
  
  const result = db.exec("SELECT * FROM settings WHERE id = 1");
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  const row: Record<string, SqlValue> = {};
  columns.forEach((col: string, i: number) => {
    row[col] = values[i];
  });
  
  const geminiModelStr = (row.geminiModel as string) || 'gemini-2.0-flash';
  const themeStr = (row.theme as string) || 'dark';
  
  return {
    id: row.id as number,
    geminiApiKey: (row.geminiApiKey as string) || '',
    geminiModel: isValidGeminiModel(geminiModelStr) ? geminiModelStr : 'gemini-2.0-flash',
    defaultLanguage: (row.defaultLanguage as string) || 'fr-FR',
    autoDetectLanguage: Boolean(row.autoDetectLanguage),
    hotkeyRecord: (row.hotkeyRecord as string) || 'CommandOrControl+Shift+Space',
    hotkeyInsert: (row.hotkeyInsert as string) || 'CommandOrControl+Shift+V',
    autoCleanup: Boolean(row.autoCleanup),
    contextAwareCleanup: row.contextAwareCleanup !== undefined ? Boolean(row.contextAwareCleanup) : true,
    saveHistory: row.saveHistory !== undefined ? Boolean(row.saveHistory) : true,
    historyRetentionDays: (row.historyRetentionDays as number) || 30,
    theme: isValidTheme(themeStr) ? themeStr : 'dark',
    minimizeToTray: row.minimizeToTray !== undefined ? Boolean(row.minimizeToTray) : true,
    launchAtStartup: Boolean(row.launchAtStartup),
    appVersion: app.getVersion(),
  };
}

export function saveSettings(settings: Partial<Settings>): void {
  if (!db) return;
  
  const fields: string[] = [];
  const values: (string | number)[] = [];
  
  const fieldMap: Record<string, { column: string; transform?: (v: unknown) => string | number }> = {
    geminiApiKey: { column: 'geminiApiKey' },
    geminiModel: { column: 'geminiModel' },
    defaultLanguage: { column: 'defaultLanguage' },
    autoDetectLanguage: { column: 'autoDetectLanguage', transform: (v) => v ? 1 : 0 },
    hotkeyRecord: { column: 'hotkeyRecord' },
    hotkeyInsert: { column: 'hotkeyInsert' },
    autoCleanup: { column: 'autoCleanup', transform: (v) => v ? 1 : 0 },
    contextAwareCleanup: { column: 'contextAwareCleanup', transform: (v) => v ? 1 : 0 },
    saveHistory: { column: 'saveHistory', transform: (v) => v ? 1 : 0 },
    historyRetentionDays: { column: 'historyRetentionDays' },
    theme: { column: 'theme' },
    minimizeToTray: { column: 'minimizeToTray', transform: (v) => v ? 1 : 0 },
    launchAtStartup: { column: 'launchAtStartup', transform: (v) => v ? 1 : 0 },
  };

  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined && fieldMap[key]) {
      const { column, transform } = fieldMap[key];
      fields.push(`${column} = ?`);
      values.push(transform ? transform(value) : value as string | number);
    }
  }
  
  if (fields.length > 0) {
    db.run(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`, values);
    saveDatabase();
  }
}

export function saveTranscript(data: {
  original: string;
  cleaned: string;
  language: string;
  context: string;
}): void {
  if (!db) return;
  
  const settings = getSettings();
  if (settings && !settings.saveHistory) return;

  const wordCount = data.cleaned.split(/\s+/).filter(w => w.length > 0).length;
  const contextName = CONTEXT_NAMES[data.context] || 'Général';
  
  db.run(
    `INSERT INTO transcript_history (original, cleaned, language, context, contextName, wordCount) VALUES (?, ?, ?, ?, ?, ?)`,
    [data.original, data.cleaned, data.language, data.context, contextName, wordCount]
  );
  saveDatabase();
}

export function getHistory(limit: number, offset: number, context?: string): TranscriptHistory[] {
  if (!db) return [];
  
  let sql = `SELECT * FROM transcript_history`;
  const params: (string | number)[] = [];
  
  if (context && context !== 'all') {
    sql += ` WHERE context = ?`;
    params.push(context);
  }
  
  sql += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const result = db.exec(sql, params);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map((row: SqlValue[]) => {
    const obj: Record<string, SqlValue> = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj as unknown as TranscriptHistory;
  });
}

export function deleteHistoryItem(id: number): void {
  if (!db) return;
  db.run('DELETE FROM transcript_history WHERE id = ?', [id]);
  saveDatabase();
}

export function clearHistory(): void {
  if (!db) return;
  db.run('DELETE FROM transcript_history');
  saveDatabase();
}

export function getStats(): { totalWords: number; todayWords: number; dbSize: string } {
  if (!db) return { totalWords: 0, todayWords: 0, dbSize: '0' };
  
  const totalResult = db.exec('SELECT COALESCE(SUM(wordCount), 0) as total FROM transcript_history');
  const total = totalResult.length > 0 && totalResult[0].values.length > 0 ? totalResult[0].values[0][0] as number : 0;

  const todayResult = db.exec(`
    SELECT COALESCE(SUM(wordCount), 0) as today 
    FROM transcript_history 
    WHERE date(createdAt) = date('now')
  `);
  const today = todayResult.length > 0 && todayResult[0].values.length > 0 ? todayResult[0].values[0][0] as number : 0;

  const filePath = getDbPath();
  let dbSize = '0';
  try {
    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / (1024 * 1024);
    dbSize = sizeMB.toFixed(2);
  } catch (e) {
  }

  return { totalWords: total, todayWords: today, dbSize };
}

export function getDictionary(): CustomDictionary[] {
  if (!db) return [];
  
  const result = db.exec('SELECT * FROM custom_dictionary ORDER BY term ASC');
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map((row: SqlValue[]) => {
    const obj: Record<string, SqlValue> = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj as unknown as CustomDictionary;
  });
}

export function addDictionaryTerm(term: string, replacement: string, context: string): void {
  if (!db) return;
  db.run(
    `INSERT INTO custom_dictionary (term, replacement, context) VALUES (?, ?, ?)`,
    [term, replacement, context]
  );
  saveDatabase();
}

export function updateDictionaryTerm(id: number, term: string, replacement: string, context: string): void {
  if (!db) return;
  db.run(
    `UPDATE custom_dictionary SET term = ?, replacement = ?, context = ? WHERE id = ?`,
    [term, replacement, context, id]
  );
  saveDatabase();
}

export function deleteDictionaryTerm(id: number): void {
  if (!db) return;
  db.run('DELETE FROM custom_dictionary WHERE id = ?', [id]);
  saveDatabase();
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}
