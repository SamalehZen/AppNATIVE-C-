import { ipcMain, BrowserWindow, globalShortcut, app } from 'electron';
import {
  getActiveWindow,
  startWindowWatcher,
  stopWindowWatcher,
  injectText,
  injectTextWithDelay,
  pasteFromClipboard,
  setClipboardText,
  getClipboardText,
  registerHotkey,
  unregisterHotkey,
  unregisterAllHotkeys,
  parseAccelerator,
  getPlatform,
  isNativeModuleAvailable,
  ActiveWindowInfo,
  InjectionMethod,
} from './native-bridge';

let mainWindow: BrowserWindow | null = null;
let dictationHotkeyId: number = -1;
let windowWatcherActive = false;

export function setMainWindow(window: BrowserWindow): void {
  mainWindow = window;
}

export function initializeIpcHandlers(): void {
  ipcMain.handle('native:isAvailable', () => {
    return isNativeModuleAvailable();
  });

  ipcMain.handle('native:getPlatform', () => {
    return getPlatform();
  });

  ipcMain.handle('native:getActiveWindow', () => {
    return getActiveWindow();
  });

  ipcMain.handle('native:startWindowWatcher', (event) => {
    if (windowWatcherActive) {
      return true;
    }

    const success = startWindowWatcher((info: ActiveWindowInfo) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('native:windowChanged', info);
      }
    });

    windowWatcherActive = success;
    return success;
  });

  ipcMain.handle('native:stopWindowWatcher', () => {
    if (windowWatcherActive) {
      stopWindowWatcher();
      windowWatcherActive = false;
    }
  });

  ipcMain.handle(
    'native:injectText',
    (event, text: string, method?: InjectionMethod) => {
      return injectText(text, method);
    }
  );

  ipcMain.handle(
    'native:injectTextWithDelay',
    (event, text: string, delayMs: number) => {
      return injectTextWithDelay(text, delayMs);
    }
  );

  ipcMain.handle('native:pasteFromClipboard', () => {
    return pasteFromClipboard();
  });

  ipcMain.handle('native:setClipboardText', (event, text: string) => {
    return setClipboardText(text);
  });

  ipcMain.handle('native:getClipboardText', () => {
    return getClipboardText();
  });

  ipcMain.handle('native:parseAccelerator', (event, accelerator: string) => {
    return parseAccelerator(accelerator);
  });

  ipcMain.handle(
    'native:registerDictationHotkey',
    (event, accelerator: string) => {
      if (dictationHotkeyId >= 0) {
        unregisterHotkey(dictationHotkeyId);
      }

      dictationHotkeyId = registerHotkey(accelerator, () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('native:dictationHotkeyPressed');
        }
      });

      return dictationHotkeyId >= 0;
    }
  );

  ipcMain.handle('native:unregisterDictationHotkey', () => {
    if (dictationHotkeyId >= 0) {
      const success = unregisterHotkey(dictationHotkeyId);
      if (success) {
        dictationHotkeyId = -1;
      }
      return success;
    }
    return true;
  });
}

export function registerDefaultDictationHotkey(): void {
  const defaultHotkey = 'CommandOrControl+Shift+Space';

  try {
    globalShortcut.register(defaultHotkey, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('toggle-dictation');
      }
    });
  } catch (error) {
    console.error('Failed to register default dictation hotkey:', error);

    dictationHotkeyId = registerHotkey(defaultHotkey, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('toggle-dictation');
      }
    });
  }
}

export function cleanup(): void {
  if (windowWatcherActive) {
    stopWindowWatcher();
    windowWatcherActive = false;
  }

  if (dictationHotkeyId >= 0) {
    unregisterHotkey(dictationHotkeyId);
    dictationHotkeyId = -1;
  }

  unregisterAllHotkeys();
  globalShortcut.unregisterAll();
}

app.on('will-quit', cleanup);
