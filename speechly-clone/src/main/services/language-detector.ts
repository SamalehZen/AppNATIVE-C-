import { LanguageDetectionResult } from '../../shared/types';
import { languageService } from './language-service';
import { getGeminiClient } from '../gemini';
import { getSettings } from '../database';

interface ScriptPattern {
  name: string;
  regex: RegExp;
  languages: string[];
}

const SCRIPT_PATTERNS: ScriptPattern[] = [
  { name: 'cyrillic', regex: /[\u0400-\u04FF]/, languages: ['ru-RU', 'uk-UA', 'bg-BG', 'sr-RS', 'mk-MK', 'be-BY', 'kk-KZ', 'ky-KG', 'mn-MN', 'tg-TJ'] },
  { name: 'arabic', regex: /[\u0600-\u06FF\u0750-\u077F]/, languages: ['ar-SA', 'ar-EG', 'ar-MA', 'ar-AE', 'fa-IR', 'ur-PK', 'ps-AF'] },
  { name: 'hebrew', regex: /[\u0590-\u05FF]/, languages: ['he-IL', 'yi'] },
  { name: 'chinese', regex: /[\u4E00-\u9FFF\u3400-\u4DBF]/, languages: ['zh-CN', 'zh-TW', 'zh-HK'] },
  { name: 'japanese_hiragana', regex: /[\u3040-\u309F]/, languages: ['ja-JP'] },
  { name: 'japanese_katakana', regex: /[\u30A0-\u30FF]/, languages: ['ja-JP'] },
  { name: 'korean', regex: /[\uAC00-\uD7AF\u1100-\u11FF]/, languages: ['ko-KR'] },
  { name: 'thai', regex: /[\u0E00-\u0E7F]/, languages: ['th-TH'] },
  { name: 'devanagari', regex: /[\u0900-\u097F]/, languages: ['hi-IN', 'mr-IN', 'ne-NP', 'sa-IN'] },
  { name: 'bengali', regex: /[\u0980-\u09FF]/, languages: ['bn-IN', 'bn-BD', 'as-IN'] },
  { name: 'gujarati', regex: /[\u0A80-\u0AFF]/, languages: ['gu-IN'] },
  { name: 'gurmukhi', regex: /[\u0A00-\u0A7F]/, languages: ['pa-IN'] },
  { name: 'tamil', regex: /[\u0B80-\u0BFF]/, languages: ['ta-IN'] },
  { name: 'telugu', regex: /[\u0C00-\u0C7F]/, languages: ['te-IN'] },
  { name: 'kannada', regex: /[\u0C80-\u0CFF]/, languages: ['kn-IN'] },
  { name: 'malayalam', regex: /[\u0D00-\u0D7F]/, languages: ['ml-IN'] },
  { name: 'sinhala', regex: /[\u0D80-\u0DFF]/, languages: ['si-LK'] },
  { name: 'myanmar', regex: /[\u1000-\u109F]/, languages: ['my-MM'] },
  { name: 'khmer', regex: /[\u1780-\u17FF]/, languages: ['km-KH'] },
  { name: 'lao', regex: /[\u0E80-\u0EFF]/, languages: ['lo-LA'] },
  { name: 'georgian', regex: /[\u10A0-\u10FF]/, languages: ['ka-GE'] },
  { name: 'armenian', regex: /[\u0530-\u058F]/, languages: ['hy-AM'] },
  { name: 'ethiopic', regex: /[\u1200-\u137F]/, languages: ['am-ET', 'ti-ET'] },
  { name: 'greek', regex: /[\u0370-\u03FF]/, languages: ['el-GR'] },
  { name: 'odia', regex: /[\u0B00-\u0B7F]/, languages: ['or-IN'] },
];

const LATIN_LANGUAGE_HINTS: { pattern: RegExp; language: string; weight: number }[] = [
  { pattern: /\b(le|la|les|de|des|du|au|aux|un|une|et|est|sont|que|qui|dans|pour|avec|sur|pas|par|mais|ou|donc)\b/gi, language: 'fr-FR', weight: 2 },
  { pattern: /\b(the|and|is|are|that|this|with|for|from|have|has|was|were|been|will|would|could|should)\b/gi, language: 'en-US', weight: 2 },
  { pattern: /\b(el|la|los|las|de|del|en|que|es|son|para|por|con|una|uno|está|están|como|más)\b/gi, language: 'es-ES', weight: 2 },
  { pattern: /\b(der|die|das|und|ist|sind|ein|eine|für|mit|auf|den|dem|sich|nicht|auch|nach)\b/gi, language: 'de-DE', weight: 2 },
  { pattern: /\b(il|la|le|di|che|è|sono|per|con|un|una|del|della|dei|degli|non|come|più)\b/gi, language: 'it-IT', weight: 2 },
  { pattern: /\b(o|a|os|as|de|do|da|dos|das|em|no|na|que|é|são|para|por|com|um|uma)\b/gi, language: 'pt-BR', weight: 2 },
  { pattern: /\b(de|het|en|van|een|is|zijn|voor|met|op|dat|die|aan|ook|te|naar|als|bij)\b/gi, language: 'nl-NL', weight: 2 },
  { pattern: /\b(i|og|er|det|en|at|på|for|med|til|av|som|har|de|var|kan|om|vi|fra)\b/gi, language: 'nb-NO', weight: 2 },
  { pattern: /\b(och|är|det|en|att|på|för|med|till|av|som|har|de|kan|om|vi|från|den)\b/gi, language: 'sv-SE', weight: 2 },
  { pattern: /\b(og|er|det|en|at|på|for|med|til|af|som|har|de|kan|om|vi|fra|den)\b/gi, language: 'da-DK', weight: 2 },
  { pattern: /\b(ja|on|ei|että|se|oli|kun|niin|voi|olla|jos|sitten|kuin|tai|mutta|jo|vain)\b/gi, language: 'fi-FI', weight: 2 },
  { pattern: /\b(i|w|z|na|do|że|to|jest|się|nie|co|jak|od|za|po|ale|czy|tak|może)\b/gi, language: 'pl-PL', weight: 2 },
  { pattern: /\b(ve|bir|bu|için|ile|de|da|den|olan|gibi|daha|sonra|var|ancak|ama|çok)\b/gi, language: 'tr-TR', weight: 2 },
  { pattern: /\b(și|în|de|la|cu|pe|că|este|sunt|pentru|din|care|mai|sau|dar|nu|fost)\b/gi, language: 'ro-RO', weight: 2 },
  { pattern: /\b(és|a|az|van|nem|hogy|egy|meg|ki|be|is|de|mint|még|csak|már|lesz)\b/gi, language: 'hu-HU', weight: 2 },
  { pattern: /\b(a|je|v|na|že|se|z|do|to|jako|být|mít|který|ale|nebo|jen|tak|když)\b/gi, language: 'cs-CZ', weight: 2 },
  { pattern: /\b(a|je|v|na|že|sa|z|do|to|ako|byť|mať|ktorý|ale|alebo|len|tak|keď)\b/gi, language: 'sk-SK', weight: 2 },
];

class LanguageDetector {
  quickDetect(text: string): string | null {
    if (!text || text.trim().length < 3) return null;

    for (const pattern of SCRIPT_PATTERNS) {
      if (pattern.regex.test(text)) {
        return pattern.languages[0];
      }
    }

    const scores: Record<string, number> = {};
    for (const hint of LATIN_LANGUAGE_HINTS) {
      const matches = text.match(hint.pattern);
      if (matches && matches.length > 0) {
        scores[hint.language] = (scores[hint.language] || 0) + (matches.length * hint.weight);
      }
    }

    const entries = Object.entries(scores);
    if (entries.length === 0) return null;

    entries.sort((a, b) => b[1] - a[1]);
    const [topLang, topScore] = entries[0];
    const secondScore = entries[1]?.[1] || 0;

    if (topScore >= 3 && topScore > secondScore * 1.5) {
      return topLang;
    }

    return null;
  }

  getScriptInfo(text: string): { script: string; languages: string[] } | null {
    for (const pattern of SCRIPT_PATTERNS) {
      if (pattern.regex.test(text)) {
        return { script: pattern.name, languages: pattern.languages };
      }
    }
    return null;
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const quickResult = this.quickDetect(text);
    
    if (quickResult && text.length < 50) {
      return {
        detectedLanguage: quickResult,
        confidence: 0.7,
        alternatives: []
      };
    }

    try {
      const settings = getSettings();
      if (!settings?.geminiApiKey) {
        if (quickResult) {
          return {
            detectedLanguage: quickResult,
            confidence: 0.6,
            alternatives: []
          };
        }
        return {
          detectedLanguage: 'en-US',
          confidence: 0.3,
          alternatives: []
        };
      }

      const gemini = getGeminiClient();
      if (!gemini) {
        if (quickResult) {
          return {
            detectedLanguage: quickResult,
            confidence: 0.6,
            alternatives: []
          };
        }
        return {
          detectedLanguage: 'en-US',
          confidence: 0.3,
          alternatives: []
        };
      }

      const prompt = `Detect the language of the following text. Return ONLY a JSON object with this exact format, no markdown, no code blocks:
{"code":"<ISO language-region code like fr-FR or en-US>","confidence":<0-1 number>,"alternatives":[{"code":"<code>","confidence":<0-1>}]}

Text to analyze: "${text.substring(0, 500)}"`;

      const result = await gemini.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const validatedCode = languageService.validateLanguageCode(parsed.code) 
        ? parsed.code 
        : (quickResult || 'en-US');

      return {
        detectedLanguage: validatedCode,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.8)),
        alternatives: (parsed.alternatives || [])
          .filter((alt: { code: string }) => languageService.validateLanguageCode(alt.code))
          .slice(0, 3)
      };

    } catch (error) {
      console.error('Language detection error:', error);
      
      if (quickResult) {
        return {
          detectedLanguage: quickResult,
          confidence: 0.5,
          alternatives: []
        };
      }

      return {
        detectedLanguage: 'en-US',
        confidence: 0.3,
        alternatives: []
      };
    }
  }

  calculateTextLanguageAffinity(text: string, languageCode: string): number {
    const lang = languageService.getLanguageByCode(languageCode);
    if (!lang) return 0;

    let score = 0;

    if (lang.rtl) {
      const rtlScripts = SCRIPT_PATTERNS.filter(p => 
        ['arabic', 'hebrew'].includes(p.name) && p.languages.includes(languageCode)
      );
      for (const script of rtlScripts) {
        if (script.regex.test(text)) {
          score += 50;
          break;
        }
      }
    }

    const scriptInfo = this.getScriptInfo(text);
    if (scriptInfo && scriptInfo.languages.includes(languageCode)) {
      score += 30;
    }

    for (const hint of LATIN_LANGUAGE_HINTS) {
      if (hint.language === languageCode) {
        const matches = text.match(hint.pattern);
        if (matches) {
          score += matches.length * 5;
        }
      }
    }

    return Math.min(100, score);
  }
}

export const languageDetector = new LanguageDetector();
