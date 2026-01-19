import React from 'react';
import { SUPPORTED_LANGUAGES } from '../../shared/types';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-bg-tertiary text-text-primary text-sm rounded-lg px-3 py-2 
                 border border-bg-tertiary hover:border-accent-purple/50 
                 focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50
                 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                 non-draggable"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
};
