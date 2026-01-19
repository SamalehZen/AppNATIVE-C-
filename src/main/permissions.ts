import { systemPreferences, dialog, shell } from 'electron';

export interface PermissionStatus {
  accessibility: boolean;
  screenRecording: boolean;
}

export async function checkAccessibilityPermission(): Promise<boolean> {
  if (process.platform !== 'darwin') {
    return true;
  }

  const trusted = systemPreferences.isTrustedAccessibilityClient(false);
  return trusted;
}

export async function requestAccessibilityPermission(): Promise<boolean> {
  if (process.platform !== 'darwin') {
    return true;
  }

  const trusted = systemPreferences.isTrustedAccessibilityClient(false);
  if (trusted) {
    return true;
  }

  const result = await dialog.showMessageBox({
    type: 'warning',
    title: 'Accessibility Permission Required',
    message: 'Speechly needs accessibility permission to inject text into other applications.',
    detail: 'Click "Open System Preferences" to grant permission. After granting, restart the app.',
    buttons: ['Open System Preferences', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    systemPreferences.isTrustedAccessibilityClient(true);
    
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
  }

  return false;
}

export async function checkScreenRecordingPermission(): Promise<boolean> {
  if (process.platform !== 'darwin') {
    return true;
  }

  const status = systemPreferences.getMediaAccessStatus('screen');
  return status === 'granted';
}

export async function requestScreenRecordingPermission(): Promise<boolean> {
  if (process.platform !== 'darwin') {
    return true;
  }

  const status = systemPreferences.getMediaAccessStatus('screen');
  if (status === 'granted') {
    return true;
  }

  const result = await dialog.showMessageBox({
    type: 'warning',
    title: 'Screen Recording Permission Required',
    message: 'Speechly needs screen recording permission to detect the active window title.',
    detail: 'Click "Open System Preferences" to grant permission. After granting, restart the app.',
    buttons: ['Open System Preferences', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
  }

  return false;
}

export async function checkAllPermissions(): Promise<PermissionStatus> {
  const [accessibility, screenRecording] = await Promise.all([
    checkAccessibilityPermission(),
    checkScreenRecordingPermission(),
  ]);

  return { accessibility, screenRecording };
}

export async function requestAllPermissions(): Promise<PermissionStatus> {
  const accessibility = await requestAccessibilityPermission();
  
  if (!accessibility) {
    return { accessibility: false, screenRecording: false };
  }

  const screenRecording = await requestScreenRecordingPermission();

  return { accessibility, screenRecording };
}

export async function showPermissionDialog(): Promise<void> {
  if (process.platform !== 'darwin') {
    return;
  }

  const status = await checkAllPermissions();

  if (!status.accessibility || !status.screenRecording) {
    const missingPermissions: string[] = [];
    if (!status.accessibility) missingPermissions.push('Accessibility');
    if (!status.screenRecording) missingPermissions.push('Screen Recording');

    await dialog.showMessageBox({
      type: 'info',
      title: 'Permissions Required',
      message: `Speechly requires the following permissions: ${missingPermissions.join(', ')}`,
      detail: 'Please grant these permissions in System Preferences > Security & Privacy > Privacy.',
      buttons: ['OK'],
    });
  }
}

export function isWindows(): boolean {
  return process.platform === 'win32';
}

export function isMacOS(): boolean {
  return process.platform === 'darwin';
}

export function isLinux(): boolean {
  return process.platform === 'linux';
}
