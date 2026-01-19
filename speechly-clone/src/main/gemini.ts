import { GoogleGenerativeAI } from '@google/generative-ai';
import { CleanupOptions, CleanupResult } from '../shared/types';
import { getSettings } from './database';

let genAI: GoogleGenerativeAI | null = null;

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

const CONTEXT_DESCRIPTIONS: Record<string, string> = {
  email: 'un email professionnel',
  chat: 'un message de chat/SMS informel',
  document: 'un document formel',
  code: 'une description technique ou du code',
  general: 'un texte général',
};

function buildPrompt(text: string, options: CleanupOptions): string {
  const contextDesc = CONTEXT_DESCRIPTIONS[options.context || 'general'];
  const languageHint = options.language ? `La langue du texte est: ${options.language}` : '';
  
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
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = buildPrompt(text, options);
    
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
      changes: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}
