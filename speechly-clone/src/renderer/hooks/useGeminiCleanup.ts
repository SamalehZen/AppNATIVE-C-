import { useState, useCallback } from 'react';
import {
  CleanupOptions,
  CleanupResult,
  CleanupContext,
  DetectedContext,
  ContextCleanupResult,
  DictationMode,
} from '../../shared/types';

interface GeminiCleanupHook {
  cleanedText: string;
  isProcessing: boolean;
  error: string | null;
  changes: string[];
  cleanup: (text: string, options?: CleanupOptions) => Promise<void>;
  cleanupWithAutoContext: (text: string, language?: string) => Promise<DetectedContext | null>;
  cleanupWithMode: (text: string, mode: DictationMode, language?: string) => Promise<void>;
  reset: () => void;
  context: CleanupContext;
  setContext: (context: CleanupContext) => void;
  detectedContext: DetectedContext | null;
  processingTime: number | null;
  currentMode: DictationMode;
  setCurrentMode: (mode: DictationMode) => void;
}

export function useGeminiCleanup(): GeminiCleanupHook {
  const [cleanedText, setCleanedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<string[]>([]);
  const [context, setContext] = useState<CleanupContext>('general');
  const [detectedContext, setDetectedContext] = useState<DetectedContext | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<DictationMode>('auto');

  const cleanup = useCallback(
    async (text: string, options?: CleanupOptions) => {
      if (!text.trim()) {
        setCleanedText('');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result: CleanupResult = await window.electronAPI.cleanupTranscript(
          text,
          {
            context: options?.context || context,
            preserveStyle: options?.preserveStyle ?? true,
            removeFillers: options?.removeFillers ?? true,
            language: options?.language,
          }
        );

        setCleanedText(result.cleaned);
        setChanges(result.changes);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to cleanup text';
        setError(errorMessage);
        setCleanedText(text);
      } finally {
        setIsProcessing(false);
      }
    },
    [context]
  );

  const cleanupWithAutoContext = useCallback(
    async (text: string, language?: string): Promise<DetectedContext | null> => {
      if (!text.trim()) {
        setCleanedText('');
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result: ContextCleanupResult =
          await window.electronAPI.cleanupTranscriptAuto(text, language);

        setCleanedText(result.cleaned);
        setChanges(result.changes);

        if (result.context) {
          setDetectedContext(result.context);
          setContext(result.context.type);
        }

        if (result.processingTime) {
          setProcessingTime(result.processingTime);
        }

        return result.context || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to cleanup text';
        setError(errorMessage);
        setCleanedText(text);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const cleanupWithMode = useCallback(
    async (text: string, mode: DictationMode, language?: string): Promise<void> => {
      if (!text.trim()) {
        setCleanedText('');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result: ContextCleanupResult =
          await window.electronAPI.cleanupWithMode(text, mode, language);

        setCleanedText(result.cleaned);
        setChanges(result.changes);

        if (result.processingTime) {
          setProcessingTime(result.processingTime);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to cleanup text';
        setError(errorMessage);
        setCleanedText(text);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setCleanedText('');
    setError(null);
    setChanges([]);
    setDetectedContext(null);
    setProcessingTime(null);
  }, []);

  return {
    cleanedText,
    isProcessing,
    error,
    changes,
    cleanup,
    cleanupWithAutoContext,
    cleanupWithMode,
    reset,
    context,
    setContext,
    detectedContext,
    processingTime,
    currentMode,
    setCurrentMode,
  };
}
