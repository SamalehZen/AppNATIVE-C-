import { Language, LanguageRegion, LanguageRegionInfo, LanguagesData, SupportLevel, LanguageTier } from '../../shared/types';
import languagesData from '../../data/languages.json';

const data = languagesData as LanguagesData;

class LanguageService {
  private languages: Language[];
  private regions: LanguageRegionInfo[];
  private languageMap: Map<string, Language>;

  constructor() {
    this.languages = data.languages;
    this.regions = data.regions;
    this.languageMap = new Map(this.languages.map(l => [l.code, l]));
  }

  getAllLanguages(): Language[] {
    return [...this.languages];
  }

  getLanguageByCode(code: string): Language | undefined {
    return this.languageMap.get(code);
  }

  getLanguagesByRegion(region: LanguageRegion): Language[] {
    return this.languages.filter(l => l.region === region);
  }

  getLanguagesByTier(maxTier: LanguageTier): Language[] {
    return this.languages.filter(l => l.tier <= maxTier);
  }

  getLanguagesWithFullSpeechSupport(): Language[] {
    return this.languages.filter(l => l.speechRecognitionSupport === 'full');
  }

  getLanguagesWithFullTranslationSupport(): Language[] {
    return this.languages.filter(l => l.translationSupport === 'full');
  }

  getRTLLanguages(): Language[] {
    return this.languages.filter(l => l.rtl);
  }

  searchLanguages(query: string): Language[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return this.languages.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      l.flag.includes(q)
    );
  }

  checkSpeechRecognitionSupport(code: string): SupportLevel {
    const lang = this.languageMap.get(code);
    return lang?.speechRecognitionSupport || 'none';
  }

  checkTranslationSupport(code: string): SupportLevel {
    const lang = this.languageMap.get(code);
    return lang?.translationSupport || 'none';
  }

  isRTL(code: string): boolean {
    const lang = this.languageMap.get(code);
    return lang?.rtl || false;
  }

  getVariants(baseCode: string): Language[] {
    const base = this.languageMap.get(baseCode);
    if (!base?.variants?.length) return [];
    return base.variants
      .map(code => this.languageMap.get(code))
      .filter((l): l is Language => l !== undefined);
  }

  getBaseLanguage(variantCode: string): Language | undefined {
    for (const lang of this.languages) {
      if (lang.variants?.includes(variantCode)) {
        return lang;
      }
    }
    return undefined;
  }

  getAllRegions(): LanguageRegionInfo[] {
    return [...this.regions];
  }

  getRegionInfo(regionId: LanguageRegion): LanguageRegionInfo | undefined {
    return this.regions.find(r => r.id === regionId);
  }

  getLanguageCount(): number {
    return this.languages.length;
  }

  getLanguagesByRegionGrouped(): Record<LanguageRegion, Language[]> {
    const grouped: Record<LanguageRegion, Language[]> = {
      'europe': [],
      'americas': [],
      'asia': [],
      'middle-east': [],
      'africa': [],
      'oceania': []
    };

    for (const lang of this.languages) {
      grouped[lang.region].push(lang);
    }

    for (const region of Object.keys(grouped) as LanguageRegion[]) {
      grouped[region].sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.name.localeCompare(b.name);
      });
    }

    return grouped;
  }

  getPrimaryLanguages(): Language[] {
    return this.languages
      .filter(l => l.tier <= 2)
      .sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.name.localeCompare(b.name);
      });
  }

  formatLanguageDisplay(code: string): string {
    const lang = this.languageMap.get(code);
    if (!lang) return code;
    return `${lang.flag} ${lang.nativeName}`;
  }

  formatLanguageShort(code: string): string {
    const lang = this.languageMap.get(code);
    if (!lang) return code;
    return `${lang.flag} ${lang.code.split('-')[0].toUpperCase()}`;
  }

  validateLanguageCode(code: string): boolean {
    return this.languageMap.has(code);
  }

  getSupportedLanguagesForSpeech(): Language[] {
    return this.languages.filter(l => 
      l.speechRecognitionSupport === 'full' || l.speechRecognitionSupport === 'partial'
    );
  }

  getSupportedLanguagesForTranslation(): Language[] {
    return this.languages.filter(l => 
      l.translationSupport === 'full' || l.translationSupport === 'partial'
    );
  }
}

export const languageService = new LanguageService();
