import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StyleMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
}

export const StyleMetricCard: React.FC<StyleMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
}) => {
  return (
    <div className="bg-bg-tertiary rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-text-secondary">
        <Icon size={16} />
        <span className="text-xs font-medium">{title}</span>
      </div>
      <div className="text-xl font-bold text-text-primary">{value}</div>
      <p className="text-xs text-text-secondary">{description}</p>
    </div>
  );
};
