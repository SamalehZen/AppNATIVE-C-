import { contextBridge, ipcRenderer } from 'electron';
import {
  Settings,
  CleanupOptions,
  CleanupResult,
  TranscriptHistory,
  ActiveWindowInfo,
  DetectedContext,
  ContextCleanupResult,
  CustomDictionary,
  Snippet,
  SnippetCategory,
  SnippetProcessResult,
  UserProfile,
  DictationMode,
  DictationEvent,
  AnalyticsSummary,
  DailyStats,
  AnalyticsPeriod,
  TranslationResult,
  TranslationOptions,
  RecordingSettings,
  StyleProfile,
  StyleSampleText,
  LanguagePreferences,
  LanguageRegion,
  LanguageDetectionResult,
} from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: (): Promise<Settings | null> =>
    ipcRenderer.invoke('db:getSettings'),

  saveSettings: (settings: Partial<Settings>): Promise<void> =>
    ipcRenderer.invoke('db:saveSettings', settings),

  saveTranscript: (data: {
    original: string;
    cleaned: string;
    language: string;
    context: string;
  }): Promise<void> => ipcRenderer.invoke('db:saveTranscript', data),

  getHistory: (limit: number, offset: number, context?: string): Promise<TranscriptHistory[]> =>
    ipcRenderer.invoke('db:getHistory', limit, offset, context),

  deleteHistoryItem: (id: number): Promise<void> =>
    ipcRenderer.invoke('db:deleteHistoryItem', id),

  clearHistory: (): Promise<void> =>
    ipcRenderer.invoke('db:clearHistory'),

  getStats: (): Promise<{ totalWords: number; todayWords: number; dbSize: string }> =>
    ipcRenderer.invoke('db:getStats'),

  getDictionary: (): Promise<CustomDictionary[]> =>
    ipcRenderer.invoke('db:getDictionary'),

  addDictionaryTerm: (term: string, replacement: string, context: string): Promise<void> =>
    ipcRenderer.invoke('db:addDictionaryTerm', term, replacement, context),

  updateDictionaryTerm: (id: number, term: string, replacement: string, context: string): Promise<void> =>
    ipcRenderer.invoke('db:updateDictionaryTerm', id, term, replacement, context),

  deleteDictionaryTerm: (id: number): Promise<void> =>
    ipcRenderer.invoke('db:deleteDictionaryTerm', id),

  getSnippets: (): Promise<Snippet[]> =>
    ipcRenderer.invoke('snippets:getAll'),

  getSnippetsByCategory: (category: SnippetCategory): Promise<Snippet[]> =>
    ipcRenderer.invoke('snippets:getByCategory', category),

  saveSnippet: (snippet: Snippet): Promise<void> =>
    ipcRenderer.invoke('snippets:save', snippet),

  updateSnippet: (id: string, updates: Partial<Snippet>): Promise<void> =>
    ipcRenderer.invoke('snippets:update', id, updates),

  deleteSnippet: (id: string): Promise<void> =>
    ipcRenderer.invoke('snippets:delete', id),

  findSnippetByTrigger: (text: string): Promise<Snippet | null> =>
    ipcRenderer.invoke('snippets:findByTrigger', text),

  incrementSnippetUsage: (id: string): Promise<void> =>
    ipcRenderer.invoke('snippets:incrementUsage', id),

  processSnippets: (text: string): Promise<SnippetProcessResult> =>
    ipcRenderer.invoke('snippets:process', text),

  copyToClipboard: (text: string): Promise<void> =>
    ipcRenderer.invoke('clipboard:copy', text),

  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),

  updateHotkey: (type: 'record' | 'insert', hotkey: string): Promise<void> =>
    ipcRenderer.invoke('app:updateHotkey', type, hotkey),

  setAutoLaunch: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('app:setAutoLaunch', enabled),

  cleanupTranscript: (
    text: string,
    options: CleanupOptions
  ): Promise<CleanupResult> => ipcRenderer.invoke('gemini:cleanup', text, options),

  getActiveWindow: (): Promise<ActiveWindowInfo | null> =>
    ipcRenderer.invoke('window:getActive'),

  detectContext: (windowInfo: ActiveWindowInfo): Promise<DetectedContext> =>
    ipcRenderer.invoke('context:detect', windowInfo),

  cleanupWithContext: (
    text: string,
    context: DetectedContext,
    language?: string
  ): Promise<ContextCleanupResult> =>
    ipcRenderer.invoke('gemini:cleanupWithContext', text, context, language),

  cleanupTranscriptAuto: (
    text: string,
    language?: string
  ): Promise<ContextCleanupResult> =>
    ipcRenderer.invoke('gemini:cleanupAuto', text, language),

  cleanupWithMode: (
    text: string,
    mode: DictationMode,
    language?: string
  ): Promise<ContextCleanupResult> =>
    ipcRenderer.invoke('gemini:cleanupWithMode', text, mode, language),

  onToggleRecording: (callback: () => void): void => {
    ipcRenderer.on('toggle-recording', callback);
  },

  removeToggleRecordingListener: (): void => {
    ipcRenderer.removeAllListeners('toggle-recording');
  },

  onToggleDictation: (callback: () => void): void => {
    ipcRenderer.on('toggle-dictation', callback);
  },

  removeToggleDictationListener: (): void => {
    ipcRenderer.removeAllListeners('toggle-dictation');
  },

  onNavigate: (callback: (path: string) => void): void => {
    ipcRenderer.on('navigate', (_, path) => callback(path));
  },

  removeNavigateListener: (): void => {
    ipcRenderer.removeAllListeners('navigate');
  },

  onInsertText: (callback: () => void): void => {
    ipcRenderer.on('insert-text', callback);
  },

  removeInsertTextListener: (): void => {
    ipcRenderer.removeAllListeners('insert-text');
  },

  setTrayRecording: (isRecording: boolean): Promise<void> =>
    ipcRenderer.invoke('tray:setRecording', isRecording),

  getProfile: (): Promise<UserProfile | null> =>
    ipcRenderer.invoke('profile:get'),

  saveProfile: (profile: UserProfile): Promise<void> =>
    ipcRenderer.invoke('profile:save', profile),

  updateProfile: (updates: Partial<UserProfile>): Promise<void> =>
    ipcRenderer.invoke('profile:update', updates),

  trackDictationEvent: (event: DictationEvent): Promise<void> =>
    ipcRenderer.invoke('analytics:track', event),

  getAnalyticsSummary: (period: AnalyticsPeriod): Promise<AnalyticsSummary> =>
    ipcRenderer.invoke('analytics:summary', period),

  getDailyStats: (date: string): Promise<DailyStats | null> =>
    ipcRenderer.invoke('analytics:daily', date),

  getStatsRange: (startDate: string, endDate: string): Promise<DailyStats[]> =>
    ipcRenderer.invoke('analytics:range', startDate, endDate),

  exportAnalytics: (format: 'json' | 'csv', period: AnalyticsPeriod): Promise<string> =>
    ipcRenderer.invoke('analytics:export', format, period),

  translateText: (
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    options?: TranslationOptions
  ): Promise<TranslationResult> =>
    ipcRenderer.invoke('translate:text', text, sourceLanguage, targetLanguage, options),

  detectLanguage: (text: string): Promise<{ language: string; confidence: number }> =>
    ipcRenderer.invoke('translate:detect', text),

  onRecordingStart: (callback: () => void): void => {
    ipcRenderer.on('recording:start', callback);
  },

  removeRecordingStartListener: (): void => {
    ipcRenderer.removeAllListeners('recording:start');
  },

  onRecordingStop: (callback: () => void): void => {
    ipcRenderer.on('recording:stop', callback);
  },

  removeRecordingStopListener: (): void => {
    ipcRenderer.removeAllListeners('recording:stop');
  },

  updateRecordingSettings: (settings: RecordingSettings): Promise<void> =>
    ipcRenderer.invoke('recording:updateSettings', settings),

  getStyleProfile: (): Promise<StyleProfile | null> =>
    ipcRenderer.invoke('style:getProfile'),

  saveStyleProfile: (profile: StyleProfile): Promise<void> =>
    ipcRenderer.invoke('style:saveProfile', profile),

  addStyleSample: (text: string, context: string): Promise<void> =>
    ipcRenderer.invoke('style:addSample', text, context),

  getStyleSamples: (limit: number): Promise<StyleSampleText[]> =>
    ipcRenderer.invoke('style:getSamples', limit),

  clearStyleProfile: (): Promise<void> =>
    ipcRenderer.invoke('style:clearProfile'),

  learnFromCorrection: (original: string, corrected: string): Promise<void> =>
    ipcRenderer.invoke('style:learnFromCorrection', original, corrected),

  getLanguagePreferences: (): Promise<LanguagePreferences> =>
    ipcRenderer.invoke('language:getPreferences'),

  addRecentLanguage: (code: string): Promise<void> =>
    ipcRenderer.invoke('language:addRecent', code),

  toggleFavoriteLanguage: (code: string): Promise<void> =>
    ipcRenderer.invoke('language:toggleFavorite', code),

  setDefaultRegion: (region: LanguageRegion | null): Promise<void> =>
    ipcRenderer.invoke('language:setDefaultRegion', region),

  detectLanguageAdvanced: (text: string): Promise<LanguageDetectionResult> =>
    ipcRenderer.invoke('language:detectAdvanced', text),

  securityUnlock: (password: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('security:unlock', password),

  securitySetPassword: (password: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('security:setPassword', password),

  securityRemovePassword: (currentPassword: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('security:removePassword', currentPassword),

  securityChangePassword: (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('security:changePassword', currentPassword, newPassword),

  securityExportKey: (): Promise<string> =>
    ipcRenderer.invoke('security:exportKey'),

  securityImportKey: (key: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('security:importKey', key),

  securityIsLocked: (): Promise<boolean> =>
    ipcRenderer.invoke('security:isLocked'),

  securityHasPassword: (): Promise<boolean> =>
    ipcRenderer.invoke('security:hasPassword'),

  securityLock: (): Promise<void> =>
    ipcRenderer.invoke('security:lock'),

  onAppLocked: (callback: () => void): void => {
    ipcRenderer.on('app:locked', callback);
  },

  removeAppLockedListener: (): void => {
    ipcRenderer.removeAllListeners('app:locked');
  },

  onAppUnlocked: (callback: () => void): void => {
    ipcRenderer.on('app:unlocked', callback);
  },

  removeAppUnlockedListener: (): void => {
    ipcRenderer.removeAllListeners('app:unlocked');
  },
});
