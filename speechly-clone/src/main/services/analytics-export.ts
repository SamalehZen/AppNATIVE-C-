import { DailyStats, AnalyticsPeriod } from '../../shared/types';
import { getStatsRange } from '../database';
import { analyticsService } from './analytics-service';

export function exportAnalytics(
  format: 'json' | 'csv',
  period: AnalyticsPeriod
): string {
  const { start, end } = analyticsService.getDateRangeForPeriod(period);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  
  const data = getStatsRange(startStr, endStr);
  
  if (format === 'csv') {
    return convertToCSV(data);
  }
  
  return JSON.stringify(data, null, 2);
}

function convertToCSV(data: DailyStats[]): string {
  const headers = [
    'Date',
    'Mots',
    'Caractères',
    'Sessions',
    'Durée (min)',
    'Vitesse (mots/min)',
  ];
  
  const rows = data.map(stats => [
    stats.date,
    stats.wordCount.toString(),
    stats.characterCount.toString(),
    stats.sessionCount.toString(),
    Math.round(stats.totalDuration / 60000).toString(),
    stats.averageSpeed.toString(),
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  return csvContent;
}

export function getExportFileName(format: 'json' | 'csv', period: AnalyticsPeriod): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `analytics-${period}-${timestamp}.${format}`;
}
