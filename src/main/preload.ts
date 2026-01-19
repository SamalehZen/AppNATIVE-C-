import { contextBridge, ipcRenderer } from 'electron';

export interface ActiveWindowInfo {
  title: string;
  processName: string;
  bundleId: string;
  executablePath: string;
  pid: number;
  isValid: boolean;
}

export interface InjectionResult {
  success: boolean;
  error: string;
}

export interface HotkeyInfo {
  modifiers: number;
  keyCode: number;
  accelerator: string;
}

export type InjectionMethod = 'clipboard' | 'direct' | 'auto';

const nativeAPI = {
  isAvailable: (): Promise<boolean> => ipcRenderer.invoke('native:isAvailable'),

  getPlatform: (): Promise<'win32' | 'darwin' | 'linux' | 'unknown'> =>
    ipcRenderer.invoke('native:getPlatform'),

  getActiveWindow: (): Promise<ActiveWindowInfo | null> =>
    ipcRenderer.invoke('native:getActiveWindow'),

  startWindowWatcher: (): Promise<boolean> =>
    ipcRenderer.invoke('native:startWindowWatcher'),

  stopWindowWatcher: (): Promise<void> =>
    ipcRenderer.invoke('native:stopWindowWatcher'),

  onWindowChanged: (callback: (info: ActiveWindowInfo) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: ActiveWindowInfo) =>
      callback(info);
    ipcRenderer.on('native:windowChanged', handler);
    return () => ipcRenderer.removeListener('native:windowChanged', handler);
  },

  injectText: (text: string, method?: InjectionMethod): Promise<InjectionResult> =>
    ipcRenderer.invoke('native:injectText', text, method),

  injectTextWithDelay: (text: string, delayMs: number): Promise<InjectionResult> =>
    ipcRenderer.invoke('native:injectTextWithDelay', text, delayMs),

  pasteFromClipboard: (): Promise<InjectionResult> =>
    ipcRenderer.invoke('native:pasteFromClipboard'),

  setClipboardText: (text: string): Promise<boolean> =>
    ipcRenderer.invoke('native:setClipboardText', text),

  getClipboardText: (): Promise<string> =>
    ipcRenderer.invoke('native:getClipboardText'),

  parseAccelerator: (accelerator: string): Promise<HotkeyInfo> =>
    ipcRenderer.invoke('native:parseAccelerator', accelerator),

  registerDictationHotkey: (accelerator: string): Promise<boolean> =>
    ipcRenderer.invoke('native:registerDictationHotkey', accelerator),

  unregisterDictationHotkey: (): Promise<boolean> =>
    ipcRenderer.invoke('native:unregisterDictationHotkey'),

  onDictationHotkeyPressed: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('native:dictationHotkeyPressed', handler);
    return () =>
      ipcRenderer.removeListener('native:dictationHotkeyPressed', handler);
  },

  onToggleDictation: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('toggle-dictation', handler);
    return () => ipcRenderer.removeListener('toggle-dictation', handler);
  },
};

contextBridge.exposeInMainWorld('speechlyNative', nativeAPI);

declare global {
  interface Window {
    speechlyNative: typeof nativeAPI;
  }
}
