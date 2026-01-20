import React from 'react';

interface HeatmapChartProps {
  hourlyData: number[];
  weeklyData: number[];
}

const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const hourLabels = ['0h', '6h', '12h', '18h', '23h'];

function getIntensity(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-bg-tertiary';
  const ratio = value / max;
  if (ratio > 0.75) return 'bg-accent-purple';
  if (ratio > 0.5) return 'bg-accent-purple/70';
  if (ratio > 0.25) return 'bg-accent-purple/40';
  return 'bg-accent-purple/20';
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  hourlyData,
  weeklyData,
}) => {
  const maxHourly = Math.max(...hourlyData, 1);
  const maxWeekly = Math.max(...weeklyData, 1);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm text-text-secondary mb-3">Heures d'activité</h4>
        <div className="flex gap-1">
          {hourlyData.map((value, hour) => (
            <div
              key={hour}
              className={`flex-1 h-6 rounded-sm ${getIntensity(value, maxHourly)} transition-colors`}
              title={`${hour}h: ${value} mots`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          {hourLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm text-text-secondary mb-3">Jours d'activité</h4>
        <div className="flex gap-2">
          {weeklyData.map((value, day) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-8 rounded ${getIntensity(value, maxWeekly)} transition-colors`}
                title={`${dayLabels[day]}: ${value} mots`}
              />
              <span className="text-xs text-text-secondary">{dayLabels[day]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
