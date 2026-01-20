import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Star, Clock, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { Language, LanguageRegion, LanguagePreferences, SupportLevel } from '../../shared/types';
import { LanguageSupportBadge } from './LanguageSupportBadge';
import languagesData from '../../data/languages.json';

interface LanguageSelectorEnhancedProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  showRecent?: boolean;
  showFavorites?: boolean;
  filterSupport?: 'speech' | 'translation' | 'both';
  label?: string;
  compact?: boolean;
}

const REGION_NAMES: Record<LanguageRegion, string> = {
  europe: 'Europe',
  americas: 'Amériques',
  asia: 'Asie',
  'middle-east': 'Moyen-Orient',
  africa: 'Afrique',
  oceania: 'Océanie',
};

const REGION_ICONS: Record<LanguageRegion, string> = {
  europe: '🌍',
  americas: '🌎',
  asia: '🌏',
  'middle-east': '🕌',
  africa: '🌍',
  oceania: '🏝️',
};

export const LanguageSelectorEnhanced: React.FC<LanguageSelectorEnhancedProps> = ({
  value,
  onChange,
  disabled = false,
  showRecent = true,
  showFavorites = true,
  filterSupport,
  label,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Set<LanguageRegion>>(new Set(['europe']));
  const [preferences, setPreferences] = useState<LanguagePreferences>({
    recentLanguages: [],
    favoriteLanguages: [],
    defaultRegion: null,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const languages = useMemo(() => {
    let langs = languagesData.languages as Language[];
    if (filterSupport === 'speech') {
      langs = langs.filter(l => l.speechRecognitionSupport !== 'none');
    } else if (filterSupport === 'translation') {
      langs = langs.filter(l => l.translationSupport !== 'none');
    } else if (filterSupport === 'both') {
      langs = langs.filter(l => l.speechRecognitionSupport !== 'none' && l.translationSupport !== 'none');
    }
    return langs;
  }, [filterSupport]);

  const languageMap = useMemo(() => {
    return new Map(languages.map(l => [l.code, l]));
  }, [languages]);

  const selectedLanguage = languageMap.get(value);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await window.electronAPI.getLanguagePreferences();
      setPreferences(prefs);
    } catch (e) {
      console.error('Failed to load language preferences:', e);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

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

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return languages;
    const q = searchQuery.toLowerCase();
    return languages.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  }, [languages, searchQuery]);

  const groupedByRegion = useMemo(() => {
    const grouped: Record<LanguageRegion, Language[]> = {
      europe: [],
      americas: [],
      asia: [],
      'middle-east': [],
      africa: [],
      oceania: [],
    };

    for (const lang of filteredLanguages) {
      grouped[lang.region].push(lang);
    }

    for (const region of Object.keys(grouped) as LanguageRegion[]) {
      grouped[region].sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.name.localeCompare(b.name);
      });
    }

    return grouped;
  }, [filteredLanguages]);

  const recentLanguages = useMemo(() => {
    return preferences.recentLanguages
      .map(code => languageMap.get(code))
      .filter((l): l is Language => l !== undefined)
      .slice(0, 5);
  }, [preferences.recentLanguages, languageMap]);

  const favoriteLanguages = useMemo(() => {
    return preferences.favoriteLanguages
      .map(code => languageMap.get(code))
      .filter((l): l is Language => l !== undefined);
  }, [preferences.favoriteLanguages, languageMap]);

  const handleSelect = async (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery('');
    try {
      await window.electronAPI.addRecentLanguage(code);
      loadPreferences();
    } catch (e) {
      console.error('Failed to add recent language:', e);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    try {
      await window.electronAPI.toggleFavoriteLanguage(code);
      loadPreferences();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const toggleRegion = (region: LanguageRegion) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  };

  const isFavorite = (code: string) => preferences.favoriteLanguages.includes(code);

  const renderLanguageItem = (lang: Language, showFavoriteButton = true) => (
    <button
      key={lang.code}
      onClick={() => handleSelect(lang.code)}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left language-item rounded
                  ${lang.code === value ? 'selected' : 'hover:bg-bg-tertiary'}`}
    >
      <span className="text-lg">{lang.flag}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-primary truncate">{lang.nativeName}</div>
        <div className="text-xs text-text-secondary truncate">{lang.name}</div>
      </div>
      <div className="flex items-center gap-1">
        <LanguageSupportBadge support={lang.speechRecognitionSupport} type="speech" />
        {showFavoriteButton && (
          <button
            onClick={(e) => handleToggleFavorite(e, lang.code)}
            className={`p-1 rounded hover:bg-bg-secondary transition-colors
                       ${isFavorite(lang.code) ? 'text-yellow-500' : 'text-text-secondary'}`}
          >
            <Star size={14} fill={isFavorite(lang.code) ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    </button>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 bg-bg-tertiary text-text-primary rounded-lg
                   border border-bg-tertiary hover:border-accent-purple/50 
                   focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed non-draggable
                   ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}`}
      >
        {selectedLanguage ? (
          <>
            <span className="text-lg">{selectedLanguage.flag}</span>
            <span className={compact ? 'hidden sm:inline' : ''}>{selectedLanguage.nativeName}</span>
          </>
        ) : (
          <>
            <Globe size={16} />
            <span>Sélectionner</span>
          </>
        )}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-80 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl
                       language-selector-dropdown">
          <div className="p-2 border-b border-bg-tertiary">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une langue..."
                className="w-full pl-9 pr-3 py-2 bg-bg-tertiary text-text-primary text-sm rounded-lg
                          border border-bg-tertiary focus:border-accent-purple focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {searchQuery ? (
              <div className="p-2">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map(lang => renderLanguageItem(lang))
                ) : (
                  <div className="py-4 text-center text-text-secondary text-sm">
                    Aucune langue trouvée
                  </div>
                )}
              </div>
            ) : (
              <>
                {showRecent && recentLanguages.length > 0 && (
                  <div className="language-region-section">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-secondary uppercase">
                      <Clock size={12} />
                      Récentes
                    </div>
                    <div className="pb-2">
                      {recentLanguages.map(lang => renderLanguageItem(lang, false))}
                    </div>
                  </div>
                )}

                {showFavorites && favoriteLanguages.length > 0 && (
                  <div className="language-region-section">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-secondary uppercase">
                      <Star size={12} />
                      Favorites
                    </div>
                    <div className="pb-2">
                      {favoriteLanguages.map(lang => renderLanguageItem(lang))}
                    </div>
                  </div>
                )}

                {(Object.keys(groupedByRegion) as LanguageRegion[]).map(region => {
                  const regionLangs = groupedByRegion[region];
                  if (regionLangs.length === 0) return null;

                  const isExpanded = expandedRegions.has(region);

                  return (
                    <div key={region} className="language-region-section">
                      <button
                        onClick={() => toggleRegion(region)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-primary
                                  hover:bg-bg-tertiary transition-colors"
                      >
                        <span>{REGION_ICONS[region]}</span>
                        <span className="flex-1 text-left">{REGION_NAMES[region]}</span>
                        <span className="text-xs text-text-secondary">{regionLangs.length}</span>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      {isExpanded && (
                        <div className="pb-2">
                          {regionLangs.map(lang => renderLanguageItem(lang))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
