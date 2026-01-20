import React from 'react';

interface PatternsListProps {
  patterns: Array<{ text: string; count: number }>;
  title: string;
  maxDisplay: number;
}

export const PatternsList: React.FC<PatternsListProps> = ({
  patterns,
  title,
  maxDisplay,
}) => {
  const displayPatterns = patterns.slice(0, maxDisplay);

  if (displayPatterns.length === 0) {
    return (
      <div className="text-sm text-text-secondary italic">
        Aucun pattern détecté
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-text-primary">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {displayPatterns.map((pattern, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-bg-tertiary rounded-full text-sm"
          >
            <span className="text-text-primary">"{pattern.text}"</span>
            {pattern.count > 1 && (
              <span className="text-xs text-text-secondary">({pattern.count}x)</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};
