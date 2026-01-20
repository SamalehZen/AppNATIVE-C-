import { EncryptionService, EncryptedData } from './encryption-service';
import * as db from '../database';
import { Settings, TranscriptHistory, Snippet, UserProfile, SnippetProcessResult, SnippetCategory } from '../../shared/types';

type SensitiveLevel = 'critical' | 'sensitive' | 'none';

interface FieldConfig {
  level: SensitiveLevel;
  encrypt: boolean;
}

const SENSITIVE_FIELDS: Record<string, FieldConfig> = {
  geminiApiKey: { level: 'critical', encrypt: true },
  'profile.email': { level: 'critical', encrypt: true },
  'profile.phone': { level: 'critical', encrypt: true },
  'profile.mobile': { level: 'critical', encrypt: true },
  'profile.address': { level: 'critical', encrypt: true },
  'profile.linkedin': { level: 'sensitive', encrypt: true },
  'profile.calendlyLink': { level: 'sensitive', encrypt: true },
  'snippet.content': { level: 'critical', encrypt: true },
  'history.original': { level: 'critical', encrypt: true },
  'history.cleaned': { level: 'critical', encrypt: true },
  'history.translatedText': { level: 'critical', encrypt: true },
};

export class SecureDatabase {
  private encryption: EncryptionService;

  constructor(encryption: EncryptionService) {
    this.encryption = encryption;
  }

  private isEncryptedData(data: unknown): data is EncryptedData {
    return this.encryption.isEncryptedData(data);
  }

  private encryptField(value: string): EncryptedData {
    if (!value) return value as unknown as EncryptedData;
    return this.encryption.encrypt(value);
  }

  private decryptField(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (this.isEncryptedData(value)) {
      try {
        return this.encryption.decrypt(value);
      } catch (e) {
        console.error('Failed to decrypt field:', e);
        return '';
      }
    }
    return '';
  }

  async saveSettings(settings: Partial<Settings>): Promise<void> {
    const secureSettings = { ...settings };

    if (settings.geminiApiKey && typeof settings.geminiApiKey === 'string') {
      (secureSettings as any).geminiApiKey = this.encryptField(settings.geminiApiKey);
    }

    db.saveSettings(secureSettings);
  }

  getSettings(): Settings | null {
    const settings = db.getSettings();
    if (!settings) return null;

    const decryptedSettings = { ...settings };

    if (settings.geminiApiKey && this.isEncryptedData(settings.geminiApiKey)) {
      decryptedSettings.geminiApiKey = this.decryptField(settings.geminiApiKey);
    }

    return decryptedSettings;
  }

  saveTranscript(transcriptData: {
    original: string;
    cleaned: string;
    language: string;
    context: string;
    translatedText?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  }): void {
    const encryptedData = {
      ...transcriptData,
      original: this.encryptField(transcriptData.original) as unknown as string,
      cleaned: this.encryptField(transcriptData.cleaned) as unknown as string,
      translatedText: transcriptData.translatedText 
        ? this.encryptField(transcriptData.translatedText) as unknown as string 
        : undefined,
    };

    db.saveTranscript(encryptedData);
  }

  getHistory(limit: number, offset: number, context?: string): TranscriptHistory[] {
    const history = db.getHistory(limit, offset, context);

    return history.map(item => ({
      ...item,
      original: this.decryptField((item as any).original),
      cleaned: this.decryptField((item as any).cleaned),
      translatedText: item.translatedText 
        ? this.decryptField((item as any).translatedText) 
        : undefined,
    }));
  }

  saveUserProfile(profile: UserProfile): void {
    const encryptedProfile: any = { ...profile };

    if (profile.email) {
      encryptedProfile.email = this.encryptField(profile.email);
    }
    if (profile.phone) {
      encryptedProfile.phone = this.encryptField(profile.phone);
    }
    if (profile.mobile) {
      encryptedProfile.mobile = this.encryptField(profile.mobile);
    }
    if (profile.address) {
      encryptedProfile.address = this.encryptField(JSON.stringify(profile.address));
    }
    if (profile.linkedin) {
      encryptedProfile.linkedin = this.encryptField(profile.linkedin);
    }
    if (profile.calendlyLink) {
      encryptedProfile.calendlyLink = this.encryptField(profile.calendlyLink);
    }

    db.saveUserProfile(encryptedProfile);
  }

  getUserProfile(): UserProfile | null {
    const profile = db.getUserProfile();
    if (!profile) return null;

    const decryptedProfile: UserProfile = { ...profile };

    decryptedProfile.email = this.decryptField((profile as any).email);
    decryptedProfile.phone = this.decryptField((profile as any).phone);
    decryptedProfile.mobile = this.decryptField((profile as any).mobile);
    decryptedProfile.linkedin = this.decryptField((profile as any).linkedin);
    decryptedProfile.calendlyLink = this.decryptField((profile as any).calendlyLink);

    const addressData = this.decryptField((profile as any).address);
    if (addressData) {
      try {
        decryptedProfile.address = JSON.parse(addressData);
      } catch {
        decryptedProfile.address = profile.address;
      }
    }

    return decryptedProfile;
  }

  saveSnippet(snippet: Snippet): void {
    const encryptedSnippet: any = { ...snippet };

    if (snippet.content) {
      encryptedSnippet.content = this.encryptField(snippet.content);
    }

    db.saveSnippet(encryptedSnippet);
  }

  getSnippets(): Snippet[] {
    const snippets = db.getSnippets();

    return snippets.map(snippet => ({
      ...snippet,
      content: this.decryptField((snippet as any).content),
    }));
  }

  getSnippetsByCategory(category: SnippetCategory): Snippet[] {
    const snippets = db.getSnippetsByCategory(category);

    return snippets.map(snippet => ({
      ...snippet,
      content: this.decryptField((snippet as any).content),
    }));
  }

  processSnippets(text: string): SnippetProcessResult {
    return db.processSnippets(text);
  }

  findSnippetByTrigger(text: string): Snippet | null {
    const snippet = db.findSnippetByTrigger(text);
    if (!snippet) return null;

    return {
      ...snippet,
      content: this.decryptField((snippet as any).content),
    };
  }
}

let secureDbInstance: SecureDatabase | null = null;

export function getSecureDatabase(encryption: EncryptionService): SecureDatabase {
  if (!secureDbInstance) {
    secureDbInstance = new SecureDatabase(encryption);
  }
  return secureDbInstance;
}
