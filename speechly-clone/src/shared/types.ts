export interface Settings {
  id: number;
  geminiApiKey: string;
  defaultLanguage: string;
  autoCleanup: boolean;
  theme: 'dark' | 'light';
  hotkeyRecord: string;
}

export interface TranscriptHistory {
  id: number;
  original: string;
  cleaned: string;
  language: string;
  context: string;
  createdAt: string;
  wordCount: number;
}

export interface CustomDictionary {
  id: number;
  term: string;
  replacement: string;
  context: string;
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

export interface ElectronAPI {
  getSettings: () => Promise<Settings | null>;
  saveSettings: (settings: Partial<Settings>) => Promise<void>;
  saveTranscript: (data: { original: string; cleaned: string; language: string; context: string }) => Promise<void>;
  getHistory: (limit: number, offset: number) => Promise<TranscriptHistory[]>;
  copyToClipboard: (text: string) => Promise<void>;
  getVersion: () => Promise<string>;
  cleanupTranscript: (text: string, options: CleanupOptions) => Promise<CleanupResult>;
  getActiveWindow: () => Promise<ActiveWindowInfo | null>;
  detectContext: (windowInfo: ActiveWindowInfo) => Promise<DetectedContext>;
  cleanupWithContext: (text: string, context: DetectedContext, language?: string) => Promise<ContextCleanupResult>;
  cleanupTranscriptAuto: (text: string, language?: string) => Promise<ContextCleanupResult>;
  onToggleRecording: (callback: () => void) => void;
  removeToggleRecordingListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
