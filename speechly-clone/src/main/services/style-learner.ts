import {
  StyleProfile,
  StyleProfileMetrics,
  StyleProfilePatterns,
  StyleProfileVocabulary,
  TextMetrics,
  DEFAULT_STYLE_PROFILE,
  StyleSampleText,
} from '../../shared/types';

const FRENCH_STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'à', 'au', 'aux',
  'ce', 'cette', 'ces', 'que', 'qui', 'quoi', 'dont', 'où', 'pour', 'par', 'sur',
  'avec', 'sans', 'dans', 'est', 'sont', 'être', 'avoir', 'fait', 'faire', 'il',
  'elle', 'ils', 'elles', 'on', 'nous', 'vous', 'je', 'tu', 'me', 'te', 'se',
  'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'notre', 'votre',
  'leur', 'nos', 'vos', 'leurs', 'ne', 'pas', 'plus', 'moins', 'très', 'bien',
  'tout', 'tous', 'toute', 'toutes', 'mais', 'ou', 'donc', 'car', 'ni', 'si',
  'comme', 'même', 'aussi', 'peut', 'peu', 'très', 'trop', 'assez', 'beaucoup',
]);

const ENGLISH_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'me',
  'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their', 'what', 'which',
  'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
]);

const GREETING_PATTERNS_FR = [
  /^(salut|bonjour|hello|hey|coucou|hi|bonsoir|bjr|slt)\b/i,
  /^(cher|chère|chers|chères)\b/i,
  /^(madame|monsieur|mesdames|messieurs)\b/i,
];

const GREETING_PATTERNS_EN = [
  /^(hi|hello|hey|dear|good\s*morning|good\s*afternoon|good\s*evening)\b/i,
];

const CLOSING_PATTERNS_FR = [
  /(cordialement|à bientôt|à\+|a\+|bien à vous|amicalement|sincèrement)/i,
  /(bonne (journée|soirée|continuation)|merci d'avance)/i,
  /(à (très\s+)?bientôt|au revoir|bisous|bises)/i,
];

const CLOSING_PATTERNS_EN = [
  /(best|regards|sincerely|cheers|thanks|thank you|best wishes)/i,
  /(kind regards|warm regards|yours truly|take care)/i,
];

const TRANSITION_PATTERNS_FR = [
  /\b(du coup|donc|par ailleurs|en effet|d'ailleurs|sinon|par contre)\b/gi,
  /\b(effectivement|clairement|notamment|en fait|de plus|ainsi|cependant)\b/gi,
  /\b(toutefois|néanmoins|en revanche|en outre|de même|également)\b/gi,
];

const TRANSITION_PATTERNS_EN = [
  /\b(therefore|however|moreover|furthermore|additionally|consequently)\b/gi,
  /\b(meanwhile|nevertheless|although|besides|hence|thus|accordingly)\b/gi,
  /\b(in fact|actually|basically|essentially|specifically|particularly)\b/gi,
];

const MAX_SAMPLES = 100;
const MAX_FREQUENT_WORDS = 100;
const MAX_PATTERNS_PER_CATEGORY = 20;

export class StyleLearner {
  private profile: StyleProfile;

  constructor(profile?: StyleProfile | null) {
    this.profile = profile || { ...DEFAULT_STYLE_PROFILE };
  }

  getProfile(): StyleProfile {
    return this.profile;
  }

  analyzeText(text: string): TextMetrics {
    return {
      sentenceCount: this.countSentences(text),
      wordCount: this.countWords(text),
      averageSentenceLength: this.calculateAvgSentenceLength(text),
      uniqueWords: this.getUniqueWords(text),
      punctuationUsage: this.analyzePunctuation(text),
      formalityIndicators: this.detectFormality(text),
    };
  }

  private countSentences(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length;
  }

  private countWords(text: string): number {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }

  private calculateAvgSentenceLength(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;

    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);

    return totalWords / sentences.length;
  }

  private getUniqueWords(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u024F]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
    return new Set(words);
  }

  private analyzePunctuation(text: string): {
    semicolonUsage: number;
    exclamationUsage: number;
    ellipsisUsage: number;
  } {
    const wordCount = this.countWords(text) || 1;
    const semicolons = (text.match(/;/g) || []).length;
    const exclamations = (text.match(/!/g) || []).length;
    const ellipses = (text.match(/\.{3}|…/g) || []).length;

    return {
      semicolonUsage: semicolons / wordCount,
      exclamationUsage: exclamations / wordCount,
      ellipsisUsage: ellipses / wordCount,
    };
  }

  private detectFormality(text: string): { formalityScore: number; indicators: string[] } {
    let score = 0.5;
    const indicators: string[] = [];

    if (/vous|votre|vos/i.test(text)) {
      score += 0.15;
      indicators.push('vouvoiement');
    }
    if (/cordialement|sincères|respectueusement/i.test(text)) {
      score += 0.1;
      indicators.push('formule_politesse_formelle');
    }
    if (/madame|monsieur|cher\s/i.test(text)) {
      score += 0.1;
      indicators.push('titre_honorifique');
    }
    if (/je vous prie|veuillez/i.test(text)) {
      score += 0.1;
      indicators.push('expressions_formelles');
    }

    if (/\btu\b|ton\b|ta\b|tes\b/i.test(text)) {
      score -= 0.15;
      indicators.push('tutoiement');
    }
    if (/salut|coucou|hey/i.test(text)) {
      score -= 0.1;
      indicators.push('salutation_informelle');
    }
    if (/mdr|lol|ptdr|haha|😀|😊|🙂/i.test(text)) {
      score -= 0.2;
      indicators.push('expressions_informelles');
    }
    if (/!{2,}|\?{2,}/g.test(text)) {
      score -= 0.05;
      indicators.push('ponctuation_excessive');
    }
    if (/\bà\+\b|bisou|bises/i.test(text)) {
      score -= 0.1;
      indicators.push('formule_politesse_informelle');
    }

    return {
      formalityScore: Math.max(0, Math.min(1, score)),
      indicators,
    };
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
    if (!original || !corrected || original === corrected) return;

    const originalWords = new Set(original.toLowerCase().split(/\s+/));
    const correctedWords = corrected.toLowerCase().split(/\s+/);

    for (const word of correctedWords) {
      if (!originalWords.has(word) && word.length > 3) {
        const existing = this.profile.vocabulary.frequentWords.find(w => w.word === word);
        if (existing) {
          existing.count += 2;
        } else if (!this.isStopWord(word)) {
          this.profile.vocabulary.frequentWords.push({ word, count: 2 });
        }
      }
    }

    this.profile.vocabulary.frequentWords.sort((a, b) => b.count - a.count);
    this.profile.vocabulary.frequentWords = this.profile.vocabulary.frequentWords.slice(0, MAX_FREQUENT_WORDS);

    await this.learnFromSample(corrected, 'correction');
  }

  private updateMetrics(metrics: TextMetrics): void {
    const totalSamples = this.profile.trainingStats.totalSamples || 1;
    const weight = 1 / (totalSamples + 1);
    const existingWeight = 1 - weight;

    this.profile.metrics.averageSentenceLength =
      this.profile.metrics.averageSentenceLength * existingWeight +
      metrics.averageSentenceLength * weight;

    const uniqueWordsCount = metrics.uniqueWords.size;
    const wordCount = metrics.wordCount || 1;
    const newVocabRichness = uniqueWordsCount / wordCount;
    this.profile.metrics.vocabularyRichness =
      this.profile.metrics.vocabularyRichness * existingWeight +
      newVocabRichness * weight;

    this.profile.metrics.formalityScore =
      this.profile.metrics.formalityScore * existingWeight +
      metrics.formalityIndicators.formalityScore * weight;

    this.profile.metrics.punctuationStyle.semicolonUsage =
      this.profile.metrics.punctuationStyle.semicolonUsage * existingWeight +
      metrics.punctuationUsage.semicolonUsage * weight;

    this.profile.metrics.punctuationStyle.exclamationUsage =
      this.profile.metrics.punctuationStyle.exclamationUsage * existingWeight +
      metrics.punctuationUsage.exclamationUsage * weight;

    this.profile.metrics.punctuationStyle.ellipsisUsage =
      this.profile.metrics.punctuationStyle.ellipsisUsage * existingWeight +
      metrics.punctuationUsage.ellipsisUsage * weight;
  }

  private extractPatterns(text: string): void {
    for (const pattern of [...GREETING_PATTERNS_FR, ...GREETING_PATTERNS_EN]) {
      const match = text.match(pattern);
      if (match) {
        this.addToPatterns('greetings', match[0]);
      }
    }

    for (const pattern of [...CLOSING_PATTERNS_FR, ...CLOSING_PATTERNS_EN]) {
      const match = text.match(pattern);
      if (match) {
        this.addToPatterns('closings', match[0]);
      }
    }

    for (const pattern of [...TRANSITION_PATTERNS_FR, ...TRANSITION_PATTERNS_EN]) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          this.addToPatterns('transitions', match);
        }
      }
    }
  }

  private addToPatterns(
    category: keyof StyleProfilePatterns,
    value: string
  ): void {
    const normalizedValue = value.toLowerCase().trim();
    if (!this.profile.patterns[category].includes(normalizedValue)) {
      this.profile.patterns[category].push(normalizedValue);
      if (this.profile.patterns[category].length > MAX_PATTERNS_PER_CATEGORY) {
        this.profile.patterns[category] = this.profile.patterns[category].slice(-MAX_PATTERNS_PER_CATEGORY);
      }
    }
  }

  private updateVocabulary(text: string): void {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u024F'-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !this.isStopWord(w));

    for (const word of words) {
      const existing = this.profile.vocabulary.frequentWords.find(w => w.word === word);
      if (existing) {
        existing.count++;
      } else {
        this.profile.vocabulary.frequentWords.push({ word, count: 1 });
      }
    }

    this.profile.vocabulary.frequentWords.sort((a, b) => b.count - a.count);
    this.profile.vocabulary.frequentWords = this.profile.vocabulary.frequentWords.slice(0, MAX_FREQUENT_WORDS);

    this.detectTechnicalTerms(text);
  }

  private detectTechnicalTerms(text: string): void {
    const technicalPatterns = [
      /\b[A-Z]{2,}\b/g,
      /\b\w+\.(js|ts|py|java|cpp|json|xml|html|css|sql)\b/gi,
      /\b(API|SDK|REST|GraphQL|HTTP|HTTPS|SQL|NoSQL|JWT|OAuth)\b/gi,
      /\b(backend|frontend|fullstack|devops|CI\/CD|docker|kubernetes)\b/gi,
      /\b(sprint|scrum|agile|kanban|backlog|deploy|merge|commit)\b/gi,
    ];

    for (const pattern of technicalPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const normalizedTerm = match.toLowerCase();
          if (!this.profile.vocabulary.technicalTerms.includes(normalizedTerm)) {
            this.profile.vocabulary.technicalTerms.push(normalizedTerm);
          }
        }
      }
    }

    this.profile.vocabulary.technicalTerms = this.profile.vocabulary.technicalTerms.slice(0, 50);
  }

  private isStopWord(word: string): boolean {
    const lowerWord = word.toLowerCase();
    return FRENCH_STOP_WORDS.has(lowerWord) || ENGLISH_STOP_WORDS.has(lowerWord);
  }

  private addSampleText(text: string, context: string): void {
    const cleanedText = text.trim();
    if (cleanedText.length < 20) return;

    const existingIndex = this.profile.sampleTexts.findIndex(
      s => s.text === cleanedText
    );
    if (existingIndex !== -1) return;

    this.profile.sampleTexts.push({
      context,
      text: cleanedText.substring(0, 500),
      timestamp: Date.now(),
    });

    if (this.profile.sampleTexts.length > MAX_SAMPLES) {
      this.profile.sampleTexts = this.profile.sampleTexts.slice(-MAX_SAMPLES);
    }

    this.profile.trainingStats.totalSamples++;
    this.profile.trainingStats.lastTrainingDate = Date.now();
  }

  private updateConfidenceScore(): void {
    const totalSamples = this.profile.trainingStats.totalSamples;
    const hasGreetings = this.profile.patterns.greetings.length > 0;
    const hasClosings = this.profile.patterns.closings.length > 0;
    const hasTransitions = this.profile.patterns.transitions.length > 0;
    const hasVocabulary = this.profile.vocabulary.frequentWords.length >= 10;

    let score = 0;

    if (totalSamples >= 5) score += 10;
    if (totalSamples >= 10) score += 15;
    if (totalSamples >= 20) score += 20;
    if (totalSamples >= 50) score += 15;
    if (totalSamples >= 100) score += 10;

    if (hasGreetings) score += 5;
    if (hasClosings) score += 5;
    if (hasTransitions) score += 5;
    if (hasVocabulary) score += 10;

    if (this.profile.vocabulary.technicalTerms.length >= 5) score += 5;

    this.profile.trainingStats.confidenceScore = Math.min(100, score);
  }

  generateStylePrompt(): string {
    if (this.profile.trainingStats.totalSamples < 10) {
      return '';
    }

    const formalityDesc = this.profile.metrics.formalityScore > 0.7
      ? 'formal (use "vous" in French, professional tone)'
      : this.profile.metrics.formalityScore < 0.3
        ? 'casual/informal (use "tu" in French, relaxed tone)'
        : 'neutral';

    let prompt = `
Adapt your writing to match this personal style:

Sentence style:
- Average length: ${Math.round(this.profile.metrics.averageSentenceLength)} words per sentence
- Formality: ${formalityDesc}
`;

    if (this.profile.patterns.greetings.length > 0) {
      prompt += `
Preferred greetings: ${this.profile.patterns.greetings.slice(0, 5).join(', ')}`;
    }

    if (this.profile.patterns.closings.length > 0) {
      prompt += `
Preferred closings: ${this.profile.patterns.closings.slice(0, 5).join(', ')}`;
    }

    if (this.profile.patterns.transitions.length > 0) {
      prompt += `
Preferred transitions: ${this.profile.patterns.transitions.slice(0, 8).join(', ')}`;
    }

    if (this.profile.vocabulary.frequentWords.length > 0) {
      const topWords = this.profile.vocabulary.frequentWords
        .slice(0, 15)
        .map(w => w.word)
        .join(', ');
      prompt += `

Vocabulary preferences:
- Frequently used words: ${topWords}`;
    }

    if (this.profile.vocabulary.technicalTerms.length > 0) {
      prompt += `
- Technical terms to preserve exactly: ${this.profile.vocabulary.technicalTerms.slice(0, 10).join(', ')}`;
    }

    if (this.profile.sampleTexts.length >= 3) {
      const samples = this.profile.sampleTexts
        .slice(-3)
        .map(s => `"${s.text.substring(0, 150)}${s.text.length > 150 ? '...' : ''}"`)
        .join('\n');
      prompt += `

Reference examples of user's writing style:
${samples}`;
    }

    prompt += `

Match this writing style while preserving the original meaning. Do not add content that wasn't in the original.`;

    return prompt.trim();
  }

  addTechnicalTerm(term: string): void {
    const normalizedTerm = term.toLowerCase().trim();
    if (!this.profile.vocabulary.technicalTerms.includes(normalizedTerm)) {
      this.profile.vocabulary.technicalTerms.push(normalizedTerm);
      this.profile.updatedAt = Date.now();
    }
  }

  removeTechnicalTerm(term: string): void {
    const normalizedTerm = term.toLowerCase().trim();
    this.profile.vocabulary.technicalTerms = this.profile.vocabulary.technicalTerms.filter(
      t => t !== normalizedTerm
    );
    this.profile.updatedAt = Date.now();
  }

  reset(): void {
    this.profile = {
      ...DEFAULT_STYLE_PROFILE,
      id: this.profile.id,
      createdAt: this.profile.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  }

  isReadyForUse(minSamples: number = 20): boolean {
    return this.profile.trainingStats.totalSamples >= minSamples;
  }

  getTrainingStatus(): 'learning' | 'active' | 'inactive' {
    if (this.profile.trainingStats.totalSamples === 0) {
      return 'inactive';
    }
    if (this.profile.trainingStats.totalSamples < 20) {
      return 'learning';
    }
    return 'active';
  }
}

let styleLearnerInstance: StyleLearner | null = null;

export function getStyleLearner(profile?: StyleProfile | null): StyleLearner {
  if (!styleLearnerInstance) {
    styleLearnerInstance = new StyleLearner(profile);
  } else if (profile) {
    styleLearnerInstance = new StyleLearner(profile);
  }
  return styleLearnerInstance;
}

export function resetStyleLearner(): void {
  styleLearnerInstance = null;
}
