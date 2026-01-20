import crypto from 'crypto';
import keytar from 'keytar';

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const HASH_ALGORITHM = 'sha512';
const SERVICE_NAME = 'speechly-app';
const PASSWORD_HASH_ACCOUNT = 'password-hash';
const PASSWORD_SALT_ACCOUNT = 'password-salt';

export class PasswordService {
  private isUnlocked: boolean = false;
  private lastUnlockTime: number = 0;

  async setPassword(password: string): Promise<void> {
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }

    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, HASH_ALGORITHM);

    await keytar.setPassword(SERVICE_NAME, PASSWORD_HASH_ACCOUNT, hash.toString('base64'));
    await keytar.setPassword(SERVICE_NAME, PASSWORD_SALT_ACCOUNT, salt.toString('base64'));
  }

  async verifyPassword(password: string): Promise<boolean> {
    const storedHash = await keytar.getPassword(SERVICE_NAME, PASSWORD_HASH_ACCOUNT);
    const storedSalt = await keytar.getPassword(SERVICE_NAME, PASSWORD_SALT_ACCOUNT);

    if (!storedHash || !storedSalt) return false;

    try {
      const salt = Buffer.from(storedSalt, 'base64');
      const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, HASH_ALGORITHM);
      const expectedHash = Buffer.from(storedHash, 'base64');

      return crypto.timingSafeEqual(hash, expectedHash);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  async removePassword(): Promise<void> {
    try {
      await keytar.deletePassword(SERVICE_NAME, PASSWORD_HASH_ACCOUNT);
      await keytar.deletePassword(SERVICE_NAME, PASSWORD_SALT_ACCOUNT);
      this.isUnlocked = false;
    } catch (error) {
      console.error('Failed to remove password:', error);
      throw error;
    }
  }

  async hasPassword(): Promise<boolean> {
    try {
      const hash = await keytar.getPassword(SERVICE_NAME, PASSWORD_HASH_ACCOUNT);
      return !!hash;
    } catch {
      return false;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const isValid = await this.verifyPassword(currentPassword);
    if (!isValid) return false;

    await this.setPassword(newPassword);
    return true;
  }

  unlock(): void {
    this.isUnlocked = true;
    this.lastUnlockTime = Date.now();
  }

  lock(): void {
    this.isUnlocked = false;
  }

  isAppUnlocked(): boolean {
    return this.isUnlocked;
  }

  getLastUnlockTime(): number {
    return this.lastUnlockTime;
  }

  shouldAutoLock(autoLockTimeout: number): boolean {
    if (!this.isUnlocked) return false;
    if (autoLockTimeout <= 0) return false;

    const timeoutMs = autoLockTimeout * 60 * 1000;
    return Date.now() - this.lastUnlockTime > timeoutMs;
  }

  resetInactivityTimer(): void {
    if (this.isUnlocked) {
      this.lastUnlockTime = Date.now();
    }
  }
}

let passwordServiceInstance: PasswordService | null = null;

export function getPasswordService(): PasswordService {
  if (!passwordServiceInstance) {
    passwordServiceInstance = new PasswordService();
  }
  return passwordServiceInstance;
}
