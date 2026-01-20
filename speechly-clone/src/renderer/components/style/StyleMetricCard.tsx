import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StyleMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
  variant?: 'default' | 'accent' | 'warning';
}

export const StyleMetricCard: React.FC<StyleMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'accent':
        return 'border-accent-purple/30 bg-accent-purple/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      default:
        return 'border-bg-tertiary bg-bg-secondary';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'accent':
        return 'text-accent-purple';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-text-secondary';
    }
  };

  return (
    <div className={`rounded-xl p-4 border ${getVariantStyles()}`}>
      <div className="flex items-start justify-between mb-2">
        <Icon size={20} className={getIconColor()} />
        <span className="text-lg font-bold text-text-primary">{value}</span>
      </div>
      <h4 className="text-sm font-medium text-text-primary mb-1">{title}</h4>
      <p className="text-xs text-text-secondary">{description}</p>
    </div>
  );
};
