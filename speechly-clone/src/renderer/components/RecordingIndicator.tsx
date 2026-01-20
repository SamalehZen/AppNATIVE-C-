import React, { useEffect, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { RecordingTriggerMode } from '../../shared/types';

interface RecordingIndicatorProps {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
  mode: RecordingTriggerMode;
  onStop?: () => void;
}

const MODE_LABELS: Record<RecordingTriggerMode, string> = {
  'double-tap': 'Double-tap pour arrêter',
  'hold': 'Relâchez pour arrêter',
  'toggle': 'Appuyez pour arrêter',
};

export const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
  isRecording,
  duration,
  audioLevel,
  mode,
  onStop,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isRecording) {
      setVisible(true);
    } else {
      const timeout = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isRecording]);

  if (!visible) return null;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const normalizedLevel = Math.min(Math.max(audioLevel, 0), 1);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isRecording ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-bg-secondary/95 backdrop-blur-lg border border-accent-purple/30 rounded-2xl p-4 shadow-2xl min-w-[200px]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 bg-red-500/30 rounded-full animate-ping"
              style={{ animationDuration: '1.5s' }}
            />
            <div className="relative w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <Mic size={20} className="text-white" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">
                Enregistrement
              </span>
              <span className="text-sm font-mono text-accent-purple">
                {formatDuration(duration)}
              </span>
            </div>

            <div className="mt-2 h-1 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-purple to-red-500 transition-all duration-100"
                style={{ width: `${normalizedLevel * 100}%` }}
              />
            </div>

            <p className="mt-1 text-xs text-text-secondary">
              {MODE_LABELS[mode]}
            </p>
          </div>
        </div>

        {onStop && (
          <button
            onClick={onStop}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
          >
            <Square size={14} />
            Arrêter
          </button>
        )}
      </div>
    </div>
  );
};

export default RecordingIndicator;
