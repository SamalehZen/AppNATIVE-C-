export type DictationMode = 'auto' | 'raw' | 'email' | 'prompt' | 'todo' | 'notes';

export type ModeOutputFormat = 'plain' | 'markdown' | 'structured';

export interface ModeConfig {
  id: DictationMode;
  name: string;
  icon: string;
  description: string;
  outputFormat: ModeOutputFormat;
  preserveExactWords: boolean;
}

export interface UserProfileAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface UserProfileSignatures {
  formal: string;
  informal: string;
  professional: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string;
  company: string;
  department: string;
  email: string;
  phone: string;
  mobile: string;
  address: UserProfileAddress;
  linkedin: string;
  twitter: string;
  website: string;
  calendlyLink: string;
  signatures: UserProfileSignatures;
  preferredLanguage: string;
  timezone: string;
  avatarPath?: string;
  createdAt: number;
  updatedAt: number;
}

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
  defaultDictationMode: DictationMode;
  alwaysUseAutoMode: boolean;
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

export type SnippetCategory = 'personal' | 'financial' | 'links' | 'templates' | 'signatures';

export interface Snippet {
  id: string;
  triggerPhrase: string;
  triggerVariants: string[];
  content: string;
  category: SnippetCategory;
  isActive: boolean;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface SnippetReplacement {
  trigger: string;
  value: string;
  snippetId: string;
}

export interface SnippetDetectionResult {
  snippet: Snippet | null;
  matchedPhrase: string;
  position: { start: number; end: number };
}

export interface SnippetProcessResult {
  processedText: string;
  replacements: SnippetReplacement[];
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

export interface DictationEvent {
  id: string;
  timestamp: number;
  duration: number;
  wordCount: number;
  characterCount: number;
  language: string;
  context: string;
  mode: DictationMode;
  wasCleanedUp: boolean;
  wasTranslated: boolean;
  snippetsUsed: string[];
}

export interface DailyStats {
  date: string;
  wordCount: number;
  characterCount: number;
  sessionCount: number;
  totalDuration: number;
  averageSpeed: number;
  contexts: Record<string, number>;
  languages: Record<string, number>;
  modes: Record<string, number>;
}

export interface AnalyticsSummary {
  totalWords: number;
  totalCharacters: number;
  totalSessions: number;
  totalDuration: number;
  averageWordsPerDay: number;
  averageSessionDuration: number;
  averageSpeed: number;
  estimatedTimeSaved: number;
  estimatedTimeSavedFormatted: string;
  currentStreak: number;
  longestStreak: number;
  topContexts: Array<{ context: string; count: number; percentage: number }>;
  topLanguages: Array<{ language: string; count: number; percentage: number }>;
  topModes: Array<{ mode: string; count: number; percentage: number }>;
  topSnippets: Array<{ snippet: string; count: number }>;
  hourlyDistribution: number[];
  weeklyDistribution: number[];
}

export type AnalyticsPeriod = 'week' | 'month' | 'year' | 'all';

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
  getSnippets: () => Promise<Snippet[]>;
  getSnippetsByCategory: (category: SnippetCategory) => Promise<Snippet[]>;
  saveSnippet: (snippet: Snippet) => Promise<void>;
  updateSnippet: (id: string, updates: Partial<Snippet>) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  findSnippetByTrigger: (text: string) => Promise<Snippet | null>;
  incrementSnippetUsage: (id: string) => Promise<void>;
  processSnippets: (text: string) => Promise<SnippetProcessResult>;
  copyToClipboard: (text: string) => Promise<void>;
  getVersion: () => Promise<string>;
  cleanupTranscript: (text: string, options: CleanupOptions) => Promise<CleanupResult>;
  getActiveWindow: () => Promise<ActiveWindowInfo | null>;
  detectContext: (windowInfo: ActiveWindowInfo) => Promise<DetectedContext>;
  cleanupWithContext: (text: string, context: DetectedContext, language?: string) => Promise<ContextCleanupResult>;
  cleanupTranscriptAuto: (text: string, language?: string) => Promise<ContextCleanupResult>;
  cleanupWithMode: (text: string, mode: DictationMode, language?: string) => Promise<ContextCleanupResult>;
  updateHotkey: (type: 'record' | 'insert', hotkey: string) => Promise<void>;
  setAutoLaunch: (enabled: boolean) => Promise<void>;
  onToggleRecording: (callback: () => void) => void;
  removeToggleRecordingListener: () => void;
  onNavigate: (callback: (path: string) => void) => void;
  removeNavigateListener: () => void;
  onToggleDictation: (callback: () => void) => void;
  removeToggleDictationListener: () => void;
  getProfile: () => Promise<UserProfile | null>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  trackDictationEvent: (event: DictationEvent) => Promise<void>;
  getAnalyticsSummary: (period: AnalyticsPeriod) => Promise<AnalyticsSummary>;
  getDailyStats: (date: string) => Promise<DailyStats | null>;
  getStatsRange: (startDate: string, endDate: string) => Promise<DailyStats[]>;
  exportAnalytics: (format: 'json' | 'csv', period: AnalyticsPeriod) => Promise<string>;
}

export const SNIPPET_CATEGORIES: { value: SnippetCategory; label: string; icon: string }[] = [
  { value: 'personal', label: 'Personnel', icon: 'user' },
  { value: 'financial', label: 'Financier', icon: 'credit-card' },
  { value: 'links', label: 'Liens', icon: 'link' },
  { value: 'templates', label: 'Modèles', icon: 'file-text' },
  { value: 'signatures', label: 'Signatures', icon: 'pen-tool' },
];

export const DEFAULT_SNIPPETS: Omit<Snippet, 'id' | 'content' | 'usageCount' | 'createdAt' | 'updatedAt'>[] = [
  { triggerPhrase: 'mon email', triggerVariants: ['voici mon email', 'insère mon email', 'mon adresse email'], category: 'personal', isActive: true },
  { triggerPhrase: 'mon téléphone', triggerVariants: ['voici mon téléphone', 'mon numéro', 'mon numéro de téléphone'], category: 'personal', isActive: true },
  { triggerPhrase: 'mon adresse', triggerVariants: ['voici mon adresse', 'insère mon adresse', 'mon adresse postale'], category: 'personal', isActive: true },
  { triggerPhrase: 'mon IBAN', triggerVariants: ['voici mon IBAN', 'insère mon IBAN', 'mon numéro IBAN'], category: 'financial', isActive: true },
  { triggerPhrase: 'mon calendrier', triggerVariants: ['voici mon calendrier', 'mon lien calendrier', 'mon calendly'], category: 'links', isActive: true },
  { triggerPhrase: 'ma signature', triggerVariants: ['voici ma signature', 'insère ma signature', 'signe pour moi'], category: 'signatures', isActive: true },
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  firstName: '',
  lastName: '',
  fullName: '',
  jobTitle: '',
  company: '',
  department: '',
  email: '',
  phone: '',
  mobile: '',
  address: {
    street: '',
    city: '',
    postalCode: '',
    country: 'France',
  },
  linkedin: '',
  twitter: '',
  website: '',
  calendlyLink: '',
  signatures: {
    formal: 'Cordialement,\n{fullName}',
    informal: 'À bientôt,\n{firstName}',
    professional: 'Cordialement,\n\n{fullName}\n{jobTitle}\n{company}\n{email} | {phone}',
  },
  preferredLanguage: 'fr-FR',
  timezone: 'Europe/Paris',
  createdAt: 0,
  updatedAt: 0,
};

export const PROFILE_VARIABLES = [
  { key: '{firstName}', label: 'Prénom', description: 'Votre prénom' },
  { key: '{lastName}', label: 'Nom', description: 'Votre nom de famille' },
  { key: '{fullName}', label: 'Nom complet', description: 'Prénom + Nom' },
  { key: '{jobTitle}', label: 'Poste', description: 'Votre fonction' },
  { key: '{company}', label: 'Entreprise', description: 'Nom de votre entreprise' },
  { key: '{department}', label: 'Département', description: 'Votre service' },
  { key: '{email}', label: 'Email', description: 'Votre adresse email' },
  { key: '{phone}', label: 'Téléphone', description: 'Numéro fixe' },
  { key: '{mobile}', label: 'Mobile', description: 'Numéro mobile' },
];

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
