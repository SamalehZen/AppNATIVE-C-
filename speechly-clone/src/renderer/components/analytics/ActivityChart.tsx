import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { DailyStats } from '../../../shared/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityChartProps {
  data: DailyStats[];
  metric: 'words' | 'sessions' | 'duration';
}

const metricConfig = {
  words: { key: 'wordCount', label: 'Mots', color: '#a855f7' },
  sessions: { key: 'sessionCount', label: 'Sessions', color: '#22c55e' },
  duration: { key: 'totalDuration', label: 'Durée (min)', color: '#3b82f6' },
};

export const ActivityChart: React.FC<ActivityChartProps> = ({ data, metric }) => {
  const config = metricConfig[metric];

  const chartData = data.map((d) => ({
    date: d.date,
    label: format(parseISO(d.date), 'EEE d', { locale: fr }),
    value: metric === 'duration' ? Math.round(d.totalDuration / 60000) : (d as any)[config.key],
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            labelFormatter={(value) => value}
            formatter={(value) => [value as number, config.label]}
          />
          <Bar
            dataKey="value"
            fill={config.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
