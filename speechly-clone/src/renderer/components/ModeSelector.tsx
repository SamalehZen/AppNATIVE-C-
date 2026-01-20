import React, { useEffect, useCallback } from 'react';
import { Wand2, Mic, Mail, Terminal, CheckSquare, FileText } from 'lucide-react';
import { DictationMode, ModeConfig } from '../../shared/types';
import { DICTATION_MODES, MODE_KEYBOARD_SHORTCUTS } from '../../shared/constants';

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Wand2,
  Mic,
  Mail,
  Terminal,
  CheckSquare,
  FileText,
};

interface ModeSelectorProps {
  currentMode: DictationMode;
  onModeChange: (mode: DictationMode) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
  compact = false,
}) => {
  const handleKeyboardShortcut = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;
      if (!event.ctrlKey && !event.metaKey) return;

      const keyToMode: Record<string, DictationMode> = {
        '1': 'auto',
        '2': 'raw',
        '3': 'email',
        '4': 'prompt',
        '5': 'todo',
        '6': 'notes',
      };

      const mode = keyToMode[event.key];
      if (mode) {
        event.preventDefault();
        onModeChange(mode);
      }
    },
    [disabled, onModeChange]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [handleKeyboardShortcut]);

  const renderModeButton = (mode: ModeConfig) => {
    const IconComponent = ICON_MAP[mode.icon];
    const isActive = currentMode === mode.id;
    const shortcut = MODE_KEYBOARD_SHORTCUTS[mode.id];

    return (
      <button
        key={mode.id}
        onClick={() => onModeChange(mode.id)}
        disabled={disabled}
        title={`${mode.name}: ${mode.description}\n${shortcut}`}
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
          ${isActive
            ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/25'
            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${compact ? 'px-2 py-1.5' : ''}
        `}
      >
        {IconComponent && <IconComponent size={compact ? 14 : 16} />}
        {!compact && (
          <span className="text-sm font-medium">{mode.name}</span>
        )}
        {isActive && !compact && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-green rounded-full animate-pulse" />
        )}
      </button>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 p-1 bg-bg-secondary rounded-lg">
        {DICTATION_MODES.map(renderModeButton)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 p-1 bg-bg-secondary rounded-xl">
        {DICTATION_MODES.map(renderModeButton)}
      </div>
      <p className="text-xs text-text-secondary text-center">
        {DICTATION_MODES.find(m => m.id === currentMode)?.description}
      </p>
    </div>
  );
};

interface ModeIndicatorProps {
  mode: DictationMode;
  showLabel?: boolean;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({ mode, showLabel = true }) => {
  const modeConfig = DICTATION_MODES.find(m => m.id === mode);
  if (!modeConfig) return null;

  const IconComponent = ICON_MAP[modeConfig.icon];

  return (
    <div className="flex items-center gap-2 text-text-secondary">
      {IconComponent && <IconComponent size={14} />}
      {showLabel && <span className="text-xs">{modeConfig.name}</span>}
    </div>
  );
};

interface ModeDropdownProps {
  currentMode: DictationMode;
  onModeChange: (mode: DictationMode) => void;
  disabled?: boolean;
}

export const ModeDropdown: React.FC<ModeDropdownProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentModeConfig = DICTATION_MODES.find(m => m.id === currentMode);
  const IconComponent = currentModeConfig ? ICON_MAP[currentModeConfig.icon] : null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
          bg-bg-tertiary text-text-primary hover:bg-bg-secondary
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {IconComponent && <IconComponent size={16} />}
        <span className="text-sm">{currentModeConfig?.name || 'Auto'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg z-20 overflow-hidden">
            {DICTATION_MODES.map((mode) => {
              const ModeIcon = ICON_MAP[mode.icon];
              const isActive = currentMode === mode.id;
              const shortcut = MODE_KEYBOARD_SHORTCUTS[mode.id];

              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    onModeChange(mode.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    ${isActive
                      ? 'bg-accent-purple/20 text-accent-purple'
                      : 'text-text-primary hover:bg-bg-tertiary'
                    }
                  `}
                >
                  {ModeIcon && <ModeIcon size={18} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{mode.name}</span>
                      <span className="text-xs text-text-secondary">{shortcut}</span>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{mode.description}</p>
                  </div>
                  {isActive && (
                    <svg className="w-4 h-4 text-accent-purple" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
