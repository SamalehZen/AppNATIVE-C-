import { join } from 'path';
import { existsSync } from 'fs';

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
export type WindowChangeCallback = (info: ActiveWindowInfo) => void;
export type HotkeyCallback = () => void;

interface NativeModule {
  getActiveWindow(): ActiveWindowInfo;
  startWindowWatcher(callback: WindowChangeCallback): boolean;
  stopWindowWatcher(): void;
  injectText(text: string, method?: InjectionMethod): InjectionResult;
  injectTextWithDelay(text: string, delayMs: number): InjectionResult;
  pasteFromClipboard(): InjectionResult;
  setClipboardText(text: string): boolean;
  getClipboardText(): string;
  registerHotkey(accelerator: string, callback: HotkeyCallback): number;
  registerHotkey(modifiers: number, keyCode: number, callback: HotkeyCallback): number;
  unregisterHotkey(id: number): boolean;
  unregisterAllHotkeys(): void;
  parseAccelerator(accelerator: string): HotkeyInfo;
  getPlatform(): 'win32' | 'darwin' | 'linux' | 'unknown';
}

let nativeModule: NativeModule | null = null;
let loadError: Error | null = null;

export const Modifiers = {
  None: 0,
  Ctrl: 1,
  Alt: 2,
  Shift: 4,
  Meta: 8,
  Command: 8,
} as const;

function findNativeModule(): string | null {
  const possiblePaths = [
    join(__dirname, '../../native/build/Release/speechly_native.node'),
    join(__dirname, '../native/build/Release/speechly_native.node'),
    join(__dirname, '../../build/Release/speechly_native.node'),
    join(process.cwd(), 'native/build/Release/speechly_native.node'),
    join(process.cwd(), 'build/Release/speechly_native.node'),
  ];

  if (process.env.SPEECHLY_NATIVE_PATH) {
    possiblePaths.unshift(process.env.SPEECHLY_NATIVE_PATH);
  }

  for (const modulePath of possiblePaths) {
    if (existsSync(modulePath)) {
      return modulePath;
    }
  }

  return null;
}

export function loadNativeModule(): NativeModule {
  if (nativeModule) {
    return nativeModule;
  }

  if (loadError) {
    throw loadError;
  }

  const modulePath = findNativeModule();
  if (!modulePath) {
    loadError = new Error(
      'Native module not found. Run "npm run build:native" to build it.'
    );
    throw loadError;
  }

  try {
    nativeModule = require(modulePath) as NativeModule;
    return nativeModule;
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    throw loadError;
  }
}

export function isNativeModuleAvailable(): boolean {
  try {
    loadNativeModule();
    return true;
  } catch {
    return false;
  }
}

export function getActiveWindow(): ActiveWindowInfo | null {
  try {
    const native = loadNativeModule();
    const info = native.getActiveWindow();
    return info.isValid ? info : null;
  } catch (error) {
    console.error('Failed to get active window:', error);
    return null;
  }
}

export function startWindowWatcher(callback: WindowChangeCallback): boolean {
  try {
    const native = loadNativeModule();
    return native.startWindowWatcher(callback);
  } catch (error) {
    console.error('Failed to start window watcher:', error);
    return false;
  }
}

export function stopWindowWatcher(): void {
  try {
    const native = loadNativeModule();
    native.stopWindowWatcher();
  } catch (error) {
    console.error('Failed to stop window watcher:', error);
  }
}

export function injectText(
  text: string,
  method: InjectionMethod = 'auto'
): InjectionResult {
  try {
    const native = loadNativeModule();
    return native.injectText(text, method);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function injectTextWithDelay(
  text: string,
  delayMs: number
): InjectionResult {
  try {
    const native = loadNativeModule();
    return native.injectTextWithDelay(text, delayMs);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function pasteFromClipboard(): InjectionResult {
  try {
    const native = loadNativeModule();
    return native.pasteFromClipboard();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function setClipboardText(text: string): boolean {
  try {
    const native = loadNativeModule();
    return native.setClipboardText(text);
  } catch (error) {
    console.error('Failed to set clipboard text:', error);
    return false;
  }
}

export function getClipboardText(): string {
  try {
    const native = loadNativeModule();
    return native.getClipboardText();
  } catch (error) {
    console.error('Failed to get clipboard text:', error);
    return '';
  }
}

export function registerHotkey(
  acceleratorOrModifiers: string | number,
  callbackOrKeyCode: HotkeyCallback | number,
  callback?: HotkeyCallback
): number {
  try {
    const native = loadNativeModule();
    
    if (typeof acceleratorOrModifiers === 'string') {
      return native.registerHotkey(
        acceleratorOrModifiers,
        callbackOrKeyCode as HotkeyCallback
      );
    } else {
      return native.registerHotkey(
        acceleratorOrModifiers,
        callbackOrKeyCode as number,
        callback!
      );
    }
  } catch (error) {
    console.error('Failed to register hotkey:', error);
    return -1;
  }
}

export function unregisterHotkey(id: number): boolean {
  try {
    const native = loadNativeModule();
    return native.unregisterHotkey(id);
  } catch (error) {
    console.error('Failed to unregister hotkey:', error);
    return false;
  }
}

export function unregisterAllHotkeys(): void {
  try {
    const native = loadNativeModule();
    native.unregisterAllHotkeys();
  } catch (error) {
    console.error('Failed to unregister all hotkeys:', error);
  }
}

export function parseAccelerator(accelerator: string): HotkeyInfo {
  try {
    const native = loadNativeModule();
    return native.parseAccelerator(accelerator);
  } catch (error) {
    return { modifiers: 0, keyCode: 0, accelerator };
  }
}

export function getPlatform(): 'win32' | 'darwin' | 'linux' | 'unknown' {
  try {
    const native = loadNativeModule();
    return native.getPlatform();
  } catch {
    return 'unknown';
  }
}

export class WindowDetector {
  private callback: WindowChangeCallback | null = null;
  private watching = false;

  getActiveWindow(): ActiveWindowInfo | null {
    return getActiveWindow();
  }

  onActiveWindowChange(callback: WindowChangeCallback): void {
    if (this.watching) {
      this.stopWatching();
    }

    this.callback = callback;
    this.watching = startWindowWatcher(callback);
  }

  stopWatching(): void {
    if (this.watching) {
      stopWindowWatcher();
      this.watching = false;
      this.callback = null;
    }
  }

  isWatching(): boolean {
    return this.watching;
  }
}

export class TextInjector {
  injectText(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      const result = injectText(text);
      resolve(result.success);
    });
  }

  injectTextWithDelay(text: string, delayMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const result = injectTextWithDelay(text, delayMs);
      resolve(result.success);
    });
  }

  pasteFromClipboard(): Promise<boolean> {
    return new Promise((resolve) => {
      const result = pasteFromClipboard();
      resolve(result.success);
    });
  }
}

export class HotkeyManager {
  private hotkeyIds: Set<number> = new Set();

  register(accelerator: string, callback: HotkeyCallback): number {
    const id = registerHotkey(accelerator, callback);
    if (id >= 0) {
      this.hotkeyIds.add(id);
    }
    return id;
  }

  unregister(id: number): boolean {
    const success = unregisterHotkey(id);
    if (success) {
      this.hotkeyIds.delete(id);
    }
    return success;
  }

  unregisterAll(): void {
    unregisterAllHotkeys();
    this.hotkeyIds.clear();
  }

  getRegisteredCount(): number {
    return this.hotkeyIds.size;
  }
}

export default {
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
  loadNativeModule,
  Modifiers,
  WindowDetector,
  TextInjector,
  HotkeyManager,
};
