import React from 'react';

interface DictationButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const DictationButton: React.FC<DictationButtonProps> = ({
  isListening,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-20 h-20 rounded-full flex items-center justify-center
        transition-all duration-300 ease-out non-draggable
        ${isListening 
          ? 'bg-accent-green recording-active' 
          : 'bg-bg-tertiary hover:bg-bg-secondary hover:scale-105'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-bg-primary
      `}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
    >
      {isListening ? (
        <div className="flex items-end gap-1 h-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white rounded-full wave-bar"
              style={{ height: '8px' }}
            />
          ))}
        </div>
      ) : (
        <svg
          className="w-8 h-8 text-text-primary"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      )}
    </button>
  );
};
