import React from 'react';
import { Flame, Trophy } from 'lucide-react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  longestStreak,
}) => {
  const isOnFire = currentStreak >= 7;

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-3">
        <div className={`relative ${isOnFire ? 'animate-pulse' : ''}`}>
          <Flame
            size={32}
            className={currentStreak > 0 ? 'text-orange-500' : 'text-text-secondary'}
          />
          {isOnFire && (
            <div className="absolute inset-0 blur-md">
              <Flame size={32} className="text-orange-500" />
            </div>
          )}
        </div>
        <div>
          <div className="text-2xl font-bold text-text-primary">{currentStreak}</div>
          <div className="text-xs text-text-secondary">jours d'affilée</div>
        </div>
      </div>

      <div className="h-10 w-px bg-bg-tertiary" />

      <div className="flex items-center gap-3">
        <Trophy size={24} className="text-yellow-500" />
        <div>
          <div className="text-lg font-semibold text-text-primary">{longestStreak}</div>
          <div className="text-xs text-text-secondary">record</div>
        </div>
      </div>
    </div>
  );
};
