import { ipcMain, clipboard, app } from 'electron';
import { getSettings, saveSettings, saveTranscript, getHistory } from './database';
import { cleanupTranscript, resetGenAI, cleanupWithContext, cleanupTranscriptAuto } from './gemini';
import { CleanupOptions, Settings, DetectedContext, ActiveWindowInfo } from '../shared/types';
import { getContextDetector } from './services/context-detector';

let nativeBridge: any = null;

async function getNativeBridge() {
  if (nativeBridge) return nativeBridge;
  
  try {
    const path = await import('path');
    const fs = await import('fs');
    
    const possiblePaths = [
      path.join(__dirname, '../../native/build/Release/speechly_native.node'),
      path.join(__dirname, '../native/build/Release/speechly_native.node'),
      path.join(process.cwd(), 'native/build/Release/speechly_native.node'),
    ];

    for (const modulePath of possiblePaths) {
      if (fs.existsSync(modulePath)) {
        nativeBridge = require(modulePath);
        return nativeBridge;
      }
    }
  } catch (error) {
    console.warn('Native module not available:', error);
  }
  
  return null;
}

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

  ipcMain.handle('window:getActive', async (): Promise<ActiveWindowInfo | null> => {
    try {
      const native = await getNativeBridge();
      if (!native) {
        return null;
      }
      const info = native.getActiveWindow();
      return info?.isValid ? info : null;
    } catch (error) {
      console.error('Failed to get active window:', error);
      return null;
    }
  });

  ipcMain.handle('context:detect', async (_, windowInfo: ActiveWindowInfo): Promise<DetectedContext> => {
    try {
      const detector = getContextDetector();
      return detector.detectContext(windowInfo);
    } catch (error) {
      console.error('Failed to detect context:', error);
      return {
        type: 'general',
        name: 'Général',
        icon: 'edit',
        appName: windowInfo?.processName || 'Unknown',
        confidence: 'low',
      };
    }
  });

  ipcMain.handle(
    'gemini:cleanupWithContext',
    async (
      _,
      text: string,
      context: DetectedContext,
      language?: string
    ) => {
      return cleanupWithContext(text, context, language);
    }
  );

  ipcMain.handle(
    'gemini:cleanupAuto',
    async (_, text: string, language?: string) => {
      try {
        const native = await getNativeBridge();
        let windowInfo = null;
        
        if (native) {
          const info = native.getActiveWindow();
          if (info?.isValid) {
            windowInfo = {
              title: info.title,
              processName: info.processName,
              bundleId: info.bundleId,
            };
          }
        }
        
        return cleanupTranscriptAuto(text, windowInfo, language);
      } catch (error) {
        console.error('Auto cleanup error:', error);
        return cleanupTranscriptAuto(text, null, language);
      }
    }
  );
}
