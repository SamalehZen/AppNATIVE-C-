import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, Check, BookOpen } from 'lucide-react';
import { CustomDictionary } from '../../shared/types';
import { CONTEXT_NAMES } from '../../shared/constants';

export const Dictionary: React.FC = () => {
  const [dictionary, setDictionary] = useState<CustomDictionary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newTerm, setNewTerm] = useState('');
  const [newReplacement, setNewReplacement] = useState('');
  const [newContext, setNewContext] = useState('all');

  const loadDictionary = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await window.electronAPI.getDictionary();
      setDictionary(data);
    } catch (error) {
      console.error('Failed to load dictionary:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDictionary();
  }, [loadDictionary]);

  const filteredDictionary = dictionary.filter(
    (item) =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.replacement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newTerm.trim() || !newReplacement.trim()) return;

    await window.electronAPI.addDictionaryTerm(newTerm.trim(), newReplacement.trim(), newContext);
    setNewTerm('');
    setNewReplacement('');
    setNewContext('all');
    setShowAddForm(false);
    await loadDictionary();
  };

  const handleUpdate = async (id: number, term: string, replacement: string, context: string) => {
    await window.electronAPI.updateDictionaryTerm(id, term, replacement, context);
    setEditingId(null);
    await loadDictionary();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce terme ?')) {
      await window.electronAPI.deleteDictionaryTerm(id);
      await loadDictionary();
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dictionnaire personnalisé</h1>
          <p className="text-sm text-text-secondary mt-1">
            Définissez des remplacements automatiques pour vos termes fréquents
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 
                    text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Ajouter
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
        <input
          type="text"
          placeholder="Rechercher un terme..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-bg-secondary border border-bg-tertiary rounded-lg pl-10 pr-4 py-2.5
                    text-text-primary placeholder:text-text-secondary
                    focus:border-accent-purple focus:outline-none"
        />
      </div>

      {showAddForm && (
        <div className="bg-bg-secondary border border-accent-purple rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-text-primary mb-4">Nouveau terme</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Terme à remplacer</label>
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="ex: speechly"
                className="w-full bg-bg-tertiary border border-bg-tertiary rounded-lg px-3 py-2
                          text-text-primary text-sm focus:border-accent-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Remplacement</label>
              <input
                type="text"
                value={newReplacement}
                onChange={(e) => setNewReplacement(e.target.value)}
                placeholder="ex: Speechly Clone"
                className="w-full bg-bg-tertiary border border-bg-tertiary rounded-lg px-3 py-2
                          text-text-primary text-sm focus:border-accent-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Contexte</label>
              <select
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
                className="w-full bg-bg-tertiary border border-bg-tertiary rounded-lg px-3 py-2
                          text-text-primary text-sm cursor-pointer focus:border-accent-purple focus:outline-none"
              >
                <option value="all">Tous</option>
                {Object.entries(CONTEXT_NAMES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTerm('');
                setNewReplacement('');
                setNewContext('all');
              }}
              className="px-4 py-2 bg-bg-tertiary hover:bg-bg-primary text-text-primary rounded-lg
                        transition-colors text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTerm.trim() || !newReplacement.trim()}
              className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-lg
                        transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
          </div>
        ) : filteredDictionary.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <BookOpen size={48} className="mb-4 opacity-50" />
            <p>{searchQuery ? 'Aucun résultat trouvé' : 'Aucun terme dans le dictionnaire'}</p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-accent-purple hover:underline"
              >
                Ajouter votre premier terme
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-text-secondary font-medium">
              <div className="col-span-4">Terme</div>
              <div className="col-span-4">Remplacement</div>
              <div className="col-span-2">Contexte</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {filteredDictionary.map((item) => (
              <DictionaryItem
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                onEdit={() => setEditingId(item.id)}
                onSave={(term, replacement, context) => handleUpdate(item.id, term, replacement, context)}
                onCancel={() => setEditingId(null)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface DictionaryItemProps {
  item: CustomDictionary;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (term: string, replacement: string, context: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}

const DictionaryItem: React.FC<DictionaryItemProps> = ({
  item,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [term, setTerm] = useState(item.term);
  const [replacement, setReplacement] = useState(item.replacement);
  const [context, setContext] = useState(item.context);

  useEffect(() => {
    if (isEditing) {
      setTerm(item.term);
      setReplacement(item.replacement);
      setContext(item.context);
    }
  }, [isEditing, item]);

  if (isEditing) {
    return (
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-bg-secondary border border-accent-purple rounded-lg items-center">
        <div className="col-span-4">
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full bg-bg-tertiary border border-bg-tertiary rounded px-2 py-1.5
                      text-text-primary text-sm focus:border-accent-purple focus:outline-none"
          />
        </div>
        <div className="col-span-4">
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            className="w-full bg-bg-tertiary border border-bg-tertiary rounded px-2 py-1.5
                      text-text-primary text-sm focus:border-accent-purple focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full bg-bg-tertiary border border-bg-tertiary rounded px-2 py-1.5
                      text-text-primary text-sm cursor-pointer focus:border-accent-purple focus:outline-none"
          >
            <option value="all">Tous</option>
            {Object.entries(CONTEXT_NAMES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 flex justify-end gap-1">
          <button
            onClick={() => onSave(term, replacement, context)}
            className="p-1.5 hover:bg-accent-green/20 rounded text-accent-green transition-colors"
            title="Sauvegarder"
          >
            <Check size={16} />
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-bg-tertiary rounded text-text-secondary transition-colors"
            title="Annuler"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg items-center
                  hover:border-gray-600 transition-colors">
      <div className="col-span-4 text-sm text-text-primary font-medium truncate" title={item.term}>
        {item.term}
      </div>
      <div className="col-span-4 text-sm text-text-secondary truncate" title={item.replacement}>
        → {item.replacement}
      </div>
      <div className="col-span-2">
        <span className="text-xs px-2 py-1 bg-bg-tertiary rounded text-text-secondary">
          {item.context === 'all' ? 'Tous' : CONTEXT_NAMES[item.context] || item.context}
        </span>
      </div>
      <div className="col-span-2 flex justify-end gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary transition-colors"
          title="Modifier"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-bg-tertiary rounded text-text-secondary hover:text-red-400 transition-colors"
          title="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
