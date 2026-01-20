import { ipcMain, clipboard, app } from 'electron';
import { 
  getSettings, 
  saveSettings, 
  saveTranscript, 
  getHistory,
  deleteHistoryItem,
  clearHistory,
  getStats,
  getDictionary,
  addDictionaryTerm,
  updateDictionaryTerm,
  deleteDictionaryTerm,
  getSnippets,
  getSnippetsByCategory,
  saveSnippet,
  updateSnippet,
  deleteSnippet,
  findSnippetByTrigger,
  incrementSnippetUsage,
  processSnippets,
  getUserProfile,
  saveUserProfile,
  updateUserProfile
} from './database';
import { cleanupTranscript, resetGenAI, cleanupWithContext, cleanupTranscriptAuto } from './gemini';
import { CleanupOptions, Settings, DetectedContext, ActiveWindowInfo, Snippet, SnippetCategory, UserProfile } from '../shared/types';
import { getContextDetector } from './services/context-detector';
import { updateHotkey, setAutoLaunch, getTrayManager } from './index';

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
    getTrayManager()?.refreshStats();
  });

  ipcMain.handle('db:getHistory', async (_, limit: number, offset: number, context?: string) => {
    return getHistory(limit, offset, context);
  });

  ipcMain.handle('db:deleteHistoryItem', async (_, id: number) => {
    deleteHistoryItem(id);
    getTrayManager()?.refreshStats();
  });

  ipcMain.handle('db:clearHistory', async () => {
    clearHistory();
    getTrayManager()?.refreshStats();
  });

  ipcMain.handle('db:getStats', async () => {
    return getStats();
  });

  ipcMain.handle('db:getDictionary', async () => {
    return getDictionary();
  });

  ipcMain.handle('db:addDictionaryTerm', async (_, term: string, replacement: string, context: string) => {
    addDictionaryTerm(term, replacement, context);
  });

  ipcMain.handle('db:updateDictionaryTerm', async (_, id: number, term: string, replacement: string, context: string) => {
    updateDictionaryTerm(id, term, replacement, context);
  });

  ipcMain.handle('db:deleteDictionaryTerm', async (_, id: number) => {
    deleteDictionaryTerm(id);
  });

  ipcMain.handle('clipboard:copy', async (_, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle('app:version', async () => {
    return app.getVersion();
  });

  ipcMain.handle('app:updateHotkey', async (_, type: 'record' | 'insert', hotkey: string) => {
    updateHotkey(type, hotkey);
  });

  ipcMain.handle('app:setAutoLaunch', async (_, enabled: boolean) => {
    setAutoLaunch(enabled);
  });

  ipcMain.handle('gemini:cleanup', async (_, text: string, options: CleanupOptions) => {
    getTrayManager()?.setProcessingState();
    try {
      const result = await cleanupTranscript(text, options);
      getTrayManager()?.setRecordingState(false);
      return result;
    } catch (error) {
      getTrayManager()?.setRecordingState(false);
      throw error;
    }
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
      getTrayManager()?.setProcessingState();
      try {
        const result = await cleanupWithContext(text, context, language);
        getTrayManager()?.setRecordingState(false);
        return result;
      } catch (error) {
        getTrayManager()?.setRecordingState(false);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'gemini:cleanupAuto',
    async (_, text: string, language?: string) => {
      getTrayManager()?.setProcessingState();
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
        
        const result = await cleanupTranscriptAuto(text, windowInfo, language);
        getTrayManager()?.setRecordingState(false);
        return result;
      } catch (error) {
        console.error('Auto cleanup error:', error);
        getTrayManager()?.setRecordingState(false);
        return cleanupTranscriptAuto(text, null, language);
      }
    }
  );

  ipcMain.handle('tray:setRecording', async (_, isRecording: boolean) => {
    getTrayManager()?.setRecordingState(isRecording);
  });

  ipcMain.handle('snippets:getAll', async () => {
    return getSnippets();
  });

  ipcMain.handle('snippets:getByCategory', async (_, category: SnippetCategory) => {
    return getSnippetsByCategory(category);
  });

  ipcMain.handle('snippets:save', async (_, snippet: Snippet) => {
    saveSnippet(snippet);
  });

  ipcMain.handle('snippets:update', async (_, id: string, updates: Partial<Snippet>) => {
    updateSnippet(id, updates);
  });

  ipcMain.handle('snippets:delete', async (_, id: string) => {
    deleteSnippet(id);
  });

  ipcMain.handle('snippets:findByTrigger', async (_, text: string) => {
    return findSnippetByTrigger(text);
  });

  ipcMain.handle('snippets:incrementUsage', async (_, id: string) => {
    incrementSnippetUsage(id);
  });

  ipcMain.handle('snippets:process', async (_, text: string) => {
    return processSnippets(text);
  });

  ipcMain.handle('profile:get', async () => {
    return getUserProfile();
  });

  ipcMain.handle('profile:save', async (_, profile: UserProfile) => {
    saveUserProfile(profile);
  });

  ipcMain.handle('profile:update', async (_, updates: Partial<UserProfile>) => {
    updateUserProfile(updates);
  });
}
