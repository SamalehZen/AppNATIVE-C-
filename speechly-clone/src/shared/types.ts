export type DictationMode = 'auto' | 'raw' | 'email' | 'prompt' | 'todo' | 'notes';

export interface StyleProfileMetrics {
  averageSentenceLength: number;
  vocabularyRichness: number;
  formalityScore: number;
  punctuationStyle: {
    semicolonUsage: number;
    exclamationUsage: number;
    ellipsisUsage: number;
  };
}

export interface StyleProfilePatterns {
  greetings: string[];
  closings: string[];
  transitions: string[];
  fillers: string[];
}

export interface StyleProfileVocabulary {
  frequentWords: Array<{ word: string; count: number }>;
  technicalTerms: string[];
  avoidedWords: string[];
}

export interface StyleSampleText {
  context: string;
  text: string;
  timestamp: number;
}

export interface StyleTrainingStats {
  totalSamples: number;
  lastTrainingDate: number;
  confidenceScore: number;
}

export interface StyleProfile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  metrics: StyleProfileMetrics;
  patterns: StyleProfilePatterns;
  vocabulary: StyleProfileVocabulary;
  sampleTexts: StyleSampleText[];
  trainingStats: StyleTrainingStats;
}

export interface StyleLearningSettings {
  enabled: boolean;
  autoLearn: boolean;
  minSamplesBeforeUse: number;
  contextSpecificLearning: boolean;
}

export interface TextMetrics {
  sentenceCount: number;
  wordCount: number;
  averageSentenceLength: number;
  uniqueWords: Set<string>;
  punctuationUsage: {
    semicolonUsage: number;
    exclamationUsage: number;
    ellipsisUsage: number;
  };
  formalityIndicators: {
    formalityScore: number;
    indicators: string[];
  };
}

export const DEFAULT_STYLE_PROFILE: StyleProfile = {
  id: 'default',
  name: 'Mon Style',
  createdAt: 0,
  updatedAt: 0,
  metrics: {
    averageSentenceLength: 0,
    vocabularyRichness: 0,
    formalityScore: 0.5,
    punctuationStyle: {
      semicolonUsage: 0,
      exclamationUsage: 0,
      ellipsisUsage: 0,
    },
  },
  patterns: {
    greetings: [],
    closings: [],
    transitions: [],
    fillers: [],
  },
  vocabulary: {
    frequentWords: [],
    technicalTerms: [],
    avoidedWords: [],
  },
  sampleTexts: [],
  trainingStats: {
    totalSamples: 0,
    lastTrainingDate: 0,
    confidenceScore: 0,
  },
};

export const DEFAULT_STYLE_LEARNING_SETTINGS: StyleLearningSettings = {
  enabled: true,
  autoLearn: true,
  minSamplesBeforeUse: 20,
  contextSpecificLearning: false,
};

export type RecordingTriggerMode = 'double-tap' | 'hold' | 'toggle';

export type TriggerKey = 'ctrl' | 'alt' | 'shift' | 'capslock' | 'fn';

export interface RecordingSettings {
  triggerMode: RecordingTriggerMode;
  doubleTapKey: TriggerKey;
  doubleTapThreshold: number;
  holdKey: TriggerKey;
  toggleHotkey: string;
  autoStopAfterSilence: boolean;
  silenceThreshold: number;
}

export type FormalityLevel = 'formal' | 'neutral' | 'informal';

export interface TranslationSettings {
  enabled: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  preserveFormatting: boolean;
  formalityLevel: FormalityLevel;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  processingTime: number;
}

export interface TranslationOptions {
  formalityLevel?: FormalityLevel;
  preserveFormatting?: boolean;
  context?: 'email' | 'chat' | 'document' | 'general';
}

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
  translation: TranslationSettings;
  recording: RecordingSettings;
  styleLearning: StyleLearningSettings;
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
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
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

export type LanguageRegion = 'europe' | 'americas' | 'asia' | 'middle-east' | 'africa' | 'oceania';

export type LanguageTier = 1 | 2 | 3 | 4 | 5;

export type SupportLevel = 'full' | 'partial' | 'none';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: LanguageRegion;
  tier: LanguageTier;
  speechRecognitionSupport: SupportLevel;
  translationSupport: SupportLevel;
  rtl: boolean;
  variants?: string[];
}

export interface LanguageRegionInfo {
  id: LanguageRegion;
  name: string;
  icon: string;
}

export interface LanguagePreferences {
  recentLanguages: string[];
  favoriteLanguages: string[];
  defaultRegion: LanguageRegion | null;
}

export const DEFAULT_LANGUAGE_PREFERENCES: LanguagePreferences = {
  recentLanguages: [],
  favoriteLanguages: [],
  defaultRegion: null,
};

export interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
  alternatives: Array<{ code: string; confidence: number }>;
}

export interface LanguagesData {
  languages: Language[];
  regions: LanguageRegionInfo[];
}

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
  translateText: (text: string, sourceLanguage: string, targetLanguage: string, options?: TranslationOptions) => Promise<TranslationResult>;
  detectLanguage: (text: string) => Promise<{ language: string; confidence: number }>;
  updateHotkey: (type: 'record' | 'insert', hotkey: string) => Promise<void>;
  setAutoLaunch: (enabled: boolean) => Promise<void>;
  onToggleRecording: (callback: () => void) => void;
  removeToggleRecordingListener: () => void;
  onNavigate: (callback: (path: string) => void) => void;
  removeNavigateListener: () => void;
  onToggleDictation: (callback: () => void) => void;
  removeToggleDictationListener: () => void;
  onRecordingStart: (callback: () => void) => void;
  removeRecordingStartListener: () => void;
  onRecordingStop: (callback: () => void) => void;
  removeRecordingStopListener: () => void;
  updateRecordingSettings: (settings: RecordingSettings) => Promise<void>;
  getProfile: () => Promise<UserProfile | null>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  trackDictationEvent: (event: DictationEvent) => Promise<void>;
  getAnalyticsSummary: (period: AnalyticsPeriod) => Promise<AnalyticsSummary>;
  getDailyStats: (date: string) => Promise<DailyStats | null>;
  getStatsRange: (startDate: string, endDate: string) => Promise<DailyStats[]>;
  exportAnalytics: (format: 'json' | 'csv', period: AnalyticsPeriod) => Promise<string>;
  getStyleProfile: () => Promise<StyleProfile | null>;
  saveStyleProfile: (profile: StyleProfile) => Promise<void>;
  addStyleSample: (text: string, context: string) => Promise<void>;
  getStyleSamples: (limit: number) => Promise<StyleSampleText[]>;
  clearStyleProfile: () => Promise<void>;
  learnFromCorrection: (original: string, corrected: string) => Promise<void>;
  getLanguagePreferences: () => Promise<LanguagePreferences>;
  addRecentLanguage: (code: string) => Promise<void>;
  toggleFavoriteLanguage: (code: string) => Promise<void>;
  setDefaultRegion: (region: LanguageRegion | null) => Promise<void>;
  detectLanguageAdvanced: (text: string) => Promise<LanguageDetectionResult>;
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
