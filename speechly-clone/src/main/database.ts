import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { Settings, TranscriptHistory, CustomDictionary } from '../shared/types';

let db: Database.Database;

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'speechly.db');
  db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      geminiApiKey TEXT DEFAULT '',
      defaultLanguage TEXT DEFAULT 'en-US',
      autoCleanup INTEGER DEFAULT 1,
      theme TEXT DEFAULT 'dark',
      hotkeyRecord TEXT DEFAULT 'CommandOrControl+Shift+Space',
      CHECK (id = 1)
    );

    CREATE TABLE IF NOT EXISTS transcript_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original TEXT NOT NULL,
      cleaned TEXT NOT NULL,
      language TEXT NOT NULL,
      context TEXT DEFAULT 'general',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      wordCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS custom_dictionary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL,
      replacement TEXT NOT NULL,
      context TEXT DEFAULT 'all'
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `);
}

export function getSettings(): Settings | null {
  const stmt = db.prepare('SELECT * FROM settings WHERE id = 1');
  const row = stmt.get() as any;
  if (!row) return null;
  return {
    id: row.id,
    geminiApiKey: row.geminiApiKey || '',
    defaultLanguage: row.defaultLanguage || 'en-US',
    autoCleanup: Boolean(row.autoCleanup),
    theme: row.theme || 'dark',
    hotkeyRecord: row.hotkeyRecord || 'CommandOrControl+Shift+Space',
  };
}

export function saveSettings(settings: Partial<Settings>): void {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (settings.geminiApiKey !== undefined) {
    fields.push('geminiApiKey = ?');
    values.push(settings.geminiApiKey);
  }
  if (settings.defaultLanguage !== undefined) {
    fields.push('defaultLanguage = ?');
    values.push(settings.defaultLanguage);
  }
  if (settings.autoCleanup !== undefined) {
    fields.push('autoCleanup = ?');
    values.push(settings.autoCleanup ? 1 : 0);
  }
  if (settings.theme !== undefined) {
    fields.push('theme = ?');
    values.push(settings.theme);
  }
  if (settings.hotkeyRecord !== undefined) {
    fields.push('hotkeyRecord = ?');
    values.push(settings.hotkeyRecord);
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
  const wordCount = data.cleaned.split(/\s+/).filter(w => w.length > 0).length;
  const stmt = db.prepare(`
    INSERT INTO transcript_history (original, cleaned, language, context, wordCount)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(data.original, data.cleaned, data.language, data.context, wordCount);
}

export function getHistory(limit: number, offset: number): TranscriptHistory[] {
  const stmt = db.prepare(`
    SELECT * FROM transcript_history 
    ORDER BY createdAt DESC 
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset) as TranscriptHistory[];
}

export function addDictionaryTerm(term: string, replacement: string, context: string): void {
  const stmt = db.prepare(`
    INSERT INTO custom_dictionary (term, replacement, context)
    VALUES (?, ?, ?)
  `);
  stmt.run(term, replacement, context);
}

export function getDictionary(): CustomDictionary[] {
  const stmt = db.prepare('SELECT * FROM custom_dictionary');
  return stmt.all() as CustomDictionary[];
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
