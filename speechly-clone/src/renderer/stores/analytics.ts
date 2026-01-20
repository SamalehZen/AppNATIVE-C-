import { create } from 'zustand';
import { AnalyticsSummary, DailyStats, AnalyticsPeriod } from '../../shared/types';

interface AnalyticsStore {
  summary: AnalyticsSummary | null;
  dailyStats: DailyStats[];
  selectedPeriod: AnalyticsPeriod;
  isLoading: boolean;
  error: string | null;
  loadSummary: () => Promise<void>;
  loadDailyStats: (startDate: string, endDate: string) => Promise<void>;
  setPeriod: (period: AnalyticsPeriod) => void;
  exportData: (format: 'json' | 'csv') => Promise<string>;
  refresh: () => Promise<void>;
}

function getDateRange(period: AnalyticsPeriod): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  
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
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  summary: null,
  dailyStats: [],
  selectedPeriod: 'week',
  isLoading: false,
  error: null,

  loadSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const { selectedPeriod } = get();
      const summary = await window.electronAPI.getAnalyticsSummary(selectedPeriod);
      set({ summary, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadDailyStats: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      const dailyStats = await window.electronAPI.getStatsRange(startDate, endDate);
      set({ dailyStats, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setPeriod: (period: AnalyticsPeriod) => {
    set({ selectedPeriod: period });
    get().refresh();
  },

  exportData: async (format: 'json' | 'csv') => {
    const { selectedPeriod } = get();
    return window.electronAPI.exportAnalytics(format, selectedPeriod);
  },

  refresh: async () => {
    const { selectedPeriod, loadSummary, loadDailyStats } = get();
    const { start, end } = getDateRange(selectedPeriod);
    await Promise.all([
      loadSummary(),
      loadDailyStats(start, end),
    ]);
  },
}));
