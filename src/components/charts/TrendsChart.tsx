'use client';

import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions, ChartData } from 'chart.js';
import { commonOptions, chartColors, animations } from './ChartConfig';

interface TrendDataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight?: number;
}

interface TrendsChartProps {
  data: TrendDataPoint[];
  period: 'week' | 'month' | 'quarter';
  metrics: ('calories' | 'protein' | 'carbs' | 'fat' | 'weight')[];
  showMovingAverage?: boolean;
  height?: number;
  animated?: boolean;
}

export default function TrendsChart({
  data,
  period,
  metrics,
  showMovingAverage = true,
  height = 400,
  animated = true,
}: TrendsChartProps) {
  // Calculate moving averages
  const calculateMovingAverage = (values: number[], windowSize: number) => {
    const result: (number | null)[] = [];
    for (let i = 0; i < values.length; i++) {
      if (i < windowSize - 1) {
        result.push(null);
      } else {
        const sum = values.slice(i - windowSize + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / windowSize);
      }
    }
    return result;
  };

  const windowSize = period === 'week' ? 3 : period === 'month' ? 7 : 14;

  // Prepare chart data
  const chartData: ChartData<'line'> = useMemo(() => {
    const labels = data.map(d => {
      const date = new Date(d.date);
      return period === 'week' 
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const datasets = [];

    // Add main metric lines
    metrics.forEach(metric => {
      const values = data.map(d => d[metric] || 0);
      const color = chartColors[metric as keyof typeof chartColors] || chartColors.primary;
      
      datasets.push({
        label: metric.charAt(0).toUpperCase() + metric.slice(1),
        data: values,
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: metric === 'weight' ? 'y1' : 'y',
      });

      // Add moving average if enabled
      if (showMovingAverage && data.length > windowSize) {
        const movingAvg = calculateMovingAverage(values, windowSize);
        datasets.push({
          label: `${metric} (${windowSize}-day avg)`,
          data: movingAvg,
          borderColor: `${color}80`,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 3,
          yAxisID: metric === 'weight' ? 'y1' : 'y',
        });
      }
    });

    return { labels, datasets };
  }, [data, metrics, period, showMovingAverage, windowSize]);

  // Chart options
  const options: ChartOptions<'line'> = {
    ...commonOptions,
    animation: animated ? animations.smooth : false,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: `Nutrition Trends - ${period.charAt(0).toUpperCase() + period.slice(1)}ly View`,
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: 20,
      },
      tooltip: {
        ...commonOptions.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const label = context.dataset.label || '';
            const unit = label.toLowerCase().includes('weight') ? 'kg' : 
                        label.toLowerCase().includes('calories') ? 'kcal' : 'g';
            return `${label}: ${Math.round(value)}${unit}`;
          },
        },
      },
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales?.y,
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Nutrition (g/kcal)',
        },
        ticks: {
          callback: (value) => Math.round(Number(value)),
        },
      },
      ...(metrics.includes('weight') && {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: 'Weight (kg)',
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: (value: any) => `${Math.round(Number(value))}kg`,
          },
        },
      }),
    },
  };

  // Calculate trend statistics
  const trendStats = useMemo(() => {
    if (data.length < 2) return null;

    const stats: Record<string, { change: number; trend: 'up' | 'down' | 'stable' }> = {};
    
    metrics.forEach(metric => {
      const values = data.map(d => d[metric] || 0);
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const change = ((lastValue - firstValue) / firstValue) * 100;
      
      stats[metric] = {
        change,
        trend: Math.abs(change) < 5 ? 'stable' : change > 0 ? 'up' : 'down',
      };
    });

    return stats;
  }, [data, metrics]);

  return (
    <div className="space-y-4">
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>
      
      {/* Trend Statistics */}
      {trendStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map(metric => {
            const stat = trendStats[metric];
            const color = stat.trend === 'up' ? 'text-green-600' : 
                         stat.trend === 'down' ? 'text-red-600' : 'text-gray-600';
            const icon = stat.trend === 'up' ? '↗' : 
                        stat.trend === 'down' ? '↘' : '→';
            
            return (
              <div key={metric} className="text-center p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground capitalize">{metric}</div>
                <div className={`text-lg font-bold ${color}`}>
                  {icon} {Math.abs(stat.change).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}