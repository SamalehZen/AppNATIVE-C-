import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

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
  const percentage = Math.round(score * 100);
  const isLearning = samplesCount < minSamples;
  const remaining = minSamples - samplesCount;

  const getBarColor = () => {
    if (isLearning) return 'bg-yellow-500';
    if (percentage >= 70) return 'bg-accent-green';
    if (percentage >= 40) return 'bg-accent-purple';
    return 'bg-orange-500';
  };

  const getStatusText = () => {
    if (isLearning) return 'En apprentissage';
    if (percentage >= 70) return 'Style actif';
    if (percentage >= 40) return 'Style partiel';
    return 'Style minimal';
  };

  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLearning ? (
            <AlertCircle size={18} className="text-yellow-500" />
          ) : (
            <TrendingUp size={18} className="text-accent-green" />
          )}
          <span className="text-sm font-medium text-text-primary">
            {getStatusText()}
          </span>
        </div>
        <span className="text-lg font-bold text-text-primary">{percentage}%</span>
      </div>

      <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor()} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-text-secondary mt-2">
        {isLearning
          ? `Encore ${remaining} échantillon${remaining > 1 ? 's' : ''} avant activation`
          : `Basé sur ${samplesCount} échantillons`}
      </p>
    </div>
  );
};
