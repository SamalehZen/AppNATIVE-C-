import React, { ReactNode } from 'react';

interface SettingsSectionProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  icon,
  title,
  description,
  children,
}) => {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-5">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-2 bg-bg-tertiary rounded-lg text-accent-purple">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
      </div>
      <div className="pl-12">{children}</div>
    </div>
  );
};
