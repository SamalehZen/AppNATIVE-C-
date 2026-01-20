import {
  StyleProfile,
  StyleMetrics,
  StylePunctuationMetrics,
  TextMetrics,
  WordFrequency,
  StyleSampleText,
} from '../../shared/types';
import {
  DEFAULT_STYLE_PROFILE,
  FRENCH_STOP_WORDS,
  GREETING_PATTERNS,
  CLOSING_PATTERNS,
  TRANSITION_PATTERNS,
} from '../../shared/constants';

const MAX_SAMPLE_TEXTS = 100;
const MAX_FREQUENT_WORDS = 100;
const MAX_TECHNICAL_TERMS = 50;

export class StyleLearner {
  private profile: StyleProfile;

  constructor(profile?: StyleProfile | null) {
    this.profile = profile ? { ...profile } : { ...DEFAULT_STYLE_PROFILE };
  }

  getProfile(): StyleProfile {
    return this.profile;
  }

  analyzeText(text: string): TextMetrics {
    const sentences = this.splitSentences(text);
    const words = this.getWords(text);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));

    return {
      sentenceCount: sentences.length,
      wordCount: words.length,
      averageSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
      uniqueWords,
      punctuationUsage: this.analyzePunctuation(text),
      formalityIndicators: this.detectFormality(text),
    };
  }

  private splitSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private getWords(text: string): string[] {
    return text
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-ZÀ-ÿ'-]/g, ''))
      .filter(w => w.length > 0);
  }

  private analyzePunctuation(text: string): StylePunctuationMetrics {
    const length = text.length || 1;
    return {
      semicolonUsage: (text.match(/;/g) || []).length / length * 100,
      exclamationUsage: (text.match(/!/g) || []).length / length * 100,
      ellipsisUsage: (text.match(/\.{3}|…/g) || []).length / length * 100,
    };
  }

  private detectFormality(text: string): { formal: number; informal: number } {
    const lowerText = text.toLowerCase();
    let formal = 0;
    let informal = 0;

    if (/\b(vous|votre|vos)\b/i.test(text)) formal += 3;
    if (/\b(cordialement|sincèrement|respectueusement)\b/i.test(text)) formal += 2;
    if (/\b(madame|monsieur|cher|chère)\b/i.test(text)) formal += 2;
    if (/\b(veuillez|je vous prie)\b/i.test(text)) formal += 2;

    if (/\b(tu|ton|ta|tes)\b/i.test(text)) informal += 3;
    if (/\b(salut|coucou|hey|yo)\b/i.test(text)) informal += 2;
    if (/\b(mdr|lol|ptdr|haha|hihi|xd)\b/i.test(text)) informal += 3;
    if (/!{2,}|\?{2,}/g.test(text)) informal += 1;
    if (/\b(super|cool|génial|trop)\b/i.test(text)) informal += 1;

    return { formal, informal };
  }

  calculateFormalityScore(text: string): number {
    const { formal, informal } = this.detectFormality(text);
    const total = formal + informal;
    if (total === 0) return 0.5;
    return Math.max(0, Math.min(1, 0.5 + (formal - informal) / (total * 2)));
  }

  async learnFromSample(text: string, context: string): Promise<void> {
    if (!text || text.trim().length < 20) return;

    const metrics = this.analyzeText(text);
    this.updateMetrics(metrics);
    this.extractPatterns(text);
    this.updateVocabulary(text);
    this.addSampleText(text, context);
    this.updateConfidenceScore();

    this.profile.updatedAt = Date.now();
  }

  async learnFromCorrection(original: string, corrected: string): Promise<void> {
    const originalWords = new Set(this.getWords(original).map(w => w.toLowerCase()));
    const correctedWords = this.getWords(corrected).map(w => w.toLowerCase());

    const addedWords = correctedWords.filter(w => !originalWords.has(w) && w.length > 3);
    for (const word of addedWords) {
      if (!FRENCH_STOP_WORDS.has(word)) {
        this.incrementWordFrequency(word);
      }
    }

    const removedWords = [...originalWords].filter(
      w => !correctedWords.includes(w) && w.length > 3
    );
    for (const word of removedWords) {
      if (!this.profile.vocabulary.avoidedWords.includes(word)) {
        this.profile.vocabulary.avoidedWords.push(word);
        if (this.profile.vocabulary.avoidedWords.length > 50) {
          this.profile.vocabulary.avoidedWords.shift();
        }
      }
    }

    this.profile.updatedAt = Date.now();
  }

  private updateMetrics(newMetrics: TextMetrics): void {
    const stats = this.profile.trainingStats;
    const weight = Math.min(stats.totalSamples, 50);
    const newWeight = 1;
    const totalWeight = weight + newWeight;

    const currentMetrics = this.profile.metrics;

    this.profile.metrics = {
      averageSentenceLength:
        (currentMetrics.averageSentenceLength * weight + newMetrics.averageSentenceLength * newWeight) /
        totalWeight,
      vocabularyRichness:
        (currentMetrics.vocabularyRichness * weight +
          (newMetrics.uniqueWords.size / Math.max(newMetrics.wordCount, 1)) * newWeight) /
        totalWeight,
      formalityScore:
        (currentMetrics.formalityScore * weight + this.calculateFormalityFromIndicators(newMetrics) * newWeight) /
        totalWeight,
      punctuationStyle: {
        semicolonUsage:
          (currentMetrics.punctuationStyle.semicolonUsage * weight +
            newMetrics.punctuationUsage.semicolonUsage * newWeight) /
          totalWeight,
        exclamationUsage:
          (currentMetrics.punctuationStyle.exclamationUsage * weight +
            newMetrics.punctuationUsage.exclamationUsage * newWeight) /
          totalWeight,
        ellipsisUsage:
          (currentMetrics.punctuationStyle.ellipsisUsage * weight +
            newMetrics.punctuationUsage.ellipsisUsage * newWeight) /
          totalWeight,
      },
    };
  }

  private calculateFormalityFromIndicators(metrics: TextMetrics): number {
    const { formal, informal } = metrics.formalityIndicators;
    const total = formal + informal;
    if (total === 0) return 0.5;
    return Math.max(0, Math.min(1, 0.5 + (formal - informal) / (total * 2)));
  }

  private extractPatterns(text: string): void {
    const lowerText = text.toLowerCase();

    for (const greeting of GREETING_PATTERNS) {
      const regex = new RegExp(`^\\s*${greeting}\\b`, 'i');
      if (regex.test(text)) {
        const match = text.match(new RegExp(`^\\s*(${greeting}[^,.!?\\n]*)`, 'i'));
        if (match) {
          this.addToPatterns('greetings', match[1].trim());
        }
        break;
      }
    }

    for (const closing of CLOSING_PATTERNS) {
      const regex = new RegExp(`\\b${closing}\\b.*$`, 'i');
      if (regex.test(text)) {
        const match = text.match(new RegExp(`(${closing}.*)$`, 'i'));
        if (match) {
          this.addToPatterns('closings', match[1].trim());
        }
        break;
      }
    }

    for (const transition of TRANSITION_PATTERNS) {
      const regex = new RegExp(`\\b${transition}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        for (const match of matches) {
          this.addToPatterns('transitions', match.toLowerCase());
        }
      }
    }
  }

  private addToPatterns(
    type: 'greetings' | 'closings' | 'transitions' | 'fillers',
    pattern: string
  ): void {
    const patterns = this.profile.patterns[type];
    const existing = patterns.find(p => p.toLowerCase() === pattern.toLowerCase());
    if (!existing) {
      patterns.push(pattern);
      if (patterns.length > 20) {
        patterns.shift();
      }
    }
  }

  private updateVocabulary(text: string): void {
    const words = this.getWords(text);

    for (const word of words) {
      const lowerWord = word.toLowerCase();
      if (lowerWord.length > 3 && !FRENCH_STOP_WORDS.has(lowerWord)) {
        this.incrementWordFrequency(lowerWord);
      }
    }

    const technicalPatterns = [
      /\b[A-Z]{2,}\b/g,
      /\b\w+\.(js|ts|py|java|cpp|go|rs)\b/gi,
      /\b(API|SDK|CLI|UI|UX|DB|SQL|CSS|HTML|JSON|XML)\b/gi,
      /\b(backend|frontend|deploy|merge|commit|push|pull|sprint|agile|scrum)\b/gi,
    ];

    for (const pattern of technicalPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const term = match.toLowerCase();
          if (!this.profile.vocabulary.technicalTerms.includes(term)) {
            this.profile.vocabulary.technicalTerms.push(term);
            if (this.profile.vocabulary.technicalTerms.length > MAX_TECHNICAL_TERMS) {
              this.profile.vocabulary.technicalTerms.shift();
            }
          }
        }
      }
    }
  }

  private incrementWordFrequency(word: string): void {
    const existing = this.profile.vocabulary.frequentWords.find(
      w => w.word === word
    );
    if (existing) {
      existing.count++;
    } else {
      this.profile.vocabulary.frequentWords.push({ word, count: 1 });
    }

    this.profile.vocabulary.frequentWords.sort((a, b) => b.count - a.count);
    if (this.profile.vocabulary.frequentWords.length > MAX_FREQUENT_WORDS) {
      this.profile.vocabulary.frequentWords = this.profile.vocabulary.frequentWords.slice(
        0,
        MAX_FREQUENT_WORDS
      );
    }
  }

  private addSampleText(text: string, context: string): void {
    const sample: StyleSampleText = {
      context,
      text: text.slice(0, 500),
      timestamp: Date.now(),
    };

    this.profile.sampleTexts.unshift(sample);
    if (this.profile.sampleTexts.length > MAX_SAMPLE_TEXTS) {
      this.profile.sampleTexts = this.profile.sampleTexts.slice(0, MAX_SAMPLE_TEXTS);
    }

    this.profile.trainingStats.totalSamples++;
    this.profile.trainingStats.lastTrainingDate = Date.now();
  }

  private updateConfidenceScore(): void {
    const samples = this.profile.trainingStats.totalSamples;
    const vocabularySize = this.profile.vocabulary.frequentWords.length;
    const patternsFound =
      this.profile.patterns.greetings.length +
      this.profile.patterns.closings.length +
      this.profile.patterns.transitions.length;

    let score = 0;
    score += Math.min(samples / 50, 0.4);
    score += Math.min(vocabularySize / 100, 0.3);
    score += Math.min(patternsFound / 30, 0.3);

    this.profile.trainingStats.confidenceScore = Math.min(score, 1);
  }

  generateStylePrompt(): string {
    if (this.profile.trainingStats.totalSamples < 10) {
      return '';
    }

    const metrics = this.profile.metrics;
    const patterns = this.profile.patterns;
    const vocabulary = this.profile.vocabulary;

    let prompt = `
Adapte ton style d'écriture pour correspondre au style personnel suivant:

STYLE DES PHRASES:
- Longueur moyenne: ${Math.round(metrics.averageSentenceLength)} mots par phrase
- Niveau de formalité: ${metrics.formalityScore > 0.7 ? 'formel (vouvoiement)' : metrics.formalityScore < 0.3 ? 'informel (tutoiement)' : 'neutre'}
`;

    if (patterns.greetings.length > 0) {
      prompt += `\nFORMULES DE SALUTATION PRÉFÉRÉES: ${patterns.greetings.slice(0, 5).join(', ')}`;
    }

    if (patterns.closings.length > 0) {
      prompt += `\nFORMULES DE CONCLUSION PRÉFÉRÉES: ${patterns.closings.slice(0, 5).join(', ')}`;
    }

    if (patterns.transitions.length > 0) {
      prompt += `\nMOTS DE TRANSITION FAVORIS: ${patterns.transitions.slice(0, 10).join(', ')}`;
    }

    if (vocabulary.frequentWords.length > 0) {
      prompt += `\nVOCABULAIRE FRÉQUENT: ${vocabulary.frequentWords
        .slice(0, 15)
        .map(w => w.word)
        .join(', ')}`;
    }

    if (vocabulary.technicalTerms.length > 0) {
      prompt += `\nTERMES TECHNIQUES À PRÉSERVER: ${vocabulary.technicalTerms.slice(0, 10).join(', ')}`;
    }

    if (vocabulary.avoidedWords.length > 0) {
      prompt += `\nMOTS À ÉVITER: ${vocabulary.avoidedWords.slice(0, 10).join(', ')}`;
    }

    if (this.profile.sampleTexts.length > 0) {
      prompt += `\n\nEXEMPLES DE RÉFÉRENCE DU STYLE:`;
      const samples = this.profile.sampleTexts.slice(0, 3);
      for (const sample of samples) {
        prompt += `\n"${sample.text.slice(0, 200)}${sample.text.length > 200 ? '...' : ''}"`;
      }
    }

    prompt += `\n\nIMPORTANT: Adapte le texte à ce style personnel tout en préservant le sens original.`;

    return prompt;
  }

  addTechnicalTerm(term: string): void {
    const lowerTerm = term.toLowerCase();
    if (!this.profile.vocabulary.technicalTerms.includes(lowerTerm)) {
      this.profile.vocabulary.technicalTerms.push(lowerTerm);
      this.profile.updatedAt = Date.now();
    }
  }

  removeTechnicalTerm(term: string): void {
    const lowerTerm = term.toLowerCase();
    this.profile.vocabulary.technicalTerms = this.profile.vocabulary.technicalTerms.filter(
      t => t !== lowerTerm
    );
    this.profile.updatedAt = Date.now();
  }

  reset(): void {
    this.profile = { ...DEFAULT_STYLE_PROFILE, id: this.profile.id, createdAt: this.profile.createdAt };
    this.profile.updatedAt = Date.now();
  }

  exportProfile(): string {
    return JSON.stringify(this.profile, null, 2);
  }

  importProfile(data: string): void {
    try {
      const imported = JSON.parse(data) as StyleProfile;
      if (imported.id && imported.metrics && imported.patterns && imported.vocabulary) {
        this.profile = imported;
        this.profile.updatedAt = Date.now();
      }
    } catch (e) {
      console.error('Failed to import style profile:', e);
      throw new Error('Format de profil invalide');
    }
  }
}

let styleLearnerInstance: StyleLearner | null = null;

export function getStyleLearner(profile?: StyleProfile | null): StyleLearner {
  if (!styleLearnerInstance || profile !== undefined) {
    styleLearnerInstance = new StyleLearner(profile);
  }
  return styleLearnerInstance;
}

export function resetStyleLearner(): void {
  styleLearnerInstance = null;
}
