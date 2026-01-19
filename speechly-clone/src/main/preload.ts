import { contextBridge, ipcRenderer } from 'electron';
import {
  Settings,
  CleanupOptions,
  CleanupResult,
  TranscriptHistory,
  ActiveWindowInfo,
  DetectedContext,
  ContextCleanupResult,
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

  getHistory: (limit: number, offset: number): Promise<TranscriptHistory[]> =>
    ipcRenderer.invoke('db:getHistory', limit, offset),

  copyToClipboard: (text: string): Promise<void> =>
    ipcRenderer.invoke('clipboard:copy', text),

  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),

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
});
