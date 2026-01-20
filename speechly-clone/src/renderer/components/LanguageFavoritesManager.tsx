import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Star, Search } from 'lucide-react';
import { Language } from '../../shared/types';
import { LanguageSupportBadge } from './LanguageSupportBadge';
import languagesData from '../../data/languages.json';

interface LanguageFavoritesManagerProps {
  favorites: string[];
  onAdd: (code: string) => void;
  onRemove: (code: string) => void;
}

export const LanguageFavoritesManager: React.FC<LanguageFavoritesManagerProps> = ({
  favorites,
  onAdd,
  onRemove,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const languages = useMemo(() => languagesData.languages as Language[], []);
  const languageMap = useMemo(() => new Map(languages.map(l => [l.code, l])), [languages]);

  const favoriteLanguages = useMemo(() => {
    return favorites
      .map(code => languageMap.get(code))
      .filter((l): l is Language => l !== undefined);
  }, [favorites, languageMap]);

  const availableLanguages = useMemo(() => {
    const filtered = languages.filter(l => !favorites.includes(l.code));
    if (!searchQuery.trim()) return filtered.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return filtered.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  }, [languages, favorites, searchQuery]);

  return (
    <div className="space-y-3">
      {favoriteLanguages.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {favoriteLanguages.map(lang => (
            <div
              key={lang.code}
              className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary rounded-full text-sm"
            >
              <span>{lang.flag}</span>
              <span className="text-text-primary">{lang.nativeName}</span>
              <button
                onClick={() => onRemove(lang.code)}
                className="text-text-secondary hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary py-2">
          Aucune langue favorite. Ajoutez-en pour un accès rapide.
        </p>
      )}

      {isAddingNew ? (
        <div className="p-3 bg-bg-tertiary rounded-lg space-y-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une langue..."
              autoFocus
              className="w-full pl-9 pr-3 py-2 bg-bg-secondary text-text-primary text-sm rounded-lg
                        border border-bg-secondary focus:border-accent-purple focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableLanguages.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  onAdd(lang.code);
                  setSearchQuery('');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-secondary rounded transition-colors"
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">{lang.nativeName}</div>
                  <div className="text-xs text-text-secondary truncate">{lang.name}</div>
                </div>
                <LanguageSupportBadge support={lang.speechRecognitionSupport} type="speech" />
              </button>
            ))}
            {availableLanguages.length === 0 && searchQuery && (
              <p className="text-sm text-text-secondary text-center py-4">
                Aucune langue trouvée
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setIsAddingNew(false);
              setSearchQuery('');
            }}
            className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-accent-purple 
                    hover:bg-accent-purple/10 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Ajouter une langue favorite
        </button>
      )}
    </div>
  );
};
