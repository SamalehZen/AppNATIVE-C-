import { useState, useCallback } from 'react';
import { CleanupOptions, CleanupResult, CleanupContext } from '../../shared/types';

interface GeminiCleanupHook {
  cleanedText: string;
  isProcessing: boolean;
  error: string | null;
  changes: string[];
  cleanup: (text: string, options?: CleanupOptions) => Promise<void>;
  reset: () => void;
  context: CleanupContext;
  setContext: (context: CleanupContext) => void;
}

export function useGeminiCleanup(): GeminiCleanupHook {
  const [cleanedText, setCleanedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<string[]>([]);
  const [context, setContext] = useState<CleanupContext>('general');

  const cleanup = useCallback(async (text: string, options?: CleanupOptions) => {
    if (!text.trim()) {
      setCleanedText('');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result: CleanupResult = await window.electronAPI.cleanupTranscript(text, {
        context: options?.context || context,
        preserveStyle: options?.preserveStyle ?? true,
        removeFillers: options?.removeFillers ?? true,
        language: options?.language,
      });

      setCleanedText(result.cleaned);
      setChanges(result.changes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup text';
      setError(errorMessage);
      setCleanedText(text);
    } finally {
      setIsProcessing(false);
    }
  }, [context]);

  const reset = useCallback(() => {
    setCleanedText('');
    setError(null);
    setChanges([]);
  }, []);

  return {
    cleanedText,
    isProcessing,
    error,
    changes,
    cleanup,
    reset,
    context,
    setContext,
  };
}
