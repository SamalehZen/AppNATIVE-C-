import { GoogleGenerativeAI } from '@google/generative-ai';
import { CleanupOptions, CleanupResult, DictationMode, UserProfile } from '../shared/types';
import { getSettings, getUserProfile, getStyleProfile } from './database';
import { DetectedContext, ContextType } from './services/context-detector';
import { getPromptForContext } from './services/context-prompts';
import { getModePrompt } from './services/mode-prompts';
import contextDictionaries from '../data/context-dictionaries.json';
import { getStyleLearner } from './services/style-learner';

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI | null {
  return getGenAI();
}

function getGenAI(): GoogleGenerativeAI | null {
  const settings = getSettings();
  if (!settings?.geminiApiKey) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(settings.geminiApiKey);
  }
  return genAI;
}

export function resetGenAI(): void {
  genAI = null;
}

interface DictionaryConfig {
  replacements?: Record<string, string>;
  preserveTerms?: string[];
  [key: string]: any;
}

function applyDictionaryPreprocessing(
  text: string,
  contextType: ContextType
): string {
  const dictionary = (contextDictionaries as Record<string, DictionaryConfig>)[
    contextType
  ];
  if (!dictionary?.replacements) return text;

  let processed = text;
  const replacements = dictionary.replacements;

  const sortedKeys = Object.keys(replacements).sort(
    (a, b) => b.length - a.length
  );

  for (const key of sortedKeys) {
    const regex = new RegExp(`\\b${escapeRegex(key)}\\b`, 'gi');
    processed = processed.replace(regex, replacements[key]);
  }

  return processed;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildLegacyPrompt(text: string, options: CleanupOptions): string {
  const CONTEXT_DESCRIPTIONS: Record<string, string> = {
    email: 'un email professionnel',
    chat: 'un message de chat/SMS informel',
    document: 'un document formel',
    code: 'une description technique ou du code',
    general: 'un texte général',
  };

  const contextDesc = CONTEXT_DESCRIPTIONS[options.context || 'general'];
  const languageHint = options.language
    ? `La langue du texte est: ${options.language}`
    : '';

  return `Tu es un assistant de transcription vocale expert. Nettoie le texte suivant qui a été dicté oralement.

RÈGLES STRICTES:
1. Corrige la ponctuation et la capitalisation appropriées
2. Supprime les mots de remplissage (euh, hum, donc, en fait, genre, voilà, tu vois, like, um, uh, you know...)
3. Corrige les erreurs grammaticales évidentes
4. Préserve le ton et le style naturel de l'utilisateur
5. Ne change PAS le sens du message
6. Garde le texte dans la même langue que l'original
7. Ne traduis jamais le texte
8. N'ajoute pas de contenu qui n'était pas dans l'original

CONTEXTE: Ce texte est destiné à ${contextDesc}
${languageHint}

TEXTE ORIGINAL:
${text}

Réponds UNIQUEMENT avec le texte nettoyé, sans guillemets, sans explication, sans préambule.`;
}

function getStylePrompt(): string {
  const settings = getSettings();
  if (!settings?.styleLearning?.enabled) {
    return '';
  }
  
  const styleProfile = getStyleProfile();
  if (!styleProfile) {
    return '';
  }
  
  const minSamples = settings.styleLearning.minSamplesBeforeUse || 20;
  const learner = getStyleLearner(styleProfile);
  
  if (!learner.isReadyForUse(minSamples)) {
    return '';
  }
  
  return learner.generateStylePrompt();
}

function buildContextAwarePrompt(
  text: string,
  context: DetectedContext,
  language?: string
): string {
  let prompt = getPromptForContext(context);

  if (language) {
    prompt = prompt.replace(
      'LANGUE:',
      `LANGUE DÉTECTÉE: ${language}\nLANGUE:`
    );
  }

  const stylePrompt = getStylePrompt();
  if (stylePrompt) {
    prompt = prompt.replace('{transcript}', `${stylePrompt}\n\nText to process:\n${text}`);
  } else {
    prompt = prompt.replace('{transcript}', text);
  }

  return prompt;
}

export interface ContextCleanupResult extends CleanupResult {
  context?: DetectedContext;
  processingTime?: number;
}

export async function cleanupTranscript(
  text: string,
  options: CleanupOptions
): Promise<CleanupResult> {
  const ai = getGenAI();

  if (!ai) {
    return {
      original: text,
      cleaned: text,
      changes: ['API key not configured - returning original text'],
    };
  }

  try {
    const settings = getSettings();
    const modelName = settings?.geminiModel || 'gemini-2.0-flash';
    const model = ai.getGenerativeModel({ model: modelName });
    const prompt = buildLegacyPrompt(text, options);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleaned = response.text().trim();

    const changes: string[] = [];
    if (cleaned !== text) {
      if (cleaned.length !== text.length) {
        changes.push(`Length changed: ${text.length} → ${cleaned.length} chars`);
      }
      const originalWords = text.split(/\s+/).length;
      const cleanedWords = cleaned.split(/\s+/).length;
      if (originalWords !== cleanedWords) {
        changes.push(`Word count: ${originalWords} → ${cleanedWords}`);
      }
      changes.push('Punctuation and grammar corrected');
    }

    return {
      original: text,
      cleaned,
      changes,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      original: text,
      cleaned: text,
      changes: [
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

export async function cleanupWithContext(
  text: string,
  context: DetectedContext,
  language?: string
): Promise<ContextCleanupResult> {
  const startTime = Date.now();
  const ai = getGenAI();

  if (!ai) {
    return {
      original: text,
      cleaned: text,
      changes: ['API key not configured - returning original text'],
      context,
      processingTime: Date.now() - startTime,
    };
  }

  try {
    const preprocessedText = applyDictionaryPreprocessing(text, context.type);

    const settings = getSettings();
    const modelName = settings?.geminiModel || 'gemini-2.0-flash';
    const model = ai.getGenerativeModel({ model: modelName });
    const prompt = buildContextAwarePrompt(preprocessedText, context, language);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let cleaned = response.text().trim();

    cleaned = cleaned.replace(/^["']|["']$/g, '');

    const changes: string[] = [];
    if (cleaned !== text) {
      changes.push(`Context: ${context.name} (${context.confidence})`);
      if (context.subContext) {
        changes.push(`Sub-context: ${context.subContext}`);
      }
      if (cleaned.length !== text.length) {
        changes.push(
          `Length: ${text.length} → ${cleaned.length} chars`
        );
      }
      const originalWords = text.split(/\s+/).length;
      const cleanedWords = cleaned.split(/\s+/).length;
      if (originalWords !== cleanedWords) {
        changes.push(`Words: ${originalWords} → ${cleanedWords}`);
      }
      changes.push('Content cleaned and formatted');
    }

    return {
      original: text,
      cleaned,
      changes,
      context,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      original: text,
      cleaned: basicCleanup(text),
      changes: [
        `Error (fallback used): ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      context,
      processingTime: Date.now() - startTime,
    };
  }
}

function basicCleanup(text: string): string {
  return text
    .replace(/\b(euh|hum|donc euh|ben|bah|genre|voilà|en fait)\b/gi, '')
    .replace(/\b(um|uh|like|you know|so like|basically)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

export async function cleanupTranscriptAuto(
  text: string,
  windowInfo: { title: string; processName: string; bundleId: string } | null,
  language?: string
): Promise<ContextCleanupResult> {
  const { detectContextFromWindow, getContextDetector } = await import(
    './services/context-detector'
  );

  let context: DetectedContext;

  if (windowInfo) {
    context = detectContextFromWindow({
      title: windowInfo.title,
      processName: windowInfo.processName,
      bundleId: windowInfo.bundleId,
      executablePath: '',
      pid: 0,
      isValid: true,
    });
  } else {
    context = getContextDetector().getDefaultContext();
  }

  return cleanupWithContext(text, context, language);
}

export async function cleanupWithMode(
  text: string,
  mode: DictationMode,
  language?: string
): Promise<ContextCleanupResult> {
  const startTime = Date.now();
  const ai = getGenAI();

  if (!ai) {
    return {
      original: text,
      cleaned: text,
      changes: ['API key not configured - returning original text'],
      processingTime: Date.now() - startTime,
    };
  }

  if (mode === 'auto') {
    return cleanupTranscriptAuto(text, null, language);
  }

  try {
    const userProfile = getUserProfile();
    const settings = getSettings();
    const modelName = settings?.geminiModel || 'gemini-2.0-flash';
    const model = ai.getGenerativeModel({ model: modelName });

    let prompt = getModePrompt(mode, userProfile);
    
    if (language) {
      prompt = prompt.replace(
        'LANGUE:',
        `LANGUE DÉTECTÉE: ${language}\nLANGUE:`
      );
    }

    const stylePrompt = getStylePrompt();
    if (stylePrompt) {
      prompt = prompt.replace('{transcript}', `${stylePrompt}\n\nText to process:\n${text}`);
    } else {
      prompt = prompt.replace('{transcript}', text);
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let cleaned = response.text().trim();

    cleaned = cleaned.replace(/^["']|["']$/g, '');

    const changes: string[] = [];
    changes.push(`Mode: ${mode}`);
    if (cleaned !== text) {
      if (cleaned.length !== text.length) {
        changes.push(`Length: ${text.length} → ${cleaned.length} chars`);
      }
      const originalWords = text.split(/\s+/).length;
      const cleanedWords = cleaned.split(/\s+/).length;
      if (originalWords !== cleanedWords) {
        changes.push(`Words: ${originalWords} → ${cleanedWords}`);
      }
      changes.push('Content formatted for mode');
    }

    return {
      original: text,
      cleaned,
      changes,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Gemini API error (mode cleanup):', error);
    return {
      original: text,
      cleaned: basicCleanup(text),
      changes: [
        `Error (fallback used): ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      processingTime: Date.now() - startTime,
    };
  }
}
