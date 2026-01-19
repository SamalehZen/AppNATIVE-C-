import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { initDatabase, closeDatabase, getSettings, saveSettings } from './database';
import { registerIpcHandlers } from './ipc-handlers';
import { TrayManager } from './tray';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;
let trayManager: TrayManager | null = null;

const isHidden = process.argv.includes('--hidden');

function createWindow(): void {
  const settings = getSettings();

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    show: !isHidden,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.on('close', (event) => {
    if (settings?.minimizeToTray && trayManager) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  trayManager = new TrayManager(mainWindow);
  trayManager.create();
}

function registerGlobalShortcuts(): void {
  const settings = getSettings();
  
  globalShortcut.unregisterAll();
  
  const hotkeyRecord = settings?.hotkeyRecord || 'CommandOrControl+Shift+Space';
  const hotkeyInsert = settings?.hotkeyInsert || 'CommandOrControl+Shift+V';

  try {
    globalShortcut.register(hotkeyRecord, () => {
      if (mainWindow) {
        mainWindow.webContents.send('toggle-recording');
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        mainWindow.focus();
        trayManager?.setRecordingState(true);
      }
    });
  } catch (error) {
    console.error('Failed to register record hotkey:', error);
  }

  try {
    globalShortcut.register(hotkeyInsert, () => {
      if (mainWindow) {
        mainWindow.webContents.send('insert-text');
      }
    });
  } catch (error) {
    console.error('Failed to register insert hotkey:', error);
  }
}

function updateHotkey(type: 'record' | 'insert', hotkey: string): void {
  const settings = getSettings();
  if (!settings) return;

  if (type === 'record') {
    saveSettings({ hotkeyRecord: hotkey });
  } else {
    saveSettings({ hotkeyInsert: hotkey });
  }
  
  registerGlobalShortcuts();
}

function setAutoLaunch(enabled: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true,
    args: ['--hidden'],
  });
  saveSettings({ launchAtStartup: enabled });
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function getTrayManager(): TrayManager | null {
  return trayManager;
}

export { updateHotkey, setAutoLaunch };

app.whenReady().then(async () => {
  await initDatabase();
  registerIpcHandlers();
  createWindow();
  registerGlobalShortcuts();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  trayManager?.destroy();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  closeDatabase();
});
