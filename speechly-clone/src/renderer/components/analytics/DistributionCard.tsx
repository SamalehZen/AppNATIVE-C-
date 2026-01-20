import React from 'react';

interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface DistributionCardProps {
  title: string;
  items: DistributionItem[];
}

export const DistributionCard: React.FC<DistributionCardProps> = ({
  title,
  items,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-4">{title}</h3>
        <div className="text-center text-text-secondary py-4">Pas de données</div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-primary flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
              <span className="text-text-secondary">{item.percentage}%</span>
            </div>
            <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
