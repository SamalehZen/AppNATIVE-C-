import React from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';
import { SupportLevel } from '../../shared/types';

interface LanguageSupportBadgeProps {
  support: SupportLevel;
  type: 'speech' | 'translation';
  showTooltip?: boolean;
}

const TOOLTIPS = {
  speech: {
    full: 'Reconnaissance vocale complète',
    partial: 'Reconnaissance vocale partielle',
    none: 'Reconnaissance vocale non supportée',
  },
  translation: {
    full: 'Traduction complète',
    partial: 'Traduction partielle',
    none: 'Traduction non supportée',
  },
};

export const LanguageSupportBadge: React.FC<LanguageSupportBadgeProps> = ({
  support,
  type,
  showTooltip = true,
}) => {
  const tooltip = TOOLTIPS[type][support];

  if (support === 'full') {
    return (
      <span
        className="support-badge full"
        title={showTooltip ? tooltip : undefined}
      >
        <Check size={10} />
      </span>
    );
  }

  if (support === 'partial') {
    return (
      <span
        className="support-badge partial"
        title={showTooltip ? tooltip : undefined}
      >
        <AlertTriangle size={10} />
      </span>
    );
  }

  return (
    <span
      className="support-badge none"
      title={showTooltip ? tooltip : undefined}
    >
      <X size={10} />
    </span>
  );
};
