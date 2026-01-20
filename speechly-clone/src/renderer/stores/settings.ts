import { create } from 'zustand';
import { Settings, DictationMode } from '../../shared/types';

interface SettingsStore {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
  id: 1,
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  defaultLanguage: 'fr-FR',
  autoDetectLanguage: false,
  hotkeyRecord: 'CommandOrControl+Shift+Space',
  hotkeyInsert: 'CommandOrControl+Shift+V',
  autoCleanup: true,
  contextAwareCleanup: true,
  defaultDictationMode: 'auto' as DictationMode,
  alwaysUseAutoMode: false,
  saveHistory: true,
  historyRetentionDays: 30,
  theme: 'dark',
  minimizeToTray: true,
  launchAtStartup: false,
  appVersion: '1.0.0',
};

export const useSettings = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoading: true,
  error: null,

  loadSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      const savedSettings = await window.electronAPI.getSettings();
      set({
        settings: savedSettings ? { ...defaultSettings, ...savedSettings } : defaultSettings,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false, error: 'Failed to load settings' });
    }
  },

  updateSettings: async (updates) => {
    const currentSettings = get().settings;
    const newSettings = { ...currentSettings, ...updates };
    
    set({ settings: newSettings });

    try {
      await window.electronAPI.saveSettings(updates);

      if (updates.hotkeyRecord) {
        await window.electronAPI.updateHotkey('record', updates.hotkeyRecord);
      }
      if (updates.hotkeyInsert) {
        await window.electronAPI.updateHotkey('insert', updates.hotkeyInsert);
      }
      if (updates.launchAtStartup !== undefined) {
        await window.electronAPI.setAutoLaunch(updates.launchAtStartup);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      set({ settings: currentSettings, error: 'Failed to save settings' });
    }
  },
}));
