import React, { useState, useEffect } from 'react';
import { Settings, SUPPORTED_LANGUAGES } from '../../shared/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings | null;
  onSave: (settings: Partial<Settings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('en-US');
  const [autoCleanup, setAutoCleanup] = useState(true);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.geminiApiKey || '');
      setDefaultLanguage(settings.defaultLanguage || 'en-US');
      setAutoCleanup(settings.autoCleanup);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({
      geminiApiKey: apiKey,
      defaultLanguage,
      autoCleanup,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-xl p-6 w-full max-w-md mx-4 border border-bg-tertiary shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full bg-bg-tertiary text-text-primary rounded-lg px-4 py-3
                         border border-bg-tertiary focus:border-accent-purple focus:outline-none
                         focus:ring-1 focus:ring-accent-purple/50 transition-colors"
            />
            <p className="text-xs text-text-secondary mt-2">
              Get your API key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-purple hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Default Language
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full bg-bg-tertiary text-text-primary rounded-lg px-4 py-3
                         border border-bg-tertiary focus:border-accent-purple focus:outline-none
                         cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">
              Auto-cleanup after recording
            </label>
            <button
              onClick={() => setAutoCleanup(!autoCleanup)}
              className={`
                w-12 h-6 rounded-full transition-colors relative
                ${autoCleanup ? 'bg-accent-green' : 'bg-bg-tertiary'}
              `}
            >
              <div
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${autoCleanup ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 bg-bg-tertiary text-text-primary rounded-lg py-3 
                       hover:bg-bg-tertiary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-accent-purple text-white rounded-lg py-3 
                       hover:bg-accent-purple/80 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
