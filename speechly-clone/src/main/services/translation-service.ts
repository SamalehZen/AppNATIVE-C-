import { GoogleGenerativeAI } from '@google/generative-ai';
import { TranslationResult, TranslationOptions, FormalityLevel } from '../../shared/types';
import { getSettings } from '../database';
import { TRANSLATION_LANGUAGES } from '../../shared/constants';

let genAI: GoogleGenerativeAI | null = null;
const translationCache = new Map<string, { result: TranslationResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const TRANSLATION_TIMEOUT = 10000;

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

export function resetTranslationGenAI(): void {
  genAI = null;
}

function getCacheKey(text: string, source: string, target: string, options?: TranslationOptions): string {
  return `${text}|${source}|${target}|${options?.formalityLevel || 'neutral'}|${options?.context || 'general'}`;
}

function getCachedTranslation(key: string): TranslationResult | null {
  const cached = translationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  if (cached) {
    translationCache.delete(key);
  }
  return null;
}

function cacheTranslation(key: string, result: TranslationResult): void {
  if (translationCache.size > 100) {
    const oldestKey = translationCache.keys().next().value;
    if (oldestKey) translationCache.delete(oldestKey);
  }
  translationCache.set(key, { result, timestamp: Date.now() });
}

function getLanguageName(code: string): string {
  const lang = TRANSLATION_LANGUAGES.find(l => l.code === code);
  return lang?.name || code;
}

function buildTranslationPrompt(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options?: TranslationOptions
): string {
  const sourceName = getLanguageName(sourceLanguage);
  const targetName = getLanguageName(targetLanguage);
  
  let formalityInstruction = '';
  switch (options?.formalityLevel) {
    case 'formal':
      formalityInstruction = `
- Use formal register (vous in French, Sie in German, usted in Spanish, etc.)
- Maintain professional and respectful tone
- Use complete sentences and proper grammar`;
      break;
    case 'informal':
      formalityInstruction = `
- Use informal register (tu in French, du in German, tú in Spanish, etc.)
- Keep a casual, friendly tone
- Natural conversational style is acceptable`;
      break;
    default:
      formalityInstruction = `
- Use neutral register appropriate for general communication
- Balance between formal and informal as appropriate`;
  }

  let contextInstruction = '';
  if (options?.context) {
    const contextMap: Record<string, string> = {
      email: 'This is for email communication. Maintain appropriate email conventions.',
      chat: 'This is for instant messaging. Keep it concise and conversational.',
      document: 'This is for a formal document. Use proper structure and formal language.',
      general: 'This is general content. Translate naturally.',
    };
    contextInstruction = contextMap[options.context] || '';
  }

  const formattingInstruction = options?.preserveFormatting !== false
    ? '- Preserve all formatting: paragraphs, line breaks, lists, and punctuation structure'
    : '- You may adjust formatting for natural flow in the target language';

  return `You are an expert translator. Translate the following text from ${sourceName} to ${targetName}.

STRICT RULES:
1. Provide ONLY the translation, no explanations or notes
2. Preserve the original meaning, tone, and intent exactly
3. Keep proper nouns, brand names, and technical terms unchanged unless they have established translations
4. Do not add or remove content
${formalityInstruction}
${formattingInstruction}
${contextInstruction ? `\nCONTEXT: ${contextInstruction}` : ''}

TEXT TO TRANSLATE:
${text}

TRANSLATION:`;
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options?: TranslationOptions
): Promise<TranslationResult> {
  const startTime = Date.now();
  
  if (!text.trim()) {
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      confidence: 1,
      processingTime: 0,
    };
  }

  if (sourceLanguage === targetLanguage) {
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      confidence: 1,
      processingTime: 0,
    };
  }

  const cacheKey = getCacheKey(text, sourceLanguage, targetLanguage, options);
  const cached = getCachedTranslation(cacheKey);
  if (cached) {
    return { ...cached, processingTime: Date.now() - startTime };
  }

  const ai = getGenAI();
  if (!ai) {
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }

  try {
    const settings = getSettings();
    const modelName = settings?.geminiModel || 'gemini-2.0-flash';
    const model = ai.getGenerativeModel({ model: modelName });
    const prompt = buildTranslationPrompt(text, sourceLanguage, targetLanguage, options);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT);

    try {
      const result = await model.generateContent(prompt);
      clearTimeout(timeoutId);
      
      const response = await result.response;
      let translatedText = response.text().trim();
      
      translatedText = translatedText.replace(/^["']|["']$/g, '');
      translatedText = translatedText.replace(/^(Translation:|TRANSLATION:)\s*/i, '');

      const translationResult: TranslationResult = {
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        confidence: 0.95,
        processingTime: Date.now() - startTime,
      };

      cacheTranslation(cacheKey, translationResult);
      return translationResult;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error('Translation error:', error);
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

export async function detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
  if (!text.trim()) {
    return { language: 'unknown', confidence: 0 };
  }

  const ai = getGenAI();
  if (!ai) {
    return { language: 'unknown', confidence: 0 };
  }

  try {
    const settings = getSettings();
    const modelName = settings?.geminiModel || 'gemini-2.0-flash';
    const model = ai.getGenerativeModel({ model: modelName });

    const prompt = `Detect the language of the following text. Respond with ONLY the language code (e.g., fr-FR, en-US, es-ES, de-DE, ja-JP, etc.) and nothing else.

Text: "${text.substring(0, 500)}"

Language code:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const detectedCode = response.text().trim().toLowerCase();
    
    const matchedLang = TRANSLATION_LANGUAGES.find(
      l => l.code.toLowerCase() === detectedCode || l.code.toLowerCase().startsWith(detectedCode.split('-')[0])
    );

    return {
      language: matchedLang?.code || detectedCode,
      confidence: matchedLang ? 0.9 : 0.7,
    };
  } catch (error) {
    console.error('Language detection error:', error);
    return { language: 'unknown', confidence: 0 };
  }
}

export async function cleanupAndTranslate(
  transcript: string,
  cleanupFn: (text: string) => Promise<string>,
  translationEnabled: boolean,
  sourceLanguage: string,
  targetLanguage: string,
  translationOptions?: TranslationOptions
): Promise<{
  cleaned: string;
  translated?: string;
  processingTime: number;
}> {
  const startTime = Date.now();

  const [cleaned, translation] = await Promise.all([
    cleanupFn(transcript),
    translationEnabled && sourceLanguage !== targetLanguage
      ? translateText(transcript, sourceLanguage, targetLanguage, translationOptions)
      : Promise.resolve(null),
  ]);

  if (translationEnabled && translation && cleaned !== transcript) {
    const translatedCleaned = await translateText(
      cleaned,
      sourceLanguage,
      targetLanguage,
      translationOptions
    );
    return {
      cleaned,
      translated: translatedCleaned.translatedText,
      processingTime: Date.now() - startTime,
    };
  }

  return {
    cleaned,
    translated: translation?.translatedText,
    processingTime: Date.now() - startTime,
  };
}

export function clearTranslationCache(): void {
  translationCache.clear();
}
