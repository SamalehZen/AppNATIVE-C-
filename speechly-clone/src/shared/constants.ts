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
  { path: '/history', icon: 'Clock', label: 'Historique' },
  { path: '/dictionary', icon: 'BookOpen', label: 'Dictionnaire' },
  { path: '/settings', icon: 'Settings', label: 'Paramètres' },
] as const;
