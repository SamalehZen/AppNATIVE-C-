import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Snippet, SnippetCategory, SNIPPET_CATEGORIES } from '../../shared/types';

interface SnippetFormProps {
  snippet?: Snippet | null;
  onSave: (snippet: Snippet) => void;
  onCancel: () => void;
}

export const SnippetForm: React.FC<SnippetFormProps> = ({ snippet, onSave, onCancel }) => {
  const [triggerPhrase, setTriggerPhrase] = useState('');
  const [triggerVariants, setTriggerVariants] = useState<string[]>([]);
  const [newVariant, setNewVariant] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<SnippetCategory>('personal');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (snippet) {
      setTriggerPhrase(snippet.triggerPhrase);
      setTriggerVariants(snippet.triggerVariants);
      setContent(snippet.content);
      setCategory(snippet.category);
      setIsActive(snippet.isActive);
    }
  }, [snippet]);

  const handleAddVariant = () => {
    if (newVariant.trim() && !triggerVariants.includes(newVariant.trim())) {
      setTriggerVariants([...triggerVariants, newVariant.trim()]);
      setNewVariant('');
    }
  };

  const handleRemoveVariant = (index: number) => {
    setTriggerVariants(triggerVariants.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerPhrase.trim()) return;

    const now = Date.now();
    const snippetData: Snippet = {
      id: snippet?.id || `snippet-${now}`,
      triggerPhrase: triggerPhrase.trim(),
      triggerVariants,
      content: content.trim(),
      category,
      isActive,
      usageCount: snippet?.usageCount || 0,
      createdAt: snippet?.createdAt || now,
      updatedAt: now,
    };

    onSave(snippetData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddVariant();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-bg-secondary border border-accent-purple rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-text-primary">
          {snippet ? 'Modifier le snippet' : 'Nouveau snippet'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-bg-tertiary rounded text-text-secondary transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              Phrase déclencheur <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={triggerPhrase}
              onChange={(e) => setTriggerPhrase(e.target.value)}
              placeholder="ex: mon IBAN"
              className="w-full bg-bg-tertiary border border-bg-tertiary rounded-lg px-3 py-2.5
                        text-text-primary text-sm focus:border-accent-purple focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SnippetCategory)}
              className="w-full bg-bg-tertiary border border-bg-tertiary rounded-lg px-3 py-2.5
                        text-text-primary text-sm cursor-pointer focus:border-accent-purple focus:outline-none"
            >
              {SNIPPET_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Variantes de déclenchement</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newVariant}
              onChange={(e) => setNewVariant(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ex: voici mon IBAN, insère mon IBAN"
              className="flex-1 bg-bg-tertiary border border-bg-tertiary rounded-lg px-3 py-2
                        text-text-primary text-sm focus:border-accent-purple focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddVariant}
              disabled={!newVariant.trim()}
              className="px-3 py-2 bg-bg-tertiary hover:bg-bg-primary text-text-primary rounded-lg
                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
            </button>
          </div>
          {triggerVariants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {triggerVariants.map((variant, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-bg-tertiary rounded text-sm text-text-secondary"
                >
                  {variant}
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-text-secondary mt-1">
            Ajoutez des variantes pour déclencher ce snippet de différentes façons
          </p>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">
            Contenu à insérer <span className="text-red-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="ex: FR76 1234 5678 9012 3456 7890 123"
            rows={4}
            className="w-full bg-bg-tertiary border border-bg-tertiary rounded-lg px-3 py-2.5
                      text-text-primary text-sm focus:border-accent-purple focus:outline-none resize-none"
          />
          <p className="text-xs text-text-secondary mt-1">
            Ce texte remplacera la phrase déclencheur pendant la dictée
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-bg-tertiary peer-focus:outline-none rounded-full peer 
                          peer-checked:after:translate-x-full peer-checked:after:border-white 
                          after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                          after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                          peer-checked:bg-accent-purple"></div>
          </label>
          <span className="text-sm text-text-secondary">Actif</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-bg-tertiary">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-bg-tertiary hover:bg-bg-primary text-text-primary rounded-lg
                    transition-colors text-sm"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!triggerPhrase.trim()}
          className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-lg
                    transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {snippet ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </form>
  );
};
