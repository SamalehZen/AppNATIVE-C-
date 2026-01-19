import { ipcMain, clipboard, app } from 'electron';
import { getSettings, saveSettings, saveTranscript, getHistory } from './database';
import { cleanupTranscript, resetGenAI } from './gemini';
import { CleanupOptions, Settings } from '../shared/types';

export function registerIpcHandlers(): void {
  ipcMain.handle('db:getSettings', async () => {
    return getSettings();
  });

  ipcMain.handle('db:saveSettings', async (_, settings: Partial<Settings>) => {
    saveSettings(settings);
    if (settings.geminiApiKey !== undefined) {
      resetGenAI();
    }
  });

  ipcMain.handle('db:saveTranscript', async (_, data: {
    original: string;
    cleaned: string;
    language: string;
    context: string;
  }) => {
    saveTranscript(data);
  });

  ipcMain.handle('db:getHistory', async (_, limit: number, offset: number) => {
    return getHistory(limit, offset);
  });

  ipcMain.handle('clipboard:copy', async (_, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle('app:version', async () => {
    return app.getVersion();
  });

  ipcMain.handle('gemini:cleanup', async (_, text: string, options: CleanupOptions) => {
    return cleanupTranscript(text, options);
  });
}
