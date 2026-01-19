import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import {
  initializeIpcHandlers,
  setMainWindow,
  registerDefaultDictationHotkey,
  cleanup,
} from './ipc-handlers';
import {
  checkAllPermissions,
  requestAccessibilityPermission,
  isMacOS,
} from './permissions';
import { isNativeModuleAvailable } from './native-bridge';

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Speechly Clone',
  });

  setMainWindow(mainWindow);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initialize(): Promise<void> {
  console.log('Initializing Speechly Clone...');
  
  const nativeAvailable = isNativeModuleAvailable();
  console.log(`Native module available: ${nativeAvailable}`);

  if (isMacOS()) {
    console.log('Checking macOS permissions...');
    const permissions = await checkAllPermissions();
    
    if (!permissions.accessibility) {
      console.log('Accessibility permission not granted, requesting...');
      await requestAccessibilityPermission();
    }
    
    console.log('Permissions status:', permissions);
  }

  initializeIpcHandlers();
  registerDefaultDictationHotkey();
}

app.whenReady().then(async () => {
  await initialize();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  cleanup();
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
