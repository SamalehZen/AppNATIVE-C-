export const APP_NAME = 'Speechly Clone';
export const APP_ID = 'com.speechly.clone';

export const DEFAULT_HOTKEYS = {
  record: 'CommandOrControl+Shift+Space',
  insert: 'CommandOrControl+Shift+V',
};

export const HISTORY_RETENTION_OPTIONS = [
  { value: 7, label: '7 jours' },
  { value: 30, label: '30 jours' },
  { value: 90, label: '90 jours' },
  { value: 365, label: '1 an' },
  { value: -1, label: 'Indéfiniment' },
];

export const CONTEXT_NAMES: Record<string, string> = {
  email: 'Email',
  chat: 'Messagerie',
  code: 'Code',
  document: 'Document',
  browser: 'Navigateur',
  social: 'Réseaux sociaux',
  ai: 'Assistant IA',
  spreadsheet: 'Tableur',
  terminal: 'Terminal',
  general: 'Général',
};

export const CONTEXT_ICONS: Record<string, string> = {
  email: 'mail',
  chat: 'message-circle',
  code: 'code',
  document: 'file-text',
  browser: 'globe',
  social: 'share-2',
  ai: 'bot',
  spreadsheet: 'table',
  terminal: 'terminal',
  general: 'edit',
};

export const THEME_OPTIONS = [
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
  { value: 'system', label: 'Système' },
] as const;

export const NAV_ITEMS = [
  { path: '/', icon: 'Mic', label: 'Dictée' },
  { path: '/snippets', icon: 'Zap', label: 'Snippets' },
  { path: '/analytics', icon: 'BarChart3', label: 'Analytics' },
  { path: '/history', icon: 'Clock', label: 'Historique' },
  { path: '/dictionary', icon: 'BookOpen', label: 'Dictionnaire' },
  { path: '/profile', icon: 'User', label: 'Profil' },
  { path: '/settings', icon: 'Settings', label: 'Paramètres' },
] as const;

import type { ModeConfig, DictationMode } from './types';

export const DICTATION_MODES: ModeConfig[] = [
  {
    id: 'auto',
    name: 'Auto',
    icon: 'Wand2',
    description: 'Détection automatique du contexte',
    outputFormat: 'plain',
    preserveExactWords: false,
  },
  {
    id: 'raw',
    name: 'Voice-to-Text',
    icon: 'Mic',
    description: 'Transcription brute sans modification',
    outputFormat: 'plain',
    preserveExactWords: true,
  },
  {
    id: 'email',
    name: 'Email',
    icon: 'Mail',
    description: 'Format email professionnel',
    outputFormat: 'plain',
    preserveExactWords: false,
  },
  {
    id: 'prompt',
    name: 'Prompt',
    icon: 'Terminal',
    description: 'Instructions IA structurées',
    outputFormat: 'plain',
    preserveExactWords: true,
  },
  {
    id: 'todo',
    name: 'Todo',
    icon: 'CheckSquare',
    description: 'Listes de tâches',
    outputFormat: 'structured',
    preserveExactWords: false,
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: 'FileText',
    description: 'Notes structurées',
    outputFormat: 'markdown',
    preserveExactWords: false,
  },
];

export const MODE_KEYBOARD_SHORTCUTS: Record<DictationMode, string> = {
  auto: 'Ctrl+1',
  raw: 'Ctrl+2',
  email: 'Ctrl+3',
  prompt: 'Ctrl+4',
  todo: 'Ctrl+5',
  notes: 'Ctrl+6',
};

export interface TranslationLanguage {
  code: string;
  name: string;
  flag: string;
  region?: string;
}

export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸', region: 'Americas' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧', region: 'Europe' },
  { code: 'en-AU', name: 'English (Australia)', flag: '🇦🇺', region: 'Oceania' },
  { code: 'en-CA', name: 'English (Canada)', flag: '🇨🇦', region: 'Americas' },
  { code: 'fr-FR', name: 'Français (France)', flag: '🇫🇷', region: 'Europe' },
  { code: 'fr-CA', name: 'Français (Canada)', flag: '🇨🇦', region: 'Americas' },
  { code: 'fr-BE', name: 'Français (Belgique)', flag: '🇧🇪', region: 'Europe' },
  { code: 'fr-CH', name: 'Français (Suisse)', flag: '🇨🇭', region: 'Europe' },
  { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸', region: 'Europe' },
  { code: 'es-MX', name: 'Español (México)', flag: '🇲🇽', region: 'Americas' },
  { code: 'es-AR', name: 'Español (Argentina)', flag: '🇦🇷', region: 'Americas' },
  { code: 'es-CO', name: 'Español (Colombia)', flag: '🇨🇴', region: 'Americas' },
  { code: 'de-DE', name: 'Deutsch (Deutschland)', flag: '🇩🇪', region: 'Europe' },
  { code: 'de-AT', name: 'Deutsch (Österreich)', flag: '🇦🇹', region: 'Europe' },
  { code: 'de-CH', name: 'Deutsch (Schweiz)', flag: '🇨🇭', region: 'Europe' },
  { code: 'it-IT', name: 'Italiano', flag: '🇮🇹', region: 'Europe' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷', region: 'Americas' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹', region: 'Europe' },
  { code: 'nl-NL', name: 'Nederlands', flag: '🇳🇱', region: 'Europe' },
  { code: 'nl-BE', name: 'Nederlands (België)', flag: '🇧🇪', region: 'Europe' },
  { code: 'pl-PL', name: 'Polski', flag: '🇵🇱', region: 'Europe' },
  { code: 'ru-RU', name: 'Русский', flag: '🇷🇺', region: 'Europe' },
  { code: 'uk-UA', name: 'Українська', flag: '🇺🇦', region: 'Europe' },
  { code: 'cs-CZ', name: 'Čeština', flag: '🇨🇿', region: 'Europe' },
  { code: 'sk-SK', name: 'Slovenčina', flag: '🇸🇰', region: 'Europe' },
  { code: 'hu-HU', name: 'Magyar', flag: '🇭🇺', region: 'Europe' },
  { code: 'ro-RO', name: 'Română', flag: '🇷🇴', region: 'Europe' },
  { code: 'bg-BG', name: 'Български', flag: '🇧🇬', region: 'Europe' },
  { code: 'hr-HR', name: 'Hrvatski', flag: '🇭🇷', region: 'Europe' },
  { code: 'sr-RS', name: 'Српски', flag: '🇷🇸', region: 'Europe' },
  { code: 'sl-SI', name: 'Slovenščina', flag: '🇸🇮', region: 'Europe' },
  { code: 'el-GR', name: 'Ελληνικά', flag: '🇬🇷', region: 'Europe' },
  { code: 'tr-TR', name: 'Türkçe', flag: '🇹🇷', region: 'Europe' },
  { code: 'sv-SE', name: 'Svenska', flag: '🇸🇪', region: 'Europe' },
  { code: 'da-DK', name: 'Dansk', flag: '🇩🇰', region: 'Europe' },
  { code: 'nb-NO', name: 'Norsk (Bokmål)', flag: '🇳🇴', region: 'Europe' },
  { code: 'fi-FI', name: 'Suomi', flag: '🇫🇮', region: 'Europe' },
  { code: 'et-EE', name: 'Eesti', flag: '🇪🇪', region: 'Europe' },
  { code: 'lv-LV', name: 'Latviešu', flag: '🇱🇻', region: 'Europe' },
  { code: 'lt-LT', name: 'Lietuvių', flag: '🇱🇹', region: 'Europe' },
  { code: 'zh-CN', name: '中文 (简体)', flag: '🇨🇳', region: 'Asia' },
  { code: 'zh-TW', name: '中文 (繁體)', flag: '🇹🇼', region: 'Asia' },
  { code: 'zh-HK', name: '中文 (香港)', flag: '🇭🇰', region: 'Asia' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵', region: 'Asia' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷', region: 'Asia' },
  { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳', region: 'Asia' },
  { code: 'th-TH', name: 'ไทย', flag: '🇹🇭', region: 'Asia' },
  { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩', region: 'Asia' },
  { code: 'ms-MY', name: 'Bahasa Melayu', flag: '🇲🇾', region: 'Asia' },
  { code: 'tl-PH', name: 'Tagalog', flag: '🇵🇭', region: 'Asia' },
  { code: 'hi-IN', name: 'हिन्दी', flag: '🇮🇳', region: 'Asia' },
  { code: 'bn-BD', name: 'বাংলা', flag: '🇧🇩', region: 'Asia' },
  { code: 'ta-IN', name: 'தமிழ்', flag: '🇮🇳', region: 'Asia' },
  { code: 'te-IN', name: 'తెలుగు', flag: '🇮🇳', region: 'Asia' },
  { code: 'mr-IN', name: 'मराठी', flag: '🇮🇳', region: 'Asia' },
  { code: 'gu-IN', name: 'ગુજરાતી', flag: '🇮🇳', region: 'Asia' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'Asia' },
  { code: 'ml-IN', name: 'മലയാളം', flag: '🇮🇳', region: 'Asia' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳', region: 'Asia' },
  { code: 'ur-PK', name: 'اردو', flag: '🇵🇰', region: 'Asia' },
  { code: 'fa-IR', name: 'فارسی', flag: '🇮🇷', region: 'Asia' },
  { code: 'ar-SA', name: 'العربية (السعودية)', flag: '🇸🇦', region: 'Middle East' },
  { code: 'ar-AE', name: 'العربية (الإمارات)', flag: '🇦🇪', region: 'Middle East' },
  { code: 'ar-EG', name: 'العربية (مصر)', flag: '🇪🇬', region: 'Middle East' },
  { code: 'ar-MA', name: 'العربية (المغرب)', flag: '🇲🇦', region: 'Africa' },
  { code: 'he-IL', name: 'עברית', flag: '🇮🇱', region: 'Middle East' },
  { code: 'sw-KE', name: 'Kiswahili', flag: '🇰🇪', region: 'Africa' },
  { code: 'zu-ZA', name: 'isiZulu', flag: '🇿🇦', region: 'Africa' },
  { code: 'af-ZA', name: 'Afrikaans', flag: '🇿🇦', region: 'Africa' },
  { code: 'am-ET', name: 'አማርኛ', flag: '🇪🇹', region: 'Africa' },
  { code: 'my-MM', name: 'မြန်မာဘာသာ', flag: '🇲🇲', region: 'Asia' },
  { code: 'km-KH', name: 'ភាសាខ្មែរ', flag: '🇰🇭', region: 'Asia' },
  { code: 'lo-LA', name: 'ລາວ', flag: '🇱🇦', region: 'Asia' },
  { code: 'ne-NP', name: 'नेपाली', flag: '🇳🇵', region: 'Asia' },
  { code: 'si-LK', name: 'සිංහල', flag: '🇱🇰', region: 'Asia' },
  { code: 'ka-GE', name: 'ქართული', flag: '🇬🇪', region: 'Europe' },
  { code: 'hy-AM', name: 'Հայերdelays', flag: '🇦🇲', region: 'Europe' },
  { code: 'az-AZ', name: 'Azərbaycan', flag: '🇦🇿', region: 'Asia' },
  { code: 'kk-KZ', name: 'Қазақ', flag: '🇰🇿', region: 'Asia' },
  { code: 'uz-UZ', name: "O'zbek", flag: '🇺🇿', region: 'Asia' },
  { code: 'mn-MN', name: 'Монгол', flag: '🇲🇳', region: 'Asia' },
  { code: 'is-IS', name: 'Íslenska', flag: '🇮🇸', region: 'Europe' },
  { code: 'ga-IE', name: 'Gaeilge', flag: '🇮🇪', region: 'Europe' },
  { code: 'cy-GB', name: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', region: 'Europe' },
  { code: 'eu-ES', name: 'Euskara', flag: '🇪🇸', region: 'Europe' },
  { code: 'ca-ES', name: 'Català', flag: '🇪🇸', region: 'Europe' },
  { code: 'gl-ES', name: 'Galego', flag: '🇪🇸', region: 'Europe' },
  { code: 'mt-MT', name: 'Malti', flag: '🇲🇹', region: 'Europe' },
  { code: 'lb-LU', name: 'Lëtzebuergesch', flag: '🇱🇺', region: 'Europe' },
];

export interface FormalityOption {
  id: 'formal' | 'neutral' | 'informal';
  name: string;
  description: string;
}

export const FORMALITY_LEVELS: FormalityOption[] = [
  { id: 'formal', name: 'Formel', description: 'Vouvoiement, style professionnel' },
  { id: 'neutral', name: 'Neutre', description: 'Style standard' },
  { id: 'informal', name: 'Informel', description: 'Tutoiement, style décontracté' },
];

export const DEFAULT_TRANSLATION_SETTINGS = {
  enabled: false,
  sourceLanguage: 'fr-FR',
  targetLanguage: 'en-US',
  preserveFormatting: true,
  formalityLevel: 'neutral' as const,
};

import type { RecordingSettings, RecordingTriggerMode, TriggerKey } from './types';

export const DEFAULT_RECORDING_SETTINGS: RecordingSettings = {
  triggerMode: 'double-tap' as RecordingTriggerMode,
  doubleTapKey: 'ctrl' as TriggerKey,
  doubleTapThreshold: 300,
  holdKey: 'ctrl' as TriggerKey,
  toggleHotkey: 'CommandOrControl+Shift+Space',
  autoStopAfterSilence: false,
  silenceThreshold: 3,
};

export const RECORDING_TRIGGER_MODES: { value: RecordingTriggerMode; label: string; description: string }[] = [
  { value: 'double-tap', label: 'Double-tap (recommandé)', description: 'Appuyez deux fois rapidement pour démarrer/arrêter' },
  { value: 'hold', label: 'Maintenir une touche', description: 'Maintenez la touche pour enregistrer' },
  { value: 'toggle', label: 'Raccourci clavier', description: 'Utilisez un raccourci pour basculer' },
];

export const TRIGGER_KEY_OPTIONS: { value: TriggerKey; label: string }[] = [
  { value: 'ctrl', label: 'Ctrl' },
  { value: 'alt', label: 'Alt' },
  { value: 'shift', label: 'Shift' },
  { value: 'capslock', label: 'CapsLock' },
];

import type { StyleLearningSettings } from './types';

export const DEFAULT_STYLE_LEARNING_SETTINGS: StyleLearningSettings = {
  enabled: true,
  autoLearn: true,
  minSamplesBeforeUse: 20,
  contextSpecificLearning: false,
};
