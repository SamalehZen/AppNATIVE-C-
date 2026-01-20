import { DictationEvent, DailyStats, AnalyticsSummary, AnalyticsPeriod } from '../../shared/types';

const TYPING_SPEED = 40;
const DICTATION_SPEED = 150;

export class AnalyticsService {
  calculateTimeSaved(wordCount: number): number {
    const typingTime = wordCount / TYPING_SPEED;
    const dictationTime = wordCount / DICTATION_SPEED;
    return typingTime - dictationTime;
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  }

  formatDurationMs(ms: number): string {
    const totalMinutes = ms / 60000;
    return this.formatDuration(totalMinutes);
  }

  calculateStreak(dailyStats: DailyStats[]): { current: number; longest: number } {
    if (dailyStats.length === 0) {
      return { current: 0, longest: 0 };
    }

    const sortedDates = dailyStats
      .filter(d => d.sessionCount > 0)
      .map(d => d.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (sortedDates.length === 0) {
      return { current: 0, longest: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecentDate = new Date(sortedDates[0]);
    mostRecentDate.setHours(0, 0, 0, 0);

    const isCurrentStreakActive = 
      mostRecentDate.getTime() === today.getTime() || 
      mostRecentDate.getTime() === yesterday.getTime();

    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i - 1]);
      const previousDate = new Date(sortedDates[i]);
      currentDate.setHours(0, 0, 0, 0);
      previousDate.setHours(0, 0, 0, 0);

      const diffDays = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    if (isCurrentStreakActive) {
      tempStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i - 1]);
        const previousDate = new Date(sortedDates[i]);
        currentDate.setHours(0, 0, 0, 0);
        previousDate.setHours(0, 0, 0, 0);

        const diffDays = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          tempStreak++;
        } else {
          break;
        }
      }
      currentStreak = tempStreak;
    }

    return { current: currentStreak, longest: longestStreak };
  }

  aggregateDailyStats(events: DictationEvent[]): Map<string, DailyStats> {
    const dailyMap = new Map<string, DailyStats>();

    for (const event of events) {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      
      let stats = dailyMap.get(date);
      if (!stats) {
        stats = {
          date,
          wordCount: 0,
          characterCount: 0,
          sessionCount: 0,
          totalDuration: 0,
          averageSpeed: 0,
          contexts: {},
          languages: {},
          modes: {},
        };
        dailyMap.set(date, stats);
      }

      stats.wordCount += event.wordCount;
      stats.characterCount += event.characterCount;
      stats.sessionCount++;
      stats.totalDuration += event.duration;

      stats.contexts[event.context] = (stats.contexts[event.context] || 0) + 1;
      stats.languages[event.language] = (stats.languages[event.language] || 0) + 1;
      stats.modes[event.mode] = (stats.modes[event.mode] || 0) + 1;
    }

    for (const stats of dailyMap.values()) {
      if (stats.totalDuration > 0) {
        stats.averageSpeed = Math.round((stats.wordCount / (stats.totalDuration / 60000)));
      }
    }

    return dailyMap;
  }

  generateSummary(events: DictationEvent[], dailyStats: DailyStats[]): AnalyticsSummary {
    const totalWords = events.reduce((sum, e) => sum + e.wordCount, 0);
    const totalCharacters = events.reduce((sum, e) => sum + e.characterCount, 0);
    const totalSessions = events.length;
    const totalDuration = events.reduce((sum, e) => sum + e.duration, 0);

    const uniqueDays = new Set(events.map(e => 
      new Date(e.timestamp).toISOString().split('T')[0]
    )).size;

    const averageWordsPerDay = uniqueDays > 0 ? Math.round(totalWords / uniqueDays) : 0;
    const averageSessionDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const averageSpeed = totalDuration > 0 ? Math.round((totalWords / (totalDuration / 60000))) : 0;

    const estimatedTimeSaved = this.calculateTimeSaved(totalWords);
    const estimatedTimeSavedFormatted = this.formatDuration(estimatedTimeSaved);

    const { current: currentStreak, longest: longestStreak } = this.calculateStreak(dailyStats);

    const contextCounts: Record<string, number> = {};
    const languageCounts: Record<string, number> = {};
    const modeCounts: Record<string, number> = {};
    const snippetCounts: Record<string, number> = {};

    for (const event of events) {
      contextCounts[event.context] = (contextCounts[event.context] || 0) + 1;
      languageCounts[event.language] = (languageCounts[event.language] || 0) + 1;
      modeCounts[event.mode] = (modeCounts[event.mode] || 0) + 1;
      for (const snippet of event.snippetsUsed) {
        snippetCounts[snippet] = (snippetCounts[snippet] || 0) + 1;
      }
    }

    const toTopArray = (counts: Record<string, number>, key: string) => {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({
          [key]: name,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }));
    };

    const topContexts = toTopArray(contextCounts, 'context') as Array<{ context: string; count: number; percentage: number }>;
    const topLanguages = toTopArray(languageCounts, 'language') as Array<{ language: string; count: number; percentage: number }>;
    const topModes = toTopArray(modeCounts, 'mode') as Array<{ mode: string; count: number; percentage: number }>;

    const topSnippets = Object.entries(snippetCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([snippet, count]) => ({ snippet, count }));

    const hourlyDistribution = new Array(24).fill(0);
    const weeklyDistribution = new Array(7).fill(0);

    for (const event of events) {
      const date = new Date(event.timestamp);
      hourlyDistribution[date.getHours()] += event.wordCount;
      weeklyDistribution[date.getDay()] += event.wordCount;
    }

    return {
      totalWords,
      totalCharacters,
      totalSessions,
      totalDuration,
      averageWordsPerDay,
      averageSessionDuration,
      averageSpeed,
      estimatedTimeSaved,
      estimatedTimeSavedFormatted,
      currentStreak,
      longestStreak,
      topContexts,
      topLanguages,
      topModes,
      topSnippets,
      hourlyDistribution,
      weeklyDistribution,
    };
  }

  getDateRangeForPeriod(period: AnalyticsPeriod): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'all':
        start.setFullYear(2020, 0, 1);
        break;
    }

    return { start, end };
  }
}

export const analyticsService = new AnalyticsService();
