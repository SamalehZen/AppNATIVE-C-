import React, { useState, useEffect, useCallback } from 'react';
import { Settings, DetectedContext } from '../shared/types';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useGeminiCleanup } from './hooks/useGeminiCleanup';
import { DictationButton } from './components/DictationButton';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { CleanupPreview } from './components/CleanupPreview';
import { LanguageSelector } from './components/LanguageSelector';
import { StatusIndicator } from './components/StatusIndicator';
import { SettingsModal } from './components/SettingsModal';
import { ContextIndicator, ContextSelector, ContextType } from './components/ContextIndicator';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDetectingContext, setIsDetectingContext] = useState(false);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [manualContext, setManualContext] = useState<DetectedContext | null>(null);

  const {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    language,
    setLanguage,
    error: speechError,
    isSupported,
  } = useSpeechRecognition();

  const {
    cleanedText,
    isProcessing,
    error: cleanupError,
    changes,
    cleanup,
    cleanupWithAutoContext,
    reset: resetCleanup,
    context,
    setContext,
    detectedContext,
    processingTime,
  } = useGeminiCleanup();

  const activeContext = manualContext || detectedContext;

  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      setSettings(s);
      if (s?.defaultLanguage) {
        setLanguage(s.defaultLanguage);
      }
      if (!s?.geminiApiKey) {
        setShowSettings(true);
      }
    });
  }, [setLanguage]);

  const detectContextBeforeDictation = useCallback(async () => {
    setIsDetectingContext(true);
    try {
      const windowInfo = await window.electronAPI.getActiveWindow();
      if (windowInfo) {
        const detected = await window.electronAPI.detectContext(windowInfo);
        if (!manualContext) {
          setContext(detected.type as any);
        }
      }
    } catch (error) {
      console.error('Context detection error:', error);
    } finally {
      setIsDetectingContext(false);
    }
  }, [manualContext, setContext]);

  const handleToggleRecording = useCallback(async () => {
    if (isListening) {
      stopListening();
      if (transcript && settings?.autoCleanup) {
        if (manualContext) {
          await window.electronAPI.cleanupWithContext(transcript, manualContext, language);
        } else {
          await cleanupWithAutoContext(transcript, language);
        }
      }
    } else {
      resetTranscript();
      resetCleanup();
      setManualContext(null);
      await detectContextBeforeDictation();
      startListening();
    }
  }, [
    isListening,
    stopListening,
    startListening,
    transcript,
    cleanupWithAutoContext,
    language,
    settings,
    resetTranscript,
    resetCleanup,
    detectContextBeforeDictation,
    manualContext,
  ]);

  useEffect(() => {
    const handleHotkey = () => {
      handleToggleRecording();
    };

    if (window.electronAPI?.onToggleRecording) {
      window.electronAPI.onToggleRecording(handleHotkey);
    }

    return () => {
      if (window.electronAPI?.removeToggleRecordingListener) {
        window.electronAPI.removeToggleRecordingListener();
      }
    };
  }, [handleToggleRecording]);

  const handleCopy = async () => {
    const textToCopy = cleanedText || transcript;
    if (textToCopy) {
      await window.electronAPI.copyToClipboard(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if (transcript && cleanedText) {
        await window.electronAPI.saveTranscript({
          original: transcript,
          cleaned: cleanedText,
          language,
          context: activeContext?.type || context,
        });
      }
    }
  };

  const handleSaveSettings = async (newSettings: Partial<Settings>) => {
    await window.electronAPI.saveSettings(newSettings);
    const updated = await window.electronAPI.getSettings();
    setSettings(updated);
    if (newSettings.defaultLanguage) {
      setLanguage(newSettings.defaultLanguage);
    }
  };

  const handleManualCleanup = async () => {
    if (transcript) {
      if (manualContext) {
        const result = await window.electronAPI.cleanupWithContext(
          transcript,
          manualContext,
          language
        );
        if (result) {
          // Update state through the hook would be ideal, but for now direct call works
        }
      } else {
        await cleanupWithAutoContext(transcript, language);
      }
    }
  };

  const handleContextOverride = (contextType: ContextType) => {
    setShowContextSelector(true);
  };

  const handleContextSelect = (contextType: ContextType) => {
    const contextNames: Record<ContextType, string> = {
      email: 'Email',
      chat: 'Messagerie',
      code: 'Code',
      document: 'Document',
      browser: 'Navigateur',
      social: 'Réseaux sociaux',
      ai: 'Assistant IA',
      spreadsheet: 'Tableur',
      terminal: 'Terminal',
      general: 'Général',
    };

    const contextIcons: Record<ContextType, string> = {
      email: 'mail',
      chat: 'message-circle',
      code: 'code',
      document: 'file-text',
      browser: 'globe',
      social: 'share-2',
      ai: 'bot',
      spreadsheet: 'table',
      terminal: 'terminal',
      general: 'edit',
    };

    setManualContext({
      type: contextType,
      name: contextNames[contextType],
      icon: contextIcons[contextType],
      appName: 'Manuel',
      confidence: 'high',
    });
    setContext(contextType as any);
    setShowContextSelector(false);
  };

  const wordCount = (cleanedText || transcript)
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <header className="draggable flex items-center justify-between px-6 py-4 border-b border-bg-tertiary">
        <div className="flex items-center gap-4 pl-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-green flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-text-primary">
              Speechly
            </span>
          </div>
          <StatusIndicator
            isListening={isListening}
            isProcessing={isProcessing}
            error={speechError || cleanupError}
          />
        </div>
        <div className="flex items-center gap-3 non-draggable">
          <div className="relative">
            <ContextIndicator
              context={activeContext}
              isDetecting={isDetectingContext}
              onOverride={handleContextOverride}
              compact
            />
            <ContextSelector
              currentContext={(activeContext?.type || context) as ContextType}
              onSelect={handleContextSelect}
              isOpen={showContextSelector}
              onClose={() => setShowContextSelector(false)}
            />
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <svg
              className="w-5 h-5 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 overflow-hidden">
        <div className="flex flex-col items-center gap-4 mb-6">
          <DictationButton
            isListening={isListening}
            onClick={handleToggleRecording}
            disabled={!isSupported}
          />
          {!isSupported && (
            <p className="text-red-400 text-sm">
              Speech recognition is not supported in this browser.
            </p>
          )}
          {speechError && <p className="text-red-400 text-sm">{speechError}</p>}
          <p className="text-text-secondary text-sm">
            {isListening ? 'Click to stop' : 'Click to start dictation'}
          </p>
          {activeContext && !isListening && (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span>Contexte:</span>
              <ContextIndicator
                context={activeContext}
                isDetecting={false}
                compact
              />
              {manualContext && (
                <button
                  onClick={() => setManualContext(null)}
                  className="text-text-secondary hover:text-text-primary ml-1"
                  title="Utiliser détection auto"
                >
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          <TranscriptDisplay
            transcript={transcript}
            interimTranscript={interimTranscript}
            isListening={isListening}
          />
          <CleanupPreview
            cleanedText={cleanedText}
            isProcessing={isProcessing}
            error={cleanupError}
            changes={changes}
            context={context}
            onContextChange={setContext}
            onCopy={handleCopy}
          />
        </div>
      </main>

      <footer className="flex items-center justify-between px-6 py-3 border-t border-bg-tertiary">
        <div className="flex items-center gap-4">
          <LanguageSelector
            value={language}
            onChange={setLanguage}
            disabled={isListening}
          />
          {processingTime && (
            <span className="text-xs text-text-secondary">
              {processingTime}ms
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          {!settings?.autoCleanup && transcript && !cleanedText && (
            <button
              onClick={handleManualCleanup}
              disabled={isProcessing}
              className="text-sm bg-accent-purple hover:bg-accent-purple/80 text-white 
                         px-4 py-2 rounded-lg transition-colors disabled:opacity-50 non-draggable"
            >
              Clean with AI
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!transcript && !cleanedText}
            className={`
              text-sm px-4 py-2 rounded-lg transition-colors non-draggable
              ${
                copied
                  ? 'bg-accent-green text-white'
                  : 'bg-bg-tertiary text-text-primary hover:bg-bg-secondary'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </footer>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};
