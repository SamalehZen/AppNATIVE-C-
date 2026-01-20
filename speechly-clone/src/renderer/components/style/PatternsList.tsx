import React from 'react';

interface PatternsListProps {
  patterns: Array<{ text: string; count?: number }>;
  title: string;
  maxDisplay?: number;
  emptyMessage?: string;
}

export const PatternsList: React.FC<PatternsListProps> = ({
  patterns,
  title,
  maxDisplay = 10,
  emptyMessage = 'Aucun pattern détecté',
}) => {
  const displayPatterns = patterns.slice(0, maxDisplay);

  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <h4 className="text-sm font-medium text-text-primary mb-3">{title}</h4>
      
      {displayPatterns.length === 0 ? (
        <p className="text-xs text-text-secondary italic">{emptyMessage}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {displayPatterns.map((pattern, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-bg-tertiary rounded-lg text-xs"
            >
              <span className="text-text-primary">"{pattern.text}"</span>
              {pattern.count !== undefined && (
                <span className="text-text-secondary">({pattern.count}x)</span>
              )}
            </span>
          ))}
        </div>
      )}
      
      {patterns.length > maxDisplay && (
        <p className="text-xs text-text-secondary mt-2">
          +{patterns.length - maxDisplay} autres
        </p>
      )}
    </div>
  );
};
