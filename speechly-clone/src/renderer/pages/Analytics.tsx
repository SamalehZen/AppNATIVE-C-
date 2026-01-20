import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Clock,
  FileText,
  Flame,
  Download,
  ChevronDown,
  Loader2,
  Zap,
  Globe,
  Layers,
} from 'lucide-react';
import { useAnalyticsStore } from '../stores/analytics';
import { AnalyticsPeriod } from '../../shared/types';
import {
  StatCard,
  ActivityChart,
  HeatmapChart,
  StreakDisplay,
  DistributionCard,
} from '../components/analytics';
import { CONTEXT_NAMES } from '../../shared/constants';
import { SUPPORTED_LANGUAGES } from '../../shared/types';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: '30 derniers jours' },
  { value: 'year', label: 'Cette année' },
  { value: 'all', label: 'Tout' },
];

const CONTEXT_COLORS: Record<string, string> = {
  email: '#a855f7',
  chat: '#22c55e',
  code: '#3b82f6',
  document: '#f59e0b',
  browser: '#ec4899',
  social: '#14b8a6',
  ai: '#8b5cf6',
  spreadsheet: '#06b6d4',
  terminal: '#64748b',
  general: '#6b7280',
};

const MODE_COLORS: Record<string, string> = {
  auto: '#a855f7',
  raw: '#6b7280',
  email: '#f59e0b',
  prompt: '#3b82f6',
  todo: '#22c55e',
  notes: '#ec4899',
};

const LANGUAGE_COLORS = [
  '#a855f7',
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ec4899',
];

export const Analytics: React.FC = () => {
  const {
    summary,
    dailyStats,
    selectedPeriod,
    isLoading,
    setPeriod,
    refresh,
    exportData,
  } = useAnalyticsStore();

  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [chartMetric, setChartMetric] = useState<'words' | 'sessions' | 'duration'>('words');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    setShowExportDropdown(false);
    try {
      const data = await exportData(format);
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getLanguageName = (code: string): string => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return lang?.name || code;
  };

  const contextDistribution = (summary?.topContexts || []).map((item, index) => ({
    label: CONTEXT_NAMES[item.context] || item.context,
    count: item.count,
    percentage: item.percentage,
    color: CONTEXT_COLORS[item.context] || '#6b7280',
  }));

  const languageDistribution = (summary?.topLanguages || []).map((item, index) => ({
    label: getLanguageName(item.language),
    count: item.count,
    percentage: item.percentage,
    color: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
  }));

  const modeDistribution = (summary?.topModes || []).map((item) => ({
    label: item.mode.charAt(0).toUpperCase() + item.mode.slice(1),
    count: item.count,
    percentage: item.percentage,
    color: MODE_COLORS[item.mode] || '#6b7280',
  }));

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-bg-tertiary shrink-0">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-accent-purple" size={24} />
          <h1 className="text-xl font-semibold">Dashboard Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg hover:border-accent-purple/50 transition-colors"
            >
              <span className="text-sm">
                {PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label}
              </span>
              <ChevronDown size={16} className="text-text-secondary" />
            </button>
            {showPeriodDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPeriodDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl z-20 py-1 min-w-[160px]">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPeriod(option.value);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary transition-colors ${
                        selectedPeriod === option.value ? 'text-accent-purple' : 'text-text-primary'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span className="text-sm">Export</span>
            </button>
            {showExportDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl z-20 py-1">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary transition-colors"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-accent-purple" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Mots dictés"
                value={formatNumber(summary?.totalWords || 0)}
                subtitle={`${formatNumber(summary?.averageWordsPerDay || 0)}/jour en moyenne`}
                icon={FileText}
                color="purple"
              />
              <StatCard
                title="Temps économisé"
                value={summary?.estimatedTimeSavedFormatted || '0min'}
                subtitle="vs frappe traditionnelle"
                icon={Clock}
                color="green"
              />
              <StatCard
                title="Sessions"
                value={formatNumber(summary?.totalSessions || 0)}
                subtitle={`~${Math.round((summary?.averageSessionDuration || 0) / 1000)}s/session`}
                icon={Zap}
                color="blue"
              />
              <StatCard
                title="Streak"
                value={`${summary?.currentStreak || 0} jours`}
                subtitle={`Record: ${summary?.longestStreak || 0} jours`}
                icon={Flame}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text-secondary">
                    Activité quotidienne
                  </h3>
                  <div className="flex gap-2">
                    {(['words', 'sessions', 'duration'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setChartMetric(m)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          chartMetric === m
                            ? 'bg-accent-purple text-white'
                            : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {m === 'words' ? 'Mots' : m === 'sessions' ? 'Sessions' : 'Durée'}
                      </button>
                    ))}
                  </div>
                </div>
                <ActivityChart data={dailyStats} metric={chartMetric} />
              </div>

              <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-4">
                  Streak & Constance
                </h3>
                <StreakDisplay
                  currentStreak={summary?.currentStreak || 0}
                  longestStreak={summary?.longestStreak || 0}
                />
                <div className="mt-6">
                  <HeatmapChart
                    hourlyData={summary?.hourlyDistribution || new Array(24).fill(0)}
                    weeklyData={summary?.weeklyDistribution || new Array(7).fill(0)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DistributionCard
                title="Par contexte"
                items={contextDistribution}
              />
              <DistributionCard
                title="Par langue"
                items={languageDistribution}
              />
              <DistributionCard
                title="Par mode"
                items={modeDistribution}
              />
            </div>

            {summary?.topSnippets && summary.topSnippets.length > 0 && (
              <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-accent-purple" />
                  <h3 className="text-sm font-medium text-text-secondary">
                    Snippets les plus utilisés
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.topSnippets.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-lg"
                    >
                      <span className="text-sm text-text-primary">{item.snippet}</span>
                      <span className="text-xs text-text-secondary bg-bg-secondary px-2 py-0.5 rounded">
                        {item.count}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={16} className="text-text-secondary" />
                  <span className="text-xs text-text-secondary">Caractères totaux</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {formatNumber(summary?.totalCharacters || 0)}
                </div>
              </div>
              <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-text-secondary" />
                  <span className="text-xs text-text-secondary">Durée totale</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {Math.round((summary?.totalDuration || 0) / 60000)} min
                </div>
              </div>
              <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-text-secondary" />
                  <span className="text-xs text-text-secondary">Vitesse moyenne</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {summary?.averageSpeed || 0} <span className="text-sm font-normal text-text-secondary">mots/min</span>
                </div>
              </div>
              <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers size={16} className="text-text-secondary" />
                  <span className="text-xs text-text-secondary">Mots/session</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {summary?.totalSessions ? Math.round((summary?.totalWords || 0) / summary.totalSessions) : 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
