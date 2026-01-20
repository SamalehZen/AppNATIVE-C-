import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { StyleSampleText } from '../../../shared/types';

interface SampleTextsListProps {
  samples: StyleSampleText[];
  maxInitialDisplay?: number;
}

export const SampleTextsList: React.FC<SampleTextsListProps> = ({
  samples,
  maxInitialDisplay = 5,
}) => {
  const [expanded, setExpanded] = useState(false);
  const displaySamples = expanded ? samples : samples.slice(0, maxInitialDisplay);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContextLabel = (context: string) => {
    const labels: Record<string, string> = {
      email: 'Email',
      chat: 'Message',
      code: 'Code',
      document: 'Document',
      general: 'Général',
    };
    return labels[context] || context;
  };

  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-text-secondary" />
          <h4 className="text-sm font-medium text-text-primary">Échantillons de référence</h4>
        </div>
        <span className="text-xs text-text-secondary">{samples.length} total</span>
      </div>

      {samples.length === 0 ? (
        <p className="text-xs text-text-secondary italic">
          Aucun échantillon. Dictez du texte pour alimenter l'apprentissage.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {displaySamples.map((sample, index) => (
              <div
                key={index}
                className="p-3 bg-bg-tertiary rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 bg-bg-secondary rounded text-text-secondary">
                    {getContextLabel(sample.context)}
                  </span>
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(sample.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-text-primary line-clamp-2">
                  "{sample.text}"
                </p>
              </div>
            ))}
          </div>

          {samples.length > maxInitialDisplay && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp size={14} />
                  Voir moins
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Voir {samples.length - maxInitialDisplay} autres
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
};
