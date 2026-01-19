import React from 'react';

interface TranscriptDisplayProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  interimTranscript,
  isListening,
}) => {
  const hasContent = transcript || interimTranscript;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Original
        </h3>
        {isListening && (
          <span className="text-xs text-accent-green animate-pulse">● Recording</span>
        )}
      </div>
      <div
        className={`
          flex-1 bg-bg-secondary rounded-lg p-4 overflow-y-auto
          border border-bg-tertiary
          ${isListening ? 'border-accent-green/30' : ''}
        `}
      >
        {hasContent ? (
          <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
            {transcript}
            {interimTranscript && (
              <span className="text-text-secondary opacity-70">{interimTranscript}</span>
            )}
          </p>
        ) : (
          <p className="text-text-secondary italic">
            {isListening 
              ? 'Listening... Start speaking.' 
              : 'Click the microphone to start dictating.'}
          </p>
        )}
      </div>
    </div>
  );
};
