import { create } from 'zustand';
import { UserProfile, DEFAULT_USER_PROFILE } from '../../shared/types';

interface ProfileStore {
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasChanges: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setHasChanges: (hasChanges: boolean) => void;
  resolveVariables: (text: string) => string;
  generateSignature: (type: 'formal' | 'informal' | 'professional') => string;
}

export const useProfile = create<ProfileStore>((set, get) => ({
  profile: null,
  isLoading: true,
  isSaving: false,
  error: null,
  hasChanges: false,

  loadProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const savedProfile = await window.electronAPI.getProfile();
      set({
        profile: savedProfile || { ...DEFAULT_USER_PROFILE, createdAt: Date.now(), updatedAt: Date.now() },
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      set({ isLoading: false, error: 'Échec du chargement du profil' });
    }
  },

  saveProfile: async (profile) => {
    try {
      set({ isSaving: true, error: null });
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      const updatedProfile = { ...profile, fullName, updatedAt: Date.now() };
      await window.electronAPI.saveProfile(updatedProfile);
      set({ profile: updatedProfile, isSaving: false, hasChanges: false });
    } catch (error) {
      console.error('Failed to save profile:', error);
      set({ isSaving: false, error: 'Échec de la sauvegarde du profil' });
    }
  },

  updateProfile: async (updates) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    try {
      set({ isSaving: true, error: null });
      await window.electronAPI.updateProfile(updates);
      
      const updatedProfile = { ...currentProfile, ...updates };
      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        updatedProfile.fullName = `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim();
      }
      updatedProfile.updatedAt = Date.now();
      
      set({ profile: updatedProfile, isSaving: false, hasChanges: false });
    } catch (error) {
      console.error('Failed to update profile:', error);
      set({ isSaving: false, error: 'Échec de la mise à jour du profil' });
    }
  },

  setHasChanges: (hasChanges) => {
    set({ hasChanges });
  },

  resolveVariables: (text) => {
    const profile = get().profile;
    if (!profile) return text;

    let result = text;
    result = result.replace(/\{firstName\}/g, profile.firstName);
    result = result.replace(/\{lastName\}/g, profile.lastName);
    result = result.replace(/\{fullName\}/g, profile.fullName);
    result = result.replace(/\{jobTitle\}/g, profile.jobTitle);
    result = result.replace(/\{company\}/g, profile.company);
    result = result.replace(/\{department\}/g, profile.department);
    result = result.replace(/\{email\}/g, profile.email);
    result = result.replace(/\{phone\}/g, profile.phone);
    result = result.replace(/\{mobile\}/g, profile.mobile);
    
    return result;
  },

  generateSignature: (type) => {
    const profile = get().profile;
    if (!profile) return '';

    const templates = {
      formal: `Cordialement,\n\n${profile.fullName}`,
      informal: `À bientôt,\n${profile.firstName}`,
      professional: `Cordialement,\n\n${profile.fullName}\n${profile.jobTitle}${profile.company ? `\n${profile.company}` : ''}${profile.email || profile.phone ? `\n${[profile.email, profile.phone].filter(Boolean).join(' | ')}` : ''}`,
    };

    return templates[type] || templates.formal;
  },
}));
