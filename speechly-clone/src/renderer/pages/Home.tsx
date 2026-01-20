import React, { useState, useEffect, useCallback } from 'react';
import { DetectedContext, SnippetReplacement, DictationMode } from '../../shared/types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useGeminiCleanup } from '../hooks/useGeminiCleanup';
import { useSettings } from '../stores/settings';
import { DictationButton } from '../components/DictationButton';
import { TranscriptDisplay } from '../components/TranscriptDisplay';
import { CleanupPreview } from '../components/CleanupPreview';
import { LanguageSelector } from '../components/LanguageSelector';
import { StatusIndicator } from '../components/StatusIndicator';
import { ContextIndicator, ContextSelector, ContextType } from '../components/ContextIndicator';
import { ModeSelector, ModeIndicator } from '../components/ModeSelector';

export const Home: React.FC = () => {
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);
  const [isDetectingContext, setIsDetectingContext] = useState(false);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [manualContext, setManualContext] = useState<DetectedContext | null>(null);
  const [snippetReplacements, setSnippetReplacements] = useState<SnippetReplacement[]>([]);
  const [showSnippetNotification, setShowSnippetNotification] = useState(false);

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
    cleanupWithAutoContext,
    cleanupWithMode,
    reset: resetCleanup,
    context,
    setContext,
    detectedContext,
    processingTime,
    currentMode,
    setCurrentMode,
  } = useGeminiCleanup();

  const activeContext = manualContext || detectedContext;

  useEffect(() => {
    if (settings?.defaultLanguage) {
      setLanguage(settings.defaultLanguage);
    }
  }, [settings?.defaultLanguage, setLanguage]);

  useEffect(() => {
    if (settings?.defaultDictationMode && !settings?.alwaysUseAutoMode) {
      setCurrentMode(settings.defaultDictationMode);
    } else if (settings?.alwaysUseAutoMode) {
      setCurrentMode('auto');
    }
  }, [settings?.defaultDictationMode, settings?.alwaysUseAutoMode, setCurrentMode]);

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
      if (transcript) {
        const snippetResult = await window.electronAPI.processSnippets(transcript);
        const textToClean = snippetResult.processedText;
        
        if (snippetResult.replacements.length > 0) {
          setSnippetReplacements(snippetResult.replacements);
          setShowSnippetNotification(true);
          setTimeout(() => setShowSnippetNotification(false), 5000);
        }
        
        if (settings?.autoCleanup) {
          if (currentMode !== 'auto') {
            await cleanupWithMode(textToClean, currentMode, language);
          } else if (manualContext) {
            await window.electronAPI.cleanupWithContext(textToClean, manualContext, language);
          } else {
            await cleanupWithAutoContext(textToClean, language);
          }
        }
      }
    } else {
      resetTranscript();
      resetCleanup();
      setManualContext(null);
      setSnippetReplacements([]);
      if (currentMode === 'auto') {
        await detectContextBeforeDictation();
      }
      startListening();
    }
  }, [
    isListening,
    stopListening,
    startListening,
    transcript,
    cleanupWithAutoContext,
    cleanupWithMode,
    currentMode,
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
    if (window.electronAPI?.onToggleDictation) {
      window.electronAPI.onToggleDictation(handleHotkey);
    }

    return () => {
      if (window.electronAPI?.removeToggleRecordingListener) {
        window.electronAPI.removeToggleRecordingListener();
      }
      if (window.electronAPI?.removeToggleDictationListener) {
        window.electronAPI.removeToggleDictationListener();
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

  const handleManualCleanup = async () => {
    if (transcript) {
      if (currentMode !== 'auto') {
        await cleanupWithMode(transcript, currentMode, language);
      } else if (manualContext) {
        await window.electronAPI.cleanupWithContext(transcript, manualContext, language);
      } else {
        await cleanupWithAutoContext(transcript, language);
      }
    }
  };

  const handleModeChange = (mode: DictationMode) => {
    setCurrentMode(mode);
    if (mode !== 'auto') {
      setManualContext(null);
    }
  };

  const handleContextOverride = () => {
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
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-bg-tertiary">
        <div className="flex items-center gap-4">
          <StatusIndicator
            isListening={isListening}
            isProcessing={isProcessing}
            error={speechError || cleanupError}
          />
          {currentMode !== 'auto' && (
            <ModeIndicator mode={currentMode} />
          )}
        </div>
        <div className="flex items-center gap-3 non-draggable">
          {currentMode === 'auto' && (
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
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 overflow-hidden">
        <div className="flex flex-col items-center gap-4 mb-6">
          <ModeSelector
            currentMode={currentMode}
            onModeChange={handleModeChange}
            disabled={isListening}
          />
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
            {isListening ? 'Cliquez pour arrêter' : 'Cliquez pour commencer la dictée'}
          </p>
          {currentMode === 'auto' && activeContext && !isListening && (
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

        {showSnippetNotification && snippetReplacements.length > 0 && (
          <div className="w-full max-w-4xl mb-4">
            <div className="bg-accent-purple/20 border border-accent-purple/40 rounded-lg p-3">
              <p className="text-sm text-accent-purple font-medium mb-2">Snippets insérés:</p>
              <div className="space-y-1">
                {snippetReplacements.map((replacement, index) => (
                  <div key={index} className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="text-text-primary">{replacement.trigger}</span>
                    <span>→</span>
                    <span className="text-accent-green truncate">{replacement.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
        <div className="flex items-center gap-4 non-draggable">
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
        <div className="flex items-center gap-4 non-draggable">
          <span className="text-sm text-text-secondary">
            {wordCount} {wordCount === 1 ? 'mot' : 'mots'}
          </span>
          {!settings?.autoCleanup && transcript && !cleanedText && (
            <button
              onClick={handleManualCleanup}
              disabled={isProcessing}
              className="text-sm bg-accent-purple hover:bg-accent-purple/80 text-white 
                         px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Nettoyer avec l'IA
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!transcript && !cleanedText}
            className={`
              text-sm px-4 py-2 rounded-lg transition-colors
              ${copied
                ? 'bg-accent-green text-white'
                : 'bg-bg-tertiary text-text-primary hover:bg-bg-secondary'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {copied ? '✓ Copié!' : 'Copier'}
          </button>
        </div>
      </footer>
    </div>
  );
};
