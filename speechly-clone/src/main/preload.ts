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
});
