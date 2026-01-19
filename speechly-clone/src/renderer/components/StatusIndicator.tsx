import React from 'react';

interface StatusIndicatorProps {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isListening,
  isProcessing,
  error,
}) => {
  const getStatus = () => {
    if (error) return { text: 'Error', color: 'bg-red-500' };
    if (isProcessing) return { text: 'Processing...', color: 'bg-accent-purple' };
    if (isListening) return { text: 'Listening...', color: 'bg-accent-green' };
    return { text: 'Ready', color: 'bg-text-secondary' };
  };

  const status = getStatus();

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${status.color} ${isListening ? 'animate-pulse' : ''}`} />
      <span className="text-sm text-text-secondary">{status.text}</span>
    </div>
  );
};
