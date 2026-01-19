import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { Settings, TranscriptHistory, CustomDictionary } from '../shared/types';
import { CONTEXT_NAMES } from '../shared/constants';

let db: Database.Database;

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'speechly.db');
  db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      geminiApiKey TEXT DEFAULT '',
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
    );

    CREATE TABLE IF NOT EXISTS transcript_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original TEXT NOT NULL,
      cleaned TEXT NOT NULL,
      language TEXT NOT NULL,
      context TEXT DEFAULT 'general',
      contextName TEXT DEFAULT 'Général',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      wordCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS custom_dictionary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL,
      replacement TEXT NOT NULL,
      context TEXT DEFAULT 'all',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `);

  migrateDatabase();
  cleanupOldHistory();
}

function migrateDatabase(): void {
  const columns = db.prepare("PRAGMA table_info(settings)").all() as any[];
  const columnNames = columns.map(c => c.name);

  const newColumns = [
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
        db.exec(`ALTER TABLE settings ADD COLUMN ${col.name} ${col.def}`);
      } catch (e) {
      }
    }
  }

  const historyColumns = db.prepare("PRAGMA table_info(transcript_history)").all() as any[];
  const historyColumnNames = historyColumns.map(c => c.name);
  
  if (!historyColumnNames.includes('contextName')) {
    try {
      db.exec("ALTER TABLE transcript_history ADD COLUMN contextName TEXT DEFAULT 'Général'");
    } catch (e) {
    }
  }

  const dictColumns = db.prepare("PRAGMA table_info(custom_dictionary)").all() as any[];
  const dictColumnNames = dictColumns.map(c => c.name);
  
  if (!dictColumnNames.includes('createdAt')) {
    try {
      db.exec("ALTER TABLE custom_dictionary ADD COLUMN createdAt TEXT DEFAULT CURRENT_TIMESTAMP");
    } catch (e) {
    }
  }
}

function cleanupOldHistory(): void {
  const settings = getSettings();
  if (settings && settings.historyRetentionDays > 0) {
    const stmt = db.prepare(`
      DELETE FROM transcript_history 
      WHERE datetime(createdAt) < datetime('now', '-' || ? || ' days')
    `);
    stmt.run(settings.historyRetentionDays);
  }
}

export function getSettings(): Settings | null {
  const stmt = db.prepare('SELECT * FROM settings WHERE id = 1');
  const row = stmt.get() as any;
  if (!row) return null;
  
  return {
    id: row.id,
    geminiApiKey: row.geminiApiKey || '',
    defaultLanguage: row.defaultLanguage || 'fr-FR',
    autoDetectLanguage: Boolean(row.autoDetectLanguage),
    hotkeyRecord: row.hotkeyRecord || 'CommandOrControl+Shift+Space',
    hotkeyInsert: row.hotkeyInsert || 'CommandOrControl+Shift+V',
    autoCleanup: Boolean(row.autoCleanup),
    contextAwareCleanup: row.contextAwareCleanup !== undefined ? Boolean(row.contextAwareCleanup) : true,
    saveHistory: row.saveHistory !== undefined ? Boolean(row.saveHistory) : true,
    historyRetentionDays: row.historyRetentionDays || 30,
    theme: row.theme || 'dark',
    minimizeToTray: row.minimizeToTray !== undefined ? Boolean(row.minimizeToTray) : true,
    launchAtStartup: Boolean(row.launchAtStartup),
    appVersion: app.getVersion(),
  };
}

export function saveSettings(settings: Partial<Settings>): void {
  const fields: string[] = [];
  const values: any[] = [];
  
  const fieldMap: Record<string, { column: string; transform?: (v: any) => any }> = {
    geminiApiKey: { column: 'geminiApiKey' },
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
      values.push(transform ? transform(value) : value);
    }
  }
  
  if (fields.length > 0) {
    const stmt = db.prepare(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`);
    stmt.run(...values);
  }
}

export function saveTranscript(data: {
  original: string;
  cleaned: string;
  language: string;
  context: string;
}): void {
  const settings = getSettings();
  if (settings && !settings.saveHistory) return;

  const wordCount = data.cleaned.split(/\s+/).filter(w => w.length > 0).length;
  const contextName = CONTEXT_NAMES[data.context] || 'Général';
  
  const stmt = db.prepare(`
    INSERT INTO transcript_history (original, cleaned, language, context, contextName, wordCount)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(data.original, data.cleaned, data.language, data.context, contextName, wordCount);
}

export function getHistory(limit: number, offset: number, context?: string): TranscriptHistory[] {
  let sql = `SELECT * FROM transcript_history`;
  const params: any[] = [];
  
  if (context && context !== 'all') {
    sql += ` WHERE context = ?`;
    params.push(context);
  }
  
  sql += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const stmt = db.prepare(sql);
  return stmt.all(...params) as TranscriptHistory[];
}

export function deleteHistoryItem(id: number): void {
  const stmt = db.prepare('DELETE FROM transcript_history WHERE id = ?');
  stmt.run(id);
}

export function clearHistory(): void {
  db.exec('DELETE FROM transcript_history');
}

export function getStats(): { totalWords: number; todayWords: number; dbSize: string } {
  const totalStmt = db.prepare('SELECT COALESCE(SUM(wordCount), 0) as total FROM transcript_history');
  const total = (totalStmt.get() as any)?.total || 0;

  const todayStmt = db.prepare(`
    SELECT COALESCE(SUM(wordCount), 0) as today 
    FROM transcript_history 
    WHERE date(createdAt) = date('now')
  `);
  const today = (todayStmt.get() as any)?.today || 0;

  const dbPath = path.join(app.getPath('userData'), 'speechly.db');
  let dbSize = '0';
  try {
    const stats = fs.statSync(dbPath);
    const sizeMB = stats.size / (1024 * 1024);
    dbSize = sizeMB.toFixed(2);
  } catch (e) {
  }

  return { totalWords: total, todayWords: today, dbSize };
}

export function getDictionary(): CustomDictionary[] {
  const stmt = db.prepare('SELECT * FROM custom_dictionary ORDER BY term ASC');
  return stmt.all() as CustomDictionary[];
}

export function addDictionaryTerm(term: string, replacement: string, context: string): void {
  const stmt = db.prepare(`
    INSERT INTO custom_dictionary (term, replacement, context)
    VALUES (?, ?, ?)
  `);
  stmt.run(term, replacement, context);
}

export function updateDictionaryTerm(id: number, term: string, replacement: string, context: string): void {
  const stmt = db.prepare(`
    UPDATE custom_dictionary 
    SET term = ?, replacement = ?, context = ?
    WHERE id = ?
  `);
  stmt.run(term, replacement, context, id);
}

export function deleteDictionaryTerm(id: number): void {
  const stmt = db.prepare('DELETE FROM custom_dictionary WHERE id = ?');
  stmt.run(id);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
