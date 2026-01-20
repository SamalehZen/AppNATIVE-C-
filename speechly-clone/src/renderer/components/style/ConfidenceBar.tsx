import React from 'react';

interface ConfidenceBarProps {
  score: number;
  samplesCount: number;
  minSamples: number;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  score,
  samplesCount,
  minSamples,
}) => {
  const isReady = samplesCount >= minSamples;
  const progressPercent = Math.min(100, (samplesCount / minSamples) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">
          Score de confiance
        </span>
        <span className="text-sm font-bold text-accent-purple">{Math.round(score)}%</span>
      </div>
      <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            isReady ? 'bg-accent-green' : 'bg-accent-purple'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-text-secondary">
        {isReady ? (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-accent-green rounded-full" />
            Basé sur {samplesCount} échantillons
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            En apprentissage - {minSamples - samplesCount} échantillons requis
          </span>
        )}
      </p>
    </div>
  );
};
