import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'path';
import { getStats } from './database';

export type TrayState = 'idle' | 'recording' | 'processing';

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;
  private isRecording: boolean = false;
  private iconBasePath: string;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.iconBasePath = app.isPackaged
      ? path.join(process.resourcesPath, 'icons')
      : path.join(__dirname, '../../resources/icons');
  }

  create(): void {
    const icon = this.createIcon('idle');
    this.tray = new Tray(icon);

    this.updateContextMenu();

    this.tray.on('double-click', () => {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.focus();
      } else {
        this.mainWindow.show();
      }
    });

    this.tray.setToolTip('Speechly Clone - Prêt');
  }

  private createIcon(state: TrayState): Electron.NativeImage {
    const size = process.platform === 'darwin' ? 22 : 16;
    const canvas = nativeImage.createEmpty();
    
    const colors: Record<TrayState, string> = {
      idle: '#8b5cf6',
      recording: '#22c55e',
      processing: '#f59e0b',
    };
    
    const color = colors[state];
    
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="${color}"/>
        <path d="M${size/2} ${size*0.27}c${size*0.075} 0 ${size*0.136} ${size*0.061} ${size*0.136} ${size*0.136}v${size*0.273}c0 ${size*0.075}-${size*0.061} ${size*0.136}-${size*0.136} ${size*0.136}s-${size*0.136}-${size*0.061}-${size*0.136}-${size*0.136}v-${size*0.273}c0-${size*0.075} ${size*0.061}-${size*0.136} ${size*0.136}-${size*0.136}z" fill="white"/>
        <path d="M${size*0.32} ${size*0.5}c0 ${size*0.1} ${size*0.08} ${size*0.18} ${size*0.18} ${size*0.18}s${size*0.18}-${size*0.08} ${size*0.18}-${size*0.18}h${size*0.09}c0 ${size*0.13}-${size*0.09} ${size*0.24}-${size*0.22} ${size*0.26}v${size*0.12}h-${size*0.09}v-${size*0.12}c-${size*0.13}-${size*0.02}-${size*0.22}-${size*0.13}-${size*0.22}-${size*0.26}h${size*0.09}z" fill="white"/>
      </svg>
    `;

    return nativeImage.createFromBuffer(
      Buffer.from(svg),
      { width: size, height: size }
    );
  }

  private updateContextMenu(): void {
    const stats = getStats();
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: this.isRecording ? '⏹ Arrêter la dictée' : '🎤 Démarrer la dictée',
        click: () => this.toggleRecording(),
      },
      { type: 'separator' },
      {
        label: `📊 Aujourd'hui: ${stats.todayWords} mots`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: '🏠 Ouvrir',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.focus();
        },
      },
      {
        label: '⚙️ Paramètres',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.focus();
          this.mainWindow.webContents.send('navigate', '/settings');
        },
      },
      {
        label: '📜 Historique',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.focus();
          this.mainWindow.webContents.send('navigate', '/history');
        },
      },
      { type: 'separator' },
      {
        label: 'Quitter',
        click: () => app.quit(),
      },
    ]);

    this.tray?.setContextMenu(contextMenu);
  }

  setRecordingState(recording: boolean): void {
    this.isRecording = recording;

    const state: TrayState = recording ? 'recording' : 'idle';
    const icon = this.createIcon(state);
    this.tray?.setImage(icon);

    const tooltip = recording ? 'Speechly Clone - Enregistrement...' : 'Speechly Clone - Prêt';
    this.tray?.setToolTip(tooltip);

    this.updateContextMenu();
  }

  setProcessingState(): void {
    const icon = this.createIcon('processing');
    this.tray?.setImage(icon);
    this.tray?.setToolTip('Speechly Clone - Traitement...');
  }

  private toggleRecording(): void {
    this.mainWindow.webContents.send('toggle-dictation');
  }

  refreshStats(): void {
    this.updateContextMenu();
  }

  destroy(): void {
    this.tray?.destroy();
    this.tray = null;
  }
}
