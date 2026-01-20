import { RecordingTriggerMode, RecordingSettings, TriggerKey } from '../../shared/types';

interface NativeModule {
  registerDoubleTapListener: (key: TriggerKey, threshold: number, callback: (event: string) => void) => number;
  registerHoldListener: (key: TriggerKey, callback: (event: string, duration: number) => void) => number;
  unregisterDoubleTapListener: (id: number) => void;
  unregisterHoldListener: (id: number) => void;
}

let native: NativeModule | null = null;

try {
  native = require('../../../native');
} catch (e) {
  console.warn('Native module not available, recording triggers will be disabled');
}

export class RecordingTriggerService {
  private mode: RecordingTriggerMode = 'double-tap';
  private doubleTapListenerId: number | null = null;
  private holdListenerId: number | null = null;
  private isRecording: boolean = false;
  private onRecordingStart: () => void;
  private onRecordingStop: () => void;
  private settings: RecordingSettings | null = null;

  constructor(onStart: () => void, onStop: () => void) {
    this.onRecordingStart = onStart;
    this.onRecordingStop = onStop;
  }

  setMode(mode: RecordingTriggerMode, settings: RecordingSettings): void {
    this.cleanup();
    this.mode = mode;
    this.settings = settings;
    this.isRecording = false;

    if (!native) {
      console.warn('Native module not available, cannot set recording mode');
      return;
    }

    switch (mode) {
      case 'double-tap':
        this.setupDoubleTap(settings);
        break;
      case 'hold':
        this.setupHold(settings);
        break;
      case 'toggle':
        break;
    }
  }

  private setupDoubleTap(settings: RecordingSettings): void {
    if (!native) return;

    this.doubleTapListenerId = native.registerDoubleTapListener(
      settings.doubleTapKey,
      settings.doubleTapThreshold,
      (event: string) => {
        if (event === 'double-tap') {
          if (!this.isRecording) {
            this.isRecording = true;
            this.onRecordingStart();
          } else {
            this.isRecording = false;
            this.onRecordingStop();
          }
        }
      }
    );
  }

  private setupHold(settings: RecordingSettings): void {
    if (!native) return;

    this.holdListenerId = native.registerHoldListener(
      settings.holdKey,
      (event: string, duration: number) => {
        if (event === 'hold-start') {
          if (!this.isRecording) {
            this.isRecording = true;
            this.onRecordingStart();
          }
        } else if (event === 'hold-end') {
          if (this.isRecording) {
            this.isRecording = false;
            this.onRecordingStop();
          }
        }
      }
    );
  }

  toggle(): void {
    if (!this.isRecording) {
      this.isRecording = true;
      this.onRecordingStart();
    } else {
      this.isRecording = false;
      this.onRecordingStop();
    }
  }

  stopRecording(): void {
    if (this.isRecording) {
      this.isRecording = false;
      this.onRecordingStop();
    }
  }

  startRecording(): void {
    if (!this.isRecording) {
      this.isRecording = true;
      this.onRecordingStart();
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  cleanup(): void {
    if (!native) return;

    if (this.doubleTapListenerId !== null) {
      native.unregisterDoubleTapListener(this.doubleTapListenerId);
      this.doubleTapListenerId = null;
    }
    if (this.holdListenerId !== null) {
      native.unregisterHoldListener(this.holdListenerId);
      this.holdListenerId = null;
    }
  }

  updateSettings(settings: RecordingSettings): void {
    this.setMode(settings.triggerMode, settings);
  }
}

let recordingTriggerInstance: RecordingTriggerService | null = null;

export function getRecordingTriggerService(): RecordingTriggerService | null {
  return recordingTriggerInstance;
}

export function createRecordingTriggerService(
  onStart: () => void,
  onStop: () => void
): RecordingTriggerService {
  if (recordingTriggerInstance) {
    recordingTriggerInstance.cleanup();
  }
  recordingTriggerInstance = new RecordingTriggerService(onStart, onStop);
  return recordingTriggerInstance;
}
