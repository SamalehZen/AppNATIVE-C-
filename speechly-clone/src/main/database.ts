import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { Settings, TranscriptHistory, CustomDictionary, GeminiModel, Snippet, SnippetCategory, SnippetProcessResult, DEFAULT_SNIPPETS, UserProfile, DEFAULT_USER_PROFILE, DictationMode, DictationEvent, DailyStats, AnalyticsSummary, AnalyticsPeriod, TranslationSettings, FormalityLevel, StyleProfile, StyleSampleText, DEFAULT_STYLE_PROFILE, StyleLearningSettings, DEFAULT_STYLE_LEARNING_SETTINGS, LanguagePreferences, DEFAULT_LANGUAGE_PREFERENCES, LanguageRegion } from '../shared/types';
import { DEFAULT_TRANSLATION_SETTINGS } from '../shared/constants';
import { CONTEXT_NAMES } from '../shared/constants';
import { analyticsService } from './services/analytics-service';

interface DatabaseData {
  settings: Settings | null;
  history: TranscriptHistory[];
  dictionary: CustomDictionary[];
  snippets: Snippet[];
  profile: UserProfile | null;
  analyticsEvents: DictationEvent[];
  styleProfile: StyleProfile | null;
  languagePreferences: LanguagePreferences;
  nextHistoryId: number;
  nextDictionaryId: number;
}

let data: DatabaseData = {
  settings: null,
  history: [],
  dictionary: [],
  snippets: [],
  profile: null,
  analyticsEvents: [],
  styleProfile: null,
  languagePreferences: { ...DEFAULT_LANGUAGE_PREFERENCES },
  nextHistoryId: 1,
  nextDictionaryId: 1,
};

function getDataPath(): string {
  return path.join(app.getPath('userData'), 'speechly-data.json');
}

function saveData(): void {
  try {
    fs.writeFileSync(getDataPath(), JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

function loadData(): void {
  try {
    const filePath = getDataPath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const loaded = JSON.parse(content) as DatabaseData;
      data = {
        settings: loaded.settings || null,
        history: loaded.history || [],
        dictionary: loaded.dictionary || [],
        snippets: loaded.snippets || [],
        profile: loaded.profile || null,
        analyticsEvents: loaded.analyticsEvents || [],
        styleProfile: loaded.styleProfile || null,
        languagePreferences: loaded.languagePreferences || { ...DEFAULT_LANGUAGE_PREFERENCES },
        nextHistoryId: loaded.nextHistoryId || 1,
        nextDictionaryId: loaded.nextDictionaryId || 1,
      };
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

const DEFAULT_SETTINGS: Omit<Settings, 'appVersion'> = {
  id: 1,
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  defaultLanguage: 'fr-FR',
  autoDetectLanguage: false,
  hotkeyRecord: 'CommandOrControl+Shift+Space',
  hotkeyInsert: 'CommandOrControl+Shift+V',
  autoCleanup: true,
  contextAwareCleanup: true,
  defaultDictationMode: 'auto' as DictationMode,
  alwaysUseAutoMode: false,
  saveHistory: true,
  historyRetentionDays: 30,
  theme: 'dark',
  minimizeToTray: true,
  launchAtStartup: false,
  translation: DEFAULT_TRANSLATION_SETTINGS,
  styleLearning: DEFAULT_STYLE_LEARNING_SETTINGS,
};

export async function initDatabase(): Promise<void> {
  loadData();
  
  if (!data.settings) {
    data.settings = { ...DEFAULT_SETTINGS, appVersion: app.getVersion() };
    saveData();
  }
  
  if (data.snippets.length === 0) {
    initDefaultSnippets();
  }
  
  cleanupOldHistory();
}

function initDefaultSnippets(): void {
  const now = Date.now();
  data.snippets = DEFAULT_SNIPPETS.map((snippet, index) => ({
    ...snippet,
    id: `snippet-${now}-${index}`,
    content: '',
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  }));
  saveData();
}

function cleanupOldHistory(): void {
  if (!data.settings || data.settings.historyRetentionDays <= 0) return;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - data.settings.historyRetentionDays);
  
  const originalLength = data.history.length;
  data.history = data.history.filter(item => {
    const itemDate = new Date(item.createdAt);
    return itemDate >= cutoffDate;
  });
  
  if (data.history.length !== originalLength) {
    saveData();
  }
}

const VALID_GEMINI_MODELS: GeminiModel[] = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash-preview-09-2025',
  'gemini-2.5-flash-lite-preview-09-2025',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

function isValidGeminiModel(model: string): model is GeminiModel {
  return VALID_GEMINI_MODELS.includes(model as GeminiModel);
}

function isValidTheme(theme: string): theme is 'dark' | 'light' | 'system' {
  return ['dark', 'light', 'system'].includes(theme);
}

export function getSettings(): Settings | null {
  if (!data.settings) return null;
  
  return {
    ...data.settings,
    geminiModel: isValidGeminiModel(data.settings.geminiModel) ? data.settings.geminiModel : 'gemini-2.0-flash',
    theme: isValidTheme(data.settings.theme) ? data.settings.theme : 'dark',
    appVersion: app.getVersion(),
    translation: data.settings.translation || DEFAULT_TRANSLATION_SETTINGS,
    styleLearning: data.settings.styleLearning || DEFAULT_STYLE_LEARNING_SETTINGS,
  };
}

export function saveSettings(settings: Partial<Settings>): void {
  if (!data.settings) {
    data.settings = { ...DEFAULT_SETTINGS, appVersion: app.getVersion() };
  }
  
  data.settings = { ...data.settings, ...settings, appVersion: app.getVersion() };
  saveData();
}

export function saveTranscript(transcriptData: {
  original: string;
  cleaned: string;
  language: string;
  context: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}): void {
  if (data.settings && !data.settings.saveHistory) return;

  const wordCount = transcriptData.cleaned.split(/\s+/).filter(w => w.length > 0).length;
  const contextName = CONTEXT_NAMES[transcriptData.context] || 'Général';
  
  const newItem: TranscriptHistory = {
    id: data.nextHistoryId++,
    original: transcriptData.original,
    cleaned: transcriptData.cleaned,
    language: transcriptData.language,
    context: transcriptData.context,
    contextName,
    createdAt: new Date().toISOString(),
    wordCount,
    translatedText: transcriptData.translatedText,
    sourceLanguage: transcriptData.sourceLanguage,
    targetLanguage: transcriptData.targetLanguage,
  };
  
  data.history.unshift(newItem);
  saveData();
}

export function getHistory(limit: number, offset: number, context?: string): TranscriptHistory[] {
  let filtered = data.history;
  
  if (context && context !== 'all') {
    filtered = filtered.filter(item => item.context === context);
  }
  
  return filtered.slice(offset, offset + limit);
}

export function deleteHistoryItem(id: number): void {
  data.history = data.history.filter(item => item.id !== id);
  saveData();
}

export function clearHistory(): void {
  data.history = [];
  saveData();
}

export function getStats(): { totalWords: number; todayWords: number; dbSize: string } {
  const totalWords = data.history.reduce((sum, item) => sum + item.wordCount, 0);
  
  const today = new Date().toISOString().split('T')[0];
  const todayWords = data.history
    .filter(item => item.createdAt.startsWith(today))
    .reduce((sum, item) => sum + item.wordCount, 0);
  
  let dbSize = '0';
  try {
    const stats = fs.statSync(getDataPath());
    const sizeMB = stats.size / (1024 * 1024);
    dbSize = sizeMB.toFixed(2);
  } catch (e) {
    // File doesn't exist yet
  }

  return { totalWords, todayWords, dbSize };
}

export function getDictionary(): CustomDictionary[] {
  return [...data.dictionary].sort((a, b) => a.term.localeCompare(b.term));
}

export function addDictionaryTerm(term: string, replacement: string, context: string): void {
  const newTerm: CustomDictionary = {
    id: data.nextDictionaryId++,
    term,
    replacement,
    context,
    createdAt: new Date().toISOString(),
  };
  
  data.dictionary.push(newTerm);
  saveData();
}

export function updateDictionaryTerm(id: number, term: string, replacement: string, context: string): void {
  const index = data.dictionary.findIndex(item => item.id === id);
  if (index !== -1) {
    data.dictionary[index] = { ...data.dictionary[index], term, replacement, context };
    saveData();
  }
}

export function deleteDictionaryTerm(id: number): void {
  data.dictionary = data.dictionary.filter(item => item.id !== id);
  saveData();
}

export function closeDatabase(): void {
  saveData();
}

export function getSnippets(): Snippet[] {
  return [...data.snippets].sort((a, b) => a.triggerPhrase.localeCompare(b.triggerPhrase));
}

export function getSnippetsByCategory(category: SnippetCategory): Snippet[] {
  return data.snippets
    .filter(snippet => snippet.category === category)
    .sort((a, b) => a.triggerPhrase.localeCompare(b.triggerPhrase));
}

export function saveSnippet(snippet: Snippet): void {
  const existingIndex = data.snippets.findIndex(s => s.id === snippet.id);
  if (existingIndex !== -1) {
    data.snippets[existingIndex] = { ...snippet, updatedAt: Date.now() };
  } else {
    data.snippets.push({ ...snippet, createdAt: Date.now(), updatedAt: Date.now() });
  }
  saveData();
}

export function updateSnippet(id: string, updates: Partial<Snippet>): void {
  const index = data.snippets.findIndex(s => s.id === id);
  if (index !== -1) {
    data.snippets[index] = { ...data.snippets[index], ...updates, updatedAt: Date.now() };
    saveData();
  }
}

export function deleteSnippet(id: string): void {
  data.snippets = data.snippets.filter(s => s.id !== id);
  saveData();
}

export function findSnippetByTrigger(text: string): Snippet | null {
  const lowerText = text.toLowerCase();
  
  for (const snippet of data.snippets) {
    if (!snippet.isActive || !snippet.content) continue;
    
    if (lowerText.includes(snippet.triggerPhrase.toLowerCase())) {
      return snippet;
    }
    
    for (const variant of snippet.triggerVariants) {
      if (lowerText.includes(variant.toLowerCase())) {
        return snippet;
      }
    }
  }
  
  return null;
}

export function incrementSnippetUsage(id: string): void {
  const index = data.snippets.findIndex(s => s.id === id);
  if (index !== -1) {
    data.snippets[index].usageCount++;
    data.snippets[index].updatedAt = Date.now();
    saveData();
  }
}

export function processSnippets(text: string): SnippetProcessResult {
  let processedText = text;
  const replacements: { trigger: string; value: string; snippetId: string }[] = [];
  const lowerText = text.toLowerCase();
  
  for (const snippet of data.snippets) {
    if (!snippet.isActive || !snippet.content) continue;
    
    const allTriggers = [snippet.triggerPhrase, ...snippet.triggerVariants];
    
    for (const trigger of allTriggers) {
      const lowerTrigger = trigger.toLowerCase();
      const index = lowerText.indexOf(lowerTrigger);
      
      if (index !== -1) {
        const originalTrigger = text.substring(index, index + trigger.length);
        const resolvedContent = resolveProfileVariables(snippet.content);
        processedText = processedText.replace(new RegExp(escapeRegex(originalTrigger), 'gi'), resolvedContent);
        replacements.push({
          trigger: originalTrigger,
          value: resolvedContent,
          snippetId: snippet.id,
        });
        incrementSnippetUsage(snippet.id);
        break;
      }
    }
  }
  
  return { processedText, replacements };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getUserProfile(): UserProfile | null {
  return data.profile;
}

export function saveUserProfile(profile: UserProfile): void {
  const now = Date.now();
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  
  data.profile = {
    ...profile,
    fullName,
    createdAt: data.profile?.createdAt || now,
    updatedAt: now,
  };
  saveData();
}

export function updateUserProfile(updates: Partial<UserProfile>): void {
  if (!data.profile) {
    data.profile = { ...DEFAULT_USER_PROFILE, createdAt: Date.now(), updatedAt: Date.now() };
  }
  
  const updatedProfile = { ...data.profile, ...updates };
  
  if (updates.firstName !== undefined || updates.lastName !== undefined) {
    updatedProfile.fullName = `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim();
  }
  
  updatedProfile.updatedAt = Date.now();
  data.profile = updatedProfile;
  saveData();
}

export function resolveProfileVariables(text: string): string {
  if (!data.profile) return text;
  
  const profile = data.profile;
  let result = text;
  
  result = result.replace(/\{firstName\}/g, profile.firstName);
  result = result.replace(/\{lastName\}/g, profile.lastName);
  result = result.replace(/\{fullName\}/g, profile.fullName);
  result = result.replace(/\{jobTitle\}/g, profile.jobTitle);
  result = result.replace(/\{company\}/g, profile.company);
  result = result.replace(/\{department\}/g, profile.department);
  result = result.replace(/\{email\}/g, profile.email);
  result = result.replace(/\{phone\}/g, profile.phone);
  result = result.replace(/\{mobile\}/g, profile.mobile);
  
  return result;
}

export function trackDictationEvent(event: DictationEvent): void {
  data.analyticsEvents.push(event);
  saveData();
}

export function getAnalyticsEvents(startDate?: Date, endDate?: Date): DictationEvent[] {
  let events = [...data.analyticsEvents];
  
  if (startDate) {
    events = events.filter(e => e.timestamp >= startDate.getTime());
  }
  if (endDate) {
    events = events.filter(e => e.timestamp <= endDate.getTime());
  }
  
  return events.sort((a, b) => a.timestamp - b.timestamp);
}

export function getDailyStats(date: string): DailyStats | null {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const events = data.analyticsEvents.filter(e => {
    const eventDate = new Date(e.timestamp);
    return eventDate >= targetDate && eventDate < nextDate;
  });

  if (events.length === 0) return null;

  const dailyMap = analyticsService.aggregateDailyStats(events);
  return dailyMap.get(date) || null;
}

export function getStatsRange(startDate: string, endDate: string): DailyStats[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const events = data.analyticsEvents.filter(e => {
    return e.timestamp >= start.getTime() && e.timestamp <= end.getTime();
  });

  const dailyMap = analyticsService.aggregateDailyStats(events);
  
  const result: DailyStats[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const stats = dailyMap.get(dateStr) || {
      date: dateStr,
      wordCount: 0,
      characterCount: 0,
      sessionCount: 0,
      totalDuration: 0,
      averageSpeed: 0,
      contexts: {},
      languages: {},
      modes: {},
    };
    result.push(stats);
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export function getAnalyticsSummary(period: AnalyticsPeriod): AnalyticsSummary {
  const { start, end } = analyticsService.getDateRangeForPeriod(period);
  
  const events = data.analyticsEvents.filter(e => {
    return e.timestamp >= start.getTime() && e.timestamp <= end.getTime();
  });

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  const dailyStats = getStatsRange(startStr, endStr);

  return analyticsService.generateSummary(events, dailyStats);
}

export function getTopSnippets(limit: number): Array<{ snippet: string; count: number }> {
  const snippetCounts: Record<string, number> = {};
  
  for (const event of data.analyticsEvents) {
    for (const snippet of event.snippetsUsed) {
      snippetCounts[snippet] = (snippetCounts[snippet] || 0) + 1;
    }
  }

  return Object.entries(snippetCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([snippet, count]) => ({ snippet, count }));
}

export function clearAnalyticsData(): void {
  data.analyticsEvents = [];
  saveData();
}

export function getStyleProfile(): StyleProfile | null {
  return data.styleProfile;
}

export function saveStyleProfile(profile: StyleProfile): void {
  data.styleProfile = {
    ...profile,
    updatedAt: Date.now(),
  };
  saveData();
}

export function addStyleSample(text: string, context: string): void {
  if (!data.styleProfile) {
    data.styleProfile = {
      ...DEFAULT_STYLE_PROFILE,
      id: `style-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  const existingIndex = data.styleProfile.sampleTexts.findIndex(
    s => s.text === text.trim()
  );
  if (existingIndex !== -1) return;

  data.styleProfile.sampleTexts.push({
    context,
    text: text.trim().substring(0, 500),
    timestamp: Date.now(),
  });

  if (data.styleProfile.sampleTexts.length > 100) {
    data.styleProfile.sampleTexts = data.styleProfile.sampleTexts.slice(-100);
  }

  data.styleProfile.trainingStats.totalSamples = data.styleProfile.sampleTexts.length;
  data.styleProfile.trainingStats.lastTrainingDate = Date.now();
  data.styleProfile.updatedAt = Date.now();

  saveData();
}

export function getStyleSamples(limit: number): StyleSampleText[] {
  if (!data.styleProfile) return [];
  return data.styleProfile.sampleTexts.slice(-limit);
}

export function clearStyleProfile(): void {
  data.styleProfile = null;
  saveData();
}

export function getLanguagePreferences(): LanguagePreferences {
  return { ...data.languagePreferences };
}

export function addRecentLanguage(code: string): void {
  const recent = data.languagePreferences.recentLanguages.filter(c => c !== code);
  recent.unshift(code);
  data.languagePreferences.recentLanguages = recent.slice(0, 5);
  saveData();
}

export function toggleFavoriteLanguage(code: string): void {
  const favorites = data.languagePreferences.favoriteLanguages;
  const index = favorites.indexOf(code);
  if (index === -1) {
    favorites.push(code);
  } else {
    favorites.splice(index, 1);
  }
  data.languagePreferences.favoriteLanguages = favorites;
  saveData();
}

export function setDefaultRegion(region: LanguageRegion | null): void {
  data.languagePreferences.defaultRegion = region;
  saveData();
}

export function isFavoriteLanguage(code: string): boolean {
  return data.languagePreferences.favoriteLanguages.includes(code);
}
