export type GeminiModel = 
  | 'gemini-3-flash-preview'
  | 'gemini-2.5-flash-preview-09-2025'
  | 'gemini-2.5-flash-lite-preview-09-2025'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-flash-8b'
  | 'gemini-1.5-pro';

export const GEMINI_MODELS: { value: GeminiModel; name: string; description: string }[] = [
  { value: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', description: 'Dernier modèle, très puissant (preview)' },
  { value: 'gemini-2.5-flash-preview-09-2025', name: 'Gemini 2.5 Flash Preview', description: 'Nouvelle génération (preview)' },
  { value: 'gemini-2.5-flash-lite-preview-09-2025', name: 'Gemini 2.5 Flash Lite Preview', description: 'Léger nouvelle gén (preview)' },
  { value: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Rapide et intelligent (recommandé)' },
  { value: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Ultra rapide, moins précis' },
  { value: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Équilibré vitesse/qualité' },
  { value: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Léger et économique' },
  { value: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Plus précis, plus lent' },
];

export interface Settings {
  id: number;
  geminiApiKey: string;
  geminiModel: GeminiModel;
  defaultLanguage: string;
  autoDetectLanguage: boolean;
  hotkeyRecord: string;
  hotkeyInsert: string;
  autoCleanup: boolean;
  contextAwareCleanup: boolean;
  saveHistory: boolean;
  historyRetentionDays: number;
  theme: 'dark' | 'light' | 'system';
  minimizeToTray: boolean;
  launchAtStartup: boolean;
  appVersion: string;
}

export interface TranscriptHistory {
  id: number;
  original: string;
  cleaned: string;
  language: string;
  context: string;
  contextName: string;
  createdAt: string;
  wordCount: number;
}

export interface CustomDictionary {
  id: number;
  term: string;
  replacement: string;
  context: string;
  createdAt: string;
}

export type CleanupContext = 
  | 'email'
  | 'chat'
  | 'document'
  | 'code'
  | 'browser'
  | 'social'
  | 'ai'
  | 'spreadsheet'
  | 'terminal'
  | 'general';

export interface DetectedContext {
  type: CleanupContext;
  name: string;
  icon: string;
  appName: string;
  confidence: 'high' | 'medium' | 'low';
  subContext?: string;
}

export interface ActiveWindowInfo {
  title: string;
  processName: string;
  bundleId: string;
  executablePath: string;
  pid: number;
  isValid: boolean;
}

export interface ContextCleanupResult extends CleanupResult {
  context?: DetectedContext;
  processingTime?: number;
}

export interface CleanupOptions {
  context?: CleanupContext;
  preserveStyle?: boolean;
  removeFillers?: boolean;
  language?: string;
}

export interface CleanupResult {
  original: string;
  cleaned: string;
  changes: string[];
}

export interface SupportedLanguage {
  code: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'fr-FR', name: 'Français' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Español' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'pt-BR', name: 'Português' },
  { code: 'ar-SA', name: 'العربية' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'ru-RU', name: 'Русский' },
  { code: 'nl-NL', name: 'Nederlands' },
  { code: 'pl-PL', name: 'Polski' },
  { code: 'tr-TR', name: 'Türkçe' },
];

export interface DailyStats {
  date: string;
  wordCount: number;
  transcriptCount: number;
}

export interface ElectronAPI {
  getSettings: () => Promise<Settings | null>;
  saveSettings: (settings: Partial<Settings>) => Promise<void>;
  saveTranscript: (data: { original: string; cleaned: string; language: string; context: string }) => Promise<void>;
  getHistory: (limit: number, offset: number, context?: string) => Promise<TranscriptHistory[]>;
  deleteHistoryItem: (id: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  getStats: () => Promise<{ totalWords: number; todayWords: number; dbSize: string }>;
  getDictionary: () => Promise<CustomDictionary[]>;
  addDictionaryTerm: (term: string, replacement: string, context: string) => Promise<void>;
  updateDictionaryTerm: (id: number, term: string, replacement: string, context: string) => Promise<void>;
  deleteDictionaryTerm: (id: number) => Promise<void>;
  copyToClipboard: (text: string) => Promise<void>;
  getVersion: () => Promise<string>;
  cleanupTranscript: (text: string, options: CleanupOptions) => Promise<CleanupResult>;
  getActiveWindow: () => Promise<ActiveWindowInfo | null>;
  detectContext: (windowInfo: ActiveWindowInfo) => Promise<DetectedContext>;
  cleanupWithContext: (text: string, context: DetectedContext, language?: string) => Promise<ContextCleanupResult>;
  cleanupTranscriptAuto: (text: string, language?: string) => Promise<ContextCleanupResult>;
  updateHotkey: (type: 'record' | 'insert', hotkey: string) => Promise<void>;
  setAutoLaunch: (enabled: boolean) => Promise<void>;
  onToggleRecording: (callback: () => void) => void;
  removeToggleRecordingListener: () => void;
  onNavigate: (callback: (path: string) => void) => void;
  removeNavigateListener: () => void;
  onToggleDictation: (callback: () => void) => void;
  removeToggleDictationListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
