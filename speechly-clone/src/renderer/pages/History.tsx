import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Copy, Trash2, ChevronDown, Filter, Languages } from 'lucide-react';
import { TranscriptHistory } from '../../shared/types';
import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CONTEXT_NAMES, TRANSLATION_LANGUAGES } from '../../shared/constants';

export const History: React.FC = () => {
  const [history, setHistory] = useState<TranscriptHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterContext, setFilterContext] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [stats, setStats] = useState({ totalWords: 0, todayWords: 0 });

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await window.electronAPI.getHistory(100, 0, filterContext);
      setHistory(records);
      const statsData = await window.electronAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterContext]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredHistory = history.filter((item) =>
    item.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.cleaned.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.translatedText && item.translatedText.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupByDate = (items: TranscriptHistory[]) => {
    const groups: Record<string, TranscriptHistory[]> = {};
    
    items.forEach((item) => {
      const date = parseISO(item.createdAt);
      let label: string;
      
      if (isToday(date)) {
        label = "Aujourd'hui";
      } else if (isYesterday(date)) {
        label = 'Hier';
      } else {
        label = format(date, 'd MMMM yyyy', { locale: fr });
      }
      
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(item);
    });
    
    return groups;
  };

  const groupedHistory = groupByDate(filteredHistory);

  const handleCopy = async (item: TranscriptHistory) => {
    await window.electronAPI.copyToClipboard(item.translatedText || item.cleaned);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cet élément ?')) {
      await window.electronAPI.deleteHistoryItem(id);
      await loadHistory();
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Historique</h1>

        <div className="flex gap-4 text-sm">
          <div className="px-3 py-1.5 bg-bg-secondary border border-bg-tertiary rounded-lg">
            <span className="text-text-secondary">Aujourd'hui:</span>{' '}
            <span className="font-bold text-accent-green">{stats.todayWords} mots</span>
          </div>
          <div className="px-3 py-1.5 bg-bg-secondary border border-bg-tertiary rounded-lg">
            <span className="text-text-secondary">Total:</span>{' '}
            <span className="font-bold text-text-primary">{stats.totalWords} mots</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Rechercher dans l'historique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-secondary border border-bg-tertiary rounded-lg pl-10 pr-4 py-2.5
                      text-text-primary placeholder:text-text-secondary
                      focus:border-accent-purple focus:outline-none"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <select
            value={filterContext}
            onChange={(e) => setFilterContext(e.target.value)}
            className="bg-bg-secondary border border-bg-tertiary rounded-lg pl-10 pr-8 py-2.5
                      text-text-primary cursor-pointer appearance-none
                      focus:border-accent-purple focus:outline-none"
          >
            <option value="all">Tous les contextes</option>
            {Object.entries(CONTEXT_NAMES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p>{searchQuery ? 'Aucun résultat trouvé' : 'Aucun historique'}</p>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2 sticky top-0 bg-bg-primary py-2">
                  <Calendar size={14} />
                  {date}
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onCopy={() => handleCopy(item)}
                      onDelete={() => handleDelete(item.id)}
                      isCopied={copiedId === item.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface HistoryItemProps {
  item: TranscriptHistory;
  onCopy: () => void;
  onDelete: () => void;
  isCopied: boolean;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onCopy, onDelete, isCopied }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4 transition-all hover:border-gray-600">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 text-xs text-text-secondary flex-wrap">
            <span className="px-2 py-0.5 bg-bg-tertiary rounded text-text-primary">
              {item.contextName || CONTEXT_NAMES[item.context] || 'Général'}
            </span>
            <span>
              {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true, locale: fr })}
            </span>
            <span className="text-accent-purple">{item.wordCount} mots</span>
          </div>

          <p className={`text-sm text-text-primary ${isExpanded ? '' : 'line-clamp-2'}`}>
            {item.translatedText || item.cleaned}
          </p>

          {item.translatedText && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-accent-purple">
              <Languages size={12} />
              <span>
                {TRANSLATION_LANGUAGES.find(l => l.code === item.sourceLanguage)?.flag || '🌐'}
                {' '}→{' '}
                {TRANSLATION_LANGUAGES.find(l => l.code === item.targetLanguage)?.flag || '🌐'}
              </span>
            </div>
          )}

          {isExpanded && (
            <>
              {item.translatedText && (
                <div className="mt-3 pt-3 border-t border-bg-tertiary">
                  <p className="text-xs text-text-secondary mb-1">Texte nettoyé:</p>
                  <p className="text-sm text-text-secondary">{item.cleaned}</p>
                </div>
              )}
              {item.original !== item.cleaned && (
                <div className="mt-3 pt-3 border-t border-bg-tertiary">
                  <p className="text-xs text-text-secondary mb-1">Original:</p>
                  <p className="text-sm text-text-secondary">{item.original}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onCopy}
            className={`p-2 rounded-lg transition-colors ${
              isCopied 
                ? 'bg-accent-green text-white' 
                : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
            title={item.translatedText ? 'Copier la traduction' : 'Copier'}
          >
            <Copy size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-red-400 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 hover:bg-bg-tertiary rounded-lg text-text-secondary transition-all ${
              isExpanded ? 'rotate-180' : ''
            }`}
            title={isExpanded ? 'Réduire' : 'Développer'}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
