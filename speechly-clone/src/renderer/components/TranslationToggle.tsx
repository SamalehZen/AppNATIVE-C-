import React, { useState, useRef, useEffect } from 'react';
import { Languages, ArrowRightLeft, ChevronDown, Check } from 'lucide-react';
import { TRANSLATION_LANGUAGES, TranslationLanguage } from '../../shared/constants';

interface TranslationToggleProps {
  enabled: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  onToggle: (enabled: boolean) => void;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

interface LanguageDropdownProps {
  value: string;
  onChange: (lang: string) => void;
  label: string;
  disabled?: boolean;
  position?: 'left' | 'right';
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  value,
  onChange,
  label,
  disabled,
  position = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedLang = TRANSLATION_LANGUAGES.find(l => l.code === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredLanguages = TRANSLATION_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedLanguages = filteredLanguages.reduce((acc, lang) => {
    const region = lang.region || 'Other';
    if (!acc[region]) acc[region] = [];
    acc[region].push(lang);
    return acc;
  }, {} as Record<string, TranslationLanguage[]>);

  const regionOrder = ['Europe', 'Americas', 'Asia', 'Middle East', 'Africa', 'Oceania', 'Other'];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-bg-tertiary'
            : 'hover:bg-bg-secondary bg-bg-tertiary cursor-pointer'}
        `}
        title={label}
      >
        <span className="text-base">{selectedLang?.flag || '🌐'}</span>
        <span className="text-sm font-medium text-text-primary">
          {selectedLang?.code.split('-')[0].toUpperCase() || value}
        </span>
        <ChevronDown size={14} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`
            absolute top-full mt-1 w-72 bg-bg-secondary border border-bg-tertiary
            rounded-lg shadow-xl z-50 overflow-hidden
            ${position === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          <div className="p-2 border-b border-bg-tertiary">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une langue..."
              className="w-full px-3 py-2 bg-bg-tertiary text-text-primary rounded-lg
                       text-sm focus:outline-none focus:ring-1 focus:ring-accent-purple"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {regionOrder.map(region => {
              const langs = groupedLanguages[region];
              if (!langs || langs.length === 0) return null;
              return (
                <div key={region}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-text-secondary bg-bg-primary/50 sticky top-0">
                    {region}
                  </div>
                  {langs.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onChange(lang.code);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                        ${lang.code === value
                          ? 'bg-accent-purple/20 text-accent-purple'
                          : 'hover:bg-bg-tertiary text-text-primary'}
                      `}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="flex-1 text-sm">{lang.name}</span>
                      {lang.code === value && <Check size={16} />}
                    </button>
                  ))}
                </div>
              );
            })}
            {filteredLanguages.length === 0 && (
              <div className="px-3 py-4 text-sm text-text-secondary text-center">
                Aucune langue trouvée
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const TranslationToggle: React.FC<TranslationToggleProps> = ({
  enabled,
  sourceLanguage,
  targetLanguage,
  onToggle,
  onSourceChange,
  onTargetChange,
  disabled = false,
  compact = false,
}) => {
  const handleSwap = () => {
    const temp = sourceLanguage;
    onSourceChange(targetLanguage);
    onTargetChange(temp);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(!enabled)}
          disabled={disabled}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${enabled
              ? 'bg-accent-purple text-white'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'}
          `}
          title={enabled ? 'Désactiver la traduction' : 'Activer la traduction'}
        >
          <Languages size={14} />
          <span>Trad</span>
        </button>

        {enabled && (
          <div className="flex items-center gap-1">
            <LanguageDropdown
              value={sourceLanguage}
              onChange={onSourceChange}
              label="Langue source"
              disabled={disabled}
            />
            <button
              onClick={handleSwap}
              disabled={disabled}
              className="p-1 rounded hover:bg-bg-secondary transition-colors text-text-secondary hover:text-text-primary disabled:opacity-50"
              title="Inverser les langues"
            >
              <ArrowRightLeft size={14} />
            </button>
            <LanguageDropdown
              value={targetLanguage}
              onChange={onTargetChange}
              label="Langue cible"
              disabled={disabled}
              position="right"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl transition-all
      ${enabled ? 'bg-accent-purple/10 border border-accent-purple/30' : 'bg-bg-tertiary'}
    `}>
      <button
        onClick={() => onToggle(!enabled)}
        disabled={disabled}
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${enabled
            ? 'bg-accent-purple text-white'
            : 'bg-bg-secondary text-text-secondary hover:bg-bg-primary'}
        `}
        title={enabled ? 'Désactiver la traduction' : 'Activer la traduction'}
      >
        <Languages size={20} />
      </button>

      <div className="flex items-center gap-2 flex-1">
        <LanguageDropdown
          value={sourceLanguage}
          onChange={onSourceChange}
          label="Langue de dictée"
          disabled={disabled || !enabled}
        />

        <button
          onClick={handleSwap}
          disabled={disabled || !enabled}
          className={`
            p-2 rounded-lg transition-all
            ${disabled || !enabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-bg-secondary text-text-secondary hover:text-text-primary cursor-pointer'}
          `}
          title="Inverser les langues"
        >
          <ArrowRightLeft size={16} />
        </button>

        <LanguageDropdown
          value={targetLanguage}
          onChange={onTargetChange}
          label="Langue d'écriture"
          disabled={disabled || !enabled}
          position="right"
        />
      </div>

      {enabled && (
        <div className="text-xs text-accent-purple font-medium px-2 py-1 bg-accent-purple/20 rounded">
          Actif
        </div>
      )}
    </div>
  );
};

export const TranslationIndicator: React.FC<{
  sourceLanguage: string;
  targetLanguage: string;
}> = ({ sourceLanguage, targetLanguage }) => {
  const sourceLang = TRANSLATION_LANGUAGES.find(l => l.code === sourceLanguage);
  const targetLang = TRANSLATION_LANGUAGES.find(l => l.code === targetLanguage);

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-base">{sourceLang?.flag || '🌐'}</span>
      <span className="text-text-secondary">→</span>
      <span className="text-base">{targetLang?.flag || '🌐'}</span>
    </div>
  );
};
