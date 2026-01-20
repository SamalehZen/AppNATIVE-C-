import React, { useEffect, useState, useCallback } from 'react';
import {
  User,
  Briefcase,
  Phone,
  MapPin,
  Link2,
  PenTool,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';
import { SettingsSection } from '../components/SettingsSection';
import { useProfile } from '../stores/profile';
import { UserProfile, PROFILE_VARIABLES, SUPPORTED_LANGUAGES, DEFAULT_USER_PROFILE } from '../../shared/types';

const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Europe/London', label: 'Londres (UTC+0)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+11)' },
];

const COUNTRIES = [
  'France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg',
  'États-Unis', 'Royaume-Uni', 'Allemagne', 'Espagne', 'Italie',
];

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  hint?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  hint,
}) => (
  <div>
    <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-bg-tertiary text-text-primary border rounded-lg px-4 py-3
                focus:outline-none transition-colors
                ${error ? 'border-red-500 focus:border-red-500' : 'border-bg-tertiary focus:border-accent-purple'}`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    {hint && !error && <p className="text-xs text-text-secondary mt-1">{hint}</p>}
  </div>
);

interface SignatureEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  preview: string;
}

const SignatureEditor: React.FC<SignatureEditorProps> = ({
  label,
  value,
  onChange,
  onGenerate,
  preview,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <button
        onClick={onGenerate}
        className="text-xs text-accent-purple hover:underline flex items-center gap-1"
      >
        <RefreshCw size={12} />
        Générer
      </button>
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className="w-full bg-bg-tertiary text-text-primary border border-bg-tertiary rounded-lg px-4 py-3
                focus:border-accent-purple focus:outline-none resize-none font-mono text-sm"
    />
    <div className="bg-bg-primary border border-bg-tertiary rounded-lg p-3">
      <p className="text-xs text-text-secondary mb-1">Aperçu :</p>
      <pre className="text-sm text-text-primary whitespace-pre-wrap font-sans">{preview}</pre>
    </div>
  </div>
);

export const Profile: React.FC = () => {
  const { profile, isLoading, isSaving, error, loadProfile, saveProfile, resolveVariables, generateSignature } = useProfile();
  const [formData, setFormData] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const updateField = useCallback((field: keyof UserProfile, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'firstName' || field === 'lastName') {
        updated.fullName = `${updated.firstName} ${updated.lastName}`.trim();
      }
      return updated;
    });
    setHasChanges(true);
    setSaveSuccess(false);
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [validationErrors]);

  const updateAddress = useCallback((field: keyof UserProfile['address'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  const updateSignature = useCallback((type: keyof UserProfile['signatures'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      signatures: { ...prev.signatures, [type]: value },
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    const phoneRegex = /^[\d\s\-+().]{6,20}$/;
    return phoneRegex.test(phone);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!validateEmail(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }
    if (!validatePhone(formData.phone)) {
      errors.phone = 'Format de téléphone invalide';
    }
    if (!validatePhone(formData.mobile)) {
      errors.mobile = 'Format de téléphone invalide';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    await saveProfile(formData);
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleGenerateSignature = (type: 'formal' | 'informal' | 'professional') => {
    const templates = {
      formal: 'Cordialement,\n\n{fullName}',
      informal: 'À bientôt,\n{firstName}',
      professional: 'Cordialement,\n\n{fullName}\n{jobTitle}\n{company}\n{email} | {phone}',
    };
    updateSignature(type, templates[type]);
  };

  const getSignaturePreview = (template: string): string => {
    let preview = template;
    preview = preview.replace(/\{firstName\}/g, formData.firstName || '[Prénom]');
    preview = preview.replace(/\{lastName\}/g, formData.lastName || '[Nom]');
    preview = preview.replace(/\{fullName\}/g, formData.fullName || '[Nom complet]');
    preview = preview.replace(/\{jobTitle\}/g, formData.jobTitle || '[Poste]');
    preview = preview.replace(/\{company\}/g, formData.company || '[Entreprise]');
    preview = preview.replace(/\{department\}/g, formData.department || '[Département]');
    preview = preview.replace(/\{email\}/g, formData.email || '[email]');
    preview = preview.replace(/\{phone\}/g, formData.phone || '[téléphone]');
    preview = preview.replace(/\{mobile\}/g, formData.mobile || '[mobile]');
    return preview;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Mon Profil</h1>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <Check size={16} />
              Sauvegardé
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 text-sm text-red-500">
              <AlertCircle size={16} />
              {error}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                      ${hasChanges
                        ? 'bg-accent-purple text-white hover:bg-accent-purple/90'
                        : 'bg-bg-tertiary text-text-secondary cursor-not-allowed'}`}
          >
            {isSaving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Sauvegarder
          </button>
        </div>
      </div>

      <SettingsSection
        icon={<User size={20} />}
        title="Identité"
        description="Vos informations personnelles de base"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Prénom"
            value={formData.firstName}
            onChange={(v) => updateField('firstName', v)}
            placeholder="Jean"
          />
          <FormInput
            label="Nom"
            value={formData.lastName}
            onChange={(v) => updateField('lastName', v)}
            placeholder="Dupont"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Briefcase size={20} />}
        title="Professionnel"
        description="Vos informations professionnelles"
      >
        <div className="space-y-4">
          <FormInput
            label="Poste / Fonction"
            value={formData.jobTitle}
            onChange={(v) => updateField('jobTitle', v)}
            placeholder="Directeur Commercial"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Entreprise"
              value={formData.company}
              onChange={(v) => updateField('company', v)}
              placeholder="Acme Corp"
            />
            <FormInput
              label="Département / Service"
              value={formData.department}
              onChange={(v) => updateField('department', v)}
              placeholder="Ventes"
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Phone size={20} />}
        title="Contact"
        description="Vos coordonnées de contact"
      >
        <div className="space-y-4">
          <FormInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(v) => updateField('email', v)}
            placeholder="jean.dupont@exemple.com"
            error={validationErrors.email}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Téléphone fixe"
              type="tel"
              value={formData.phone}
              onChange={(v) => updateField('phone', v)}
              placeholder="+33 1 23 45 67 89"
              error={validationErrors.phone}
            />
            <FormInput
              label="Mobile"
              type="tel"
              value={formData.mobile}
              onChange={(v) => updateField('mobile', v)}
              placeholder="+33 6 12 34 56 78"
              error={validationErrors.mobile}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<MapPin size={20} />}
        title="Adresse"
        description="Votre adresse postale professionnelle"
      >
        <div className="space-y-4">
          <FormInput
            label="Rue"
            value={formData.address.street}
            onChange={(v) => updateAddress('street', v)}
            placeholder="123 Avenue des Champs-Élysées"
          />
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="Ville"
              value={formData.address.city}
              onChange={(v) => updateAddress('city', v)}
              placeholder="Paris"
            />
            <FormInput
              label="Code postal"
              value={formData.address.postalCode}
              onChange={(v) => updateAddress('postalCode', v)}
              placeholder="75008"
            />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Pays</label>
              <select
                value={formData.address.country}
                onChange={(e) => updateAddress('country', e.target.value)}
                className="w-full bg-bg-tertiary text-text-primary border border-bg-tertiary rounded-lg px-4 py-3
                          focus:border-accent-purple focus:outline-none cursor-pointer"
              >
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Link2 size={20} />}
        title="Liens & Réseaux"
        description="Vos profils en ligne et liens de prise de RDV"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="LinkedIn"
              value={formData.linkedin}
              onChange={(v) => updateField('linkedin', v)}
              placeholder="https://linkedin.com/in/jeandupont"
              hint="URL complète de votre profil"
            />
            <FormInput
              label="Twitter / X"
              value={formData.twitter}
              onChange={(v) => updateField('twitter', v)}
              placeholder="@jeandupont"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Site web"
              value={formData.website}
              onChange={(v) => updateField('website', v)}
              placeholder="https://www.monsite.com"
            />
            <FormInput
              label="Calendly / Lien de RDV"
              value={formData.calendlyLink}
              onChange={(v) => updateField('calendlyLink', v)}
              placeholder="https://calendly.com/jeandupont"
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<PenTool size={20} />}
        title="Signatures"
        description="Configurez vos signatures email automatiques"
      >
        <div className="space-y-6">
          <div className="bg-bg-primary border border-bg-tertiary rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-accent-purple mt-0.5 flex-shrink-0" />
              <div className="text-xs text-text-secondary">
                <p className="font-medium text-text-primary mb-1">Variables disponibles :</p>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_VARIABLES.map((v) => (
                    <code
                      key={v.key}
                      className="bg-bg-tertiary px-2 py-0.5 rounded text-accent-purple cursor-help"
                      title={v.description}
                    >
                      {v.key}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <SignatureEditor
            label="Signature formelle"
            value={formData.signatures.formal}
            onChange={(v) => updateSignature('formal', v)}
            onGenerate={() => handleGenerateSignature('formal')}
            preview={getSignaturePreview(formData.signatures.formal)}
          />

          <SignatureEditor
            label="Signature informelle"
            value={formData.signatures.informal}
            onChange={(v) => updateSignature('informal', v)}
            onGenerate={() => handleGenerateSignature('informal')}
            preview={getSignaturePreview(formData.signatures.informal)}
          />

          <SignatureEditor
            label="Signature professionnelle complète"
            value={formData.signatures.professional}
            onChange={(v) => updateSignature('professional', v)}
            onGenerate={() => handleGenerateSignature('professional')}
            preview={getSignaturePreview(formData.signatures.professional)}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Info size={20} />}
        title="Préférences"
        description="Langue et fuseau horaire par défaut"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Langue préférée
            </label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => updateField('preferredLanguage', e.target.value)}
              className="w-full bg-bg-tertiary text-text-primary border border-bg-tertiary rounded-lg px-4 py-3
                        focus:border-accent-purple focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Fuseau horaire
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => updateField('timezone', e.target.value)}
              className="w-full bg-bg-tertiary text-text-primary border border-bg-tertiary rounded-lg px-4 py-3
                        focus:border-accent-purple focus:outline-none cursor-pointer"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
      </SettingsSection>

      <div className="h-6" />
    </div>
  );
};
