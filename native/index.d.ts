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

export function getActiveWindow(): ActiveWindowInfo;

export function startWindowWatcher(callback: WindowChangeCallback): boolean;

export function stopWindowWatcher(): void;

export function injectText(text: string, method?: InjectionMethod): InjectionResult;

export function injectTextWithDelay(text: string, delayMs: number): InjectionResult;

export function pasteFromClipboard(): InjectionResult;

export function setClipboardText(text: string): boolean;

export function getClipboardText(): string;

export function registerHotkey(accelerator: string, callback: HotkeyCallback): number;
export function registerHotkey(modifiers: number, keyCode: number, callback: HotkeyCallback): number;

export function unregisterHotkey(id: number): boolean;

export function unregisterAllHotkeys(): void;

export function parseAccelerator(accelerator: string): HotkeyInfo;

export type DoubleTapEvent = 'double-tap';
export type HoldEvent = 'hold-start' | 'hold-end';

export type DoubleTapCallback = (event: DoubleTapEvent) => void;
export type HoldEventCallback = (event: HoldEvent, duration?: number) => void;

export function registerDoubleTapListener(
  key: string,
  threshold: number,
  callback: DoubleTapCallback
): number;

export function registerHoldListener(
  key: string,
  callback: HoldEventCallback
): number;

export function unregisterDoubleTapListener(id: number): boolean;

export function unregisterHoldListener(id: number): boolean;

export function getPlatform(): 'win32' | 'darwin' | 'linux' | 'unknown';

export const Modifiers: {
  None: 0;
  Ctrl: 1;
  Alt: 2;
  Shift: 4;
  Meta: 8;
  Command: 8;
};
