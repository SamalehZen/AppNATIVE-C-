import crypto from 'crypto';
import keytar from 'keytar';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SERVICE_NAME = 'speechly-app';
const ACCOUNT_NAME = 'master-key';

export interface EncryptedData {
  data: string;
  iv: string;
  authTag: string;
  algorithm: string;
  version: number;
}

export class EncryptionService {
  private masterKey: Buffer | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      let storedKey = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);

      if (!storedKey) {
        const newKey = crypto.randomBytes(KEY_LENGTH);
        storedKey = newKey.toString('base64');
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, storedKey);
      }

      this.masterKey = Buffer.from(storedKey, 'base64');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      const fallbackKey = crypto.randomBytes(KEY_LENGTH);
      this.masterKey = fallbackKey;
      this.initialized = true;
    }
  }

  isInitialized(): boolean {
    return this.initialized && this.masterKey !== null;
  }

  encrypt(plaintext: string): EncryptedData {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      data: encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: ALGORITHM,
      version: 1,
    };
  }

  decrypt(encryptedData: EncryptedData): string {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');

      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - invalid key or corrupted data');
    }
  }

  encryptObject<T>(obj: T): EncryptedData {
    return this.encrypt(JSON.stringify(obj));
  }

  decryptObject<T>(encryptedData: EncryptedData): T {
    const json = this.decrypt(encryptedData);
    return JSON.parse(json) as T;
  }

  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async clearMasterKey(): Promise<void> {
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    } catch (error) {
      console.error('Failed to delete master key from keychain:', error);
    }
    if (this.masterKey) {
      this.masterKey.fill(0);
    }
    this.masterKey = null;
    this.initialized = false;
  }

  async exportKey(): Promise<string> {
    const key = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (!key) throw new Error('No master key found');
    return key;
  }

  async importKey(keyBase64: string): Promise<void> {
    const keyBuffer = Buffer.from(keyBase64, 'base64');
    if (keyBuffer.length !== KEY_LENGTH) {
      throw new Error('Invalid key length - must be 32 bytes');
    }

    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, keyBase64);
    this.masterKey = keyBuffer;
    this.initialized = true;
  }

  async hasStoredKey(): Promise<boolean> {
    try {
      const key = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      return !!key;
    } catch {
      return false;
    }
  }

  isEncryptedData(data: unknown): data is EncryptedData {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.data === 'string' &&
      typeof obj.iv === 'string' &&
      typeof obj.authTag === 'string' &&
      typeof obj.algorithm === 'string'
    );
  }

  secureWipe(buffer: Buffer): void {
    if (buffer) {
      crypto.randomFillSync(buffer);
      buffer.fill(0);
    }
  }
}

let encryptionServiceInstance: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new EncryptionService();
  }
  return encryptionServiceInstance;
}

export async function initializeEncryption(): Promise<EncryptionService> {
  const service = getEncryptionService();
  await service.initialize();
  return service;
}
