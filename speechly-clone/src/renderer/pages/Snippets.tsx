import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Zap, Download, Upload, ToggleLeft, ToggleRight, User, CreditCard, Link, FileText, PenTool } from 'lucide-react';
import { Snippet, SnippetCategory, SNIPPET_CATEGORIES } from '../../shared/types';
import { SnippetForm } from '../components/SnippetForm';

const categoryIcons: Record<SnippetCategory, React.ReactNode> = {
  personal: <User size={14} />,
  financial: <CreditCard size={14} />,
  links: <Link size={14} />,
  templates: <FileText size={14} />,
  signatures: <PenTool size={14} />,
};

export const Snippets: React.FC = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SnippetCategory | 'all'>('all');

  const loadSnippets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await window.electronAPI.getSnippets();
      setSnippets(data);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  const filteredSnippets = snippets.filter((snippet) => {
    const matchesSearch =
      snippet.triggerPhrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.triggerVariants.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || snippet.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedSnippets = filteredSnippets.reduce((acc, snippet) => {
    if (!acc[snippet.category]) {
      acc[snippet.category] = [];
    }
    acc[snippet.category].push(snippet);
    return acc;
  }, {} as Record<SnippetCategory, Snippet[]>);

  const handleSave = async (snippet: Snippet) => {
    await window.electronAPI.saveSnippet(snippet);
    setShowForm(false);
    setEditingSnippet(null);
    await loadSnippets();
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce snippet ?')) {
      await window.electronAPI.deleteSnippet(id);
      await loadSnippets();
    }
  };

  const handleToggleActive = async (snippet: Snippet) => {
    await window.electronAPI.updateSnippet(snippet.id, { isActive: !snippet.isActive });
    await loadSnippets();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(snippets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snippets-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const imported = JSON.parse(event.target?.result as string) as Snippet[];
            for (const snippet of imported) {
              const newSnippet = {
                ...snippet,
                id: `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              await window.electronAPI.saveSnippet(newSnippet);
            }
            await loadSnippets();
          } catch (error) {
            console.error('Failed to import snippets:', error);
            alert('Erreur lors de l\'import du fichier');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getCategoryLabel = (category: SnippetCategory) => {
    return SNIPPET_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Zap className="text-accent-purple" size={24} />
            Snippets
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Configurez des raccourcis vocaux pour insérer automatiquement du texte
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary 
                      text-text-secondary rounded-lg transition-colors text-sm"
            title="Importer des snippets"
          >
            <Upload size={16} />
            Importer
          </button>
          <button
            onClick={handleExport}
            disabled={snippets.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary 
                      text-text-secondary rounded-lg transition-colors text-sm
                      disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exporter les snippets"
          >
            <Download size={16} />
            Exporter
          </button>
          <button
            onClick={() => {
              setEditingSnippet(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 
                      text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Rechercher un snippet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-secondary border border-bg-tertiary rounded-lg pl-10 pr-4 py-2.5
                      text-text-primary placeholder:text-text-secondary
                      focus:border-accent-purple focus:outline-none"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as SnippetCategory | 'all')}
          className="bg-bg-secondary border border-bg-tertiary rounded-lg px-4 py-2.5
                    text-text-primary cursor-pointer focus:border-accent-purple focus:outline-none"
        >
          <option value="all">Toutes les catégories</option>
          {SNIPPET_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="mb-6">
          <SnippetForm
            snippet={editingSnippet}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingSnippet(null);
            }}
          />
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
          </div>
        ) : filteredSnippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <Zap size={48} className="mb-4 opacity-50" />
            <p>{searchQuery ? 'Aucun résultat trouvé' : 'Aucun snippet configuré'}</p>
            {!searchQuery && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-accent-purple hover:underline"
              >
                Créer votre premier snippet
              </button>
            )}
          </div>
        ) : selectedCategory === 'all' ? (
          <div className="space-y-6">
            {SNIPPET_CATEGORIES.map((cat) => {
              const categorySnippets = groupedSnippets[cat.value];
              if (!categorySnippets?.length) return null;
              
              return (
                <div key={cat.value}>
                  <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                    {categoryIcons[cat.value]}
                    {cat.label}
                    <span className="text-xs bg-bg-tertiary px-2 py-0.5 rounded">
                      {categorySnippets.length}
                    </span>
                  </h2>
                  <div className="space-y-2">
                    {categorySnippets.map((snippet) => (
                      <SnippetItem
                        key={snippet.id}
                        snippet={snippet}
                        onEdit={() => handleEdit(snippet)}
                        onDelete={() => handleDelete(snippet.id)}
                        onToggleActive={() => handleToggleActive(snippet)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSnippets.map((snippet) => (
              <SnippetItem
                key={snippet.id}
                snippet={snippet}
                onEdit={() => handleEdit(snippet)}
                onDelete={() => handleDelete(snippet.id)}
                onToggleActive={() => handleToggleActive(snippet)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface SnippetItemProps {
  snippet: Snippet;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

const SnippetItem: React.FC<SnippetItemProps> = ({ snippet, onEdit, onDelete, onToggleActive }) => {
  const categoryLabel = SNIPPET_CATEGORIES.find((c) => c.value === snippet.category)?.label || snippet.category;
  
  return (
    <div
      className={`p-4 bg-bg-secondary border rounded-lg transition-all ${
        snippet.isActive ? 'border-bg-tertiary hover:border-gray-600' : 'border-bg-tertiary opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-text-primary">{snippet.triggerPhrase}</span>
            {!snippet.content && (
              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                Non configuré
              </span>
            )}
            {!snippet.isActive && (
              <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                Inactif
              </span>
            )}
          </div>
          
          {snippet.triggerVariants.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {snippet.triggerVariants.slice(0, 3).map((variant, i) => (
                <span key={i} className="text-xs text-text-secondary bg-bg-tertiary px-1.5 py-0.5 rounded">
                  {variant}
                </span>
              ))}
              {snippet.triggerVariants.length > 3 && (
                <span className="text-xs text-text-secondary">
                  +{snippet.triggerVariants.length - 3}
                </span>
              )}
            </div>
          )}
          
          <p className="text-sm text-text-secondary truncate" title={snippet.content}>
            {snippet.content ? `→ ${snippet.content}` : 'Cliquez pour configurer le contenu'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-bg-tertiary rounded text-text-secondary flex items-center gap-1">
            {categoryIcons[snippet.category]}
            {categoryLabel}
          </span>
          <span className="text-xs text-text-secondary" title="Nombre d'utilisations">
            {snippet.usageCount}×
          </span>
          <button
            onClick={onToggleActive}
            className={`p-1.5 rounded transition-colors ${
              snippet.isActive
                ? 'text-accent-green hover:bg-accent-green/20'
                : 'text-text-secondary hover:bg-bg-tertiary'
            }`}
            title={snippet.isActive ? 'Désactiver' : 'Activer'}
          >
            {snippet.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
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
    </div>
  );
};
