import React, { useState } from 'react';
import { Plus, X, Code } from 'lucide-react';

interface VocabularyManagerProps {
  technicalTerms: string[];
  onAddTerm: (term: string) => void;
  onRemoveTerm: (term: string) => void;
}

export const VocabularyManager: React.FC<VocabularyManagerProps> = ({
  technicalTerms,
  onAddTerm,
  onRemoveTerm,
}) => {
  const [newTerm, setNewTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newTerm.trim()) {
      onAddTerm(newTerm.trim());
      setNewTerm('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTerm('');
    }
  };

  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Code size={18} className="text-accent-purple" />
          <h4 className="text-sm font-medium text-text-primary">Vocabulaire technique</h4>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-bg-tertiary hover:bg-bg-primary rounded-lg transition-colors text-text-secondary hover:text-text-primary"
        >
          <Plus size={14} />
          Ajouter
        </button>
      </div>

      {isAdding && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nouveau terme..."
            autoFocus
            className="flex-1 px-3 py-2 bg-bg-tertiary text-text-primary rounded-lg text-sm border border-bg-tertiary focus:border-accent-purple focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 bg-accent-purple text-white rounded-lg text-sm hover:bg-accent-purple/80 transition-colors"
          >
            OK
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewTerm('');
            }}
            className="px-3 py-2 bg-bg-tertiary text-text-secondary rounded-lg text-sm hover:bg-bg-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {technicalTerms.length === 0 ? (
        <p className="text-xs text-text-secondary italic">
          Aucun terme technique. Les termes seront détectés automatiquement.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {technicalTerms.map((term, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-accent-purple/10 border border-accent-purple/30 rounded-lg text-xs group"
            >
              <span className="text-accent-purple">{term}</span>
              <button
                onClick={() => onRemoveTerm(term)}
                className="text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
