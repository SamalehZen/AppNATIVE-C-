import React from 'react';
import { CleanupContext } from '../../shared/types';

interface CleanupPreviewProps {
  cleanedText: string;
  isProcessing: boolean;
  error: string | null;
  changes: string[];
  context: CleanupContext;
  onContextChange: (context: CleanupContext) => void;
  onCopy: () => void;
}

const CONTEXT_OPTIONS: { value: CleanupContext; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat' },
  { value: 'document', label: 'Document' },
  { value: 'code', label: 'Code' },
];

export const CleanupPreview: React.FC<CleanupPreviewProps> = ({
  cleanedText,
  isProcessing,
  error,
  changes,
  context,
  onContextChange,
  onCopy,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Cleaned
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={context}
            onChange={(e) => onContextChange(e.target.value as CleanupContext)}
            className="bg-bg-tertiary text-text-secondary text-xs rounded px-2 py-1 
                       border border-bg-tertiary focus:border-accent-purple focus:outline-none
                       non-draggable"
          >
            {CONTEXT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {cleanedText && (
            <button
              onClick={onCopy}
              className="text-xs bg-accent-purple hover:bg-accent-purple/80 text-white 
                         px-3 py-1 rounded transition-colors non-draggable"
            >
              Copy
            </button>
          )}
        </div>
      </div>
      <div
        className={`
          flex-1 bg-bg-secondary rounded-lg p-4 overflow-y-auto
          border border-bg-tertiary
          ${isProcessing ? 'border-accent-purple/30' : ''}
        `}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2 text-accent-purple">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Processing with AI...</span>
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : cleanedText ? (
          <>
            <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
              {cleanedText}
            </p>
            {changes.length > 0 && (
              <div className="mt-4 pt-3 border-t border-bg-tertiary">
                <p className="text-xs text-text-secondary">
                  Changes: {changes.join(' • ')}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-text-secondary italic">
            AI-cleaned text will appear here after recording.
          </p>
        )}
      </div>
    </div>
  );
};
