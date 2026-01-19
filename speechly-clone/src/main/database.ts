import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { Settings, TranscriptHistory, CustomDictionary, GeminiModel } from '../shared/types';
import { CONTEXT_NAMES } from '../shared/constants';

interface DatabaseData {
  settings: Settings | null;
  history: TranscriptHistory[];
  dictionary: CustomDictionary[];
  nextHistoryId: number;
  nextDictionaryId: number;
}

let data: DatabaseData = {
  settings: null,
  history: [],
  dictionary: [],
  nextHistoryId: 1,
  nextDictionaryId: 1,
};

function getDataPath(): string {
  return path.join(app.getPath('userData'), 'speechly-data.json');
}

function saveData(): void {
  try {
    fs.writeFileSync(getDataPath(), JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

function loadData(): void {
  try {
    const filePath = getDataPath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const loaded = JSON.parse(content) as DatabaseData;
      data = {
        settings: loaded.settings || null,
        history: loaded.history || [],
        dictionary: loaded.dictionary || [],
        nextHistoryId: loaded.nextHistoryId || 1,
        nextDictionaryId: loaded.nextDictionaryId || 1,
      };
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

const DEFAULT_SETTINGS: Omit<Settings, 'appVersion'> = {
  id: 1,
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  defaultLanguage: 'fr-FR',
  autoDetectLanguage: false,
  hotkeyRecord: 'CommandOrControl+Shift+Space',
  hotkeyInsert: 'CommandOrControl+Shift+V',
  autoCleanup: true,
  contextAwareCleanup: true,
  saveHistory: true,
  historyRetentionDays: 30,
  theme: 'dark',
  minimizeToTray: true,
  launchAtStartup: false,
};

export async function initDatabase(): Promise<void> {
  loadData();
  
  if (!data.settings) {
    data.settings = { ...DEFAULT_SETTINGS, appVersion: app.getVersion() };
    saveData();
  }
  
  cleanupOldHistory();
}

function cleanupOldHistory(): void {
  if (!data.settings || data.settings.historyRetentionDays <= 0) return;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - data.settings.historyRetentionDays);
  
  const originalLength = data.history.length;
  data.history = data.history.filter(item => {
    const itemDate = new Date(item.createdAt);
    return itemDate >= cutoffDate;
  });
  
  if (data.history.length !== originalLength) {
    saveData();
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
  if (!data.settings) return null;
  
  return {
    ...data.settings,
    geminiModel: isValidGeminiModel(data.settings.geminiModel) ? data.settings.geminiModel : 'gemini-2.0-flash',
    theme: isValidTheme(data.settings.theme) ? data.settings.theme : 'dark',
    appVersion: app.getVersion(),
  };
}

export function saveSettings(settings: Partial<Settings>): void {
  if (!data.settings) {
    data.settings = { ...DEFAULT_SETTINGS, appVersion: app.getVersion() };
  }
  
  data.settings = { ...data.settings, ...settings, appVersion: app.getVersion() };
  saveData();
}

export function saveTranscript(transcriptData: {
  original: string;
  cleaned: string;
  language: string;
  context: string;
}): void {
  if (data.settings && !data.settings.saveHistory) return;

  const wordCount = transcriptData.cleaned.split(/\s+/).filter(w => w.length > 0).length;
  const contextName = CONTEXT_NAMES[transcriptData.context] || 'Général';
  
  const newItem: TranscriptHistory = {
    id: data.nextHistoryId++,
    original: transcriptData.original,
    cleaned: transcriptData.cleaned,
    language: transcriptData.language,
    context: transcriptData.context,
    contextName,
    createdAt: new Date().toISOString(),
    wordCount,
  };
  
  data.history.unshift(newItem);
  saveData();
}

export function getHistory(limit: number, offset: number, context?: string): TranscriptHistory[] {
  let filtered = data.history;
  
  if (context && context !== 'all') {
    filtered = filtered.filter(item => item.context === context);
  }
  
  return filtered.slice(offset, offset + limit);
}

export function deleteHistoryItem(id: number): void {
  data.history = data.history.filter(item => item.id !== id);
  saveData();
}

export function clearHistory(): void {
  data.history = [];
  saveData();
}

export function getStats(): { totalWords: number; todayWords: number; dbSize: string } {
  const totalWords = data.history.reduce((sum, item) => sum + item.wordCount, 0);
  
  const today = new Date().toISOString().split('T')[0];
  const todayWords = data.history
    .filter(item => item.createdAt.startsWith(today))
    .reduce((sum, item) => sum + item.wordCount, 0);
  
  let dbSize = '0';
  try {
    const stats = fs.statSync(getDataPath());
    const sizeMB = stats.size / (1024 * 1024);
    dbSize = sizeMB.toFixed(2);
  } catch (e) {
    // File doesn't exist yet
  }

  return { totalWords, todayWords, dbSize };
}

export function getDictionary(): CustomDictionary[] {
  return [...data.dictionary].sort((a, b) => a.term.localeCompare(b.term));
}

export function addDictionaryTerm(term: string, replacement: string, context: string): void {
  const newTerm: CustomDictionary = {
    id: data.nextDictionaryId++,
    term,
    replacement,
    context,
    createdAt: new Date().toISOString(),
  };
  
  data.dictionary.push(newTerm);
  saveData();
}

export function updateDictionaryTerm(id: number, term: string, replacement: string, context: string): void {
  const index = data.dictionary.findIndex(item => item.id === id);
  if (index !== -1) {
    data.dictionary[index] = { ...data.dictionary[index], term, replacement, context };
    saveData();
  }
}

export function deleteDictionaryTerm(id: number): void {
  data.dictionary = data.dictionary.filter(item => item.id !== id);
  saveData();
}

export function closeDatabase(): void {
  saveData();
}
