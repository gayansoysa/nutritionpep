'use client';

import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions, ChartData } from 'chart.js';
import { commonOptions, chartColors, animations } from './ChartConfig';

interface DataPoint {
  date: string;
  value: number;
  target?: number;
}

interface EnhancedLineChartProps {
  data: DataPoint[];
  title?: string;
  dataKey: string;
  color?: string;
  unit?: string;
  showTarget?: boolean;
  height?: number;
  animated?: boolean;
  exportable?: boolean;
  onDataPointClick?: (point: DataPoint, index: number) => void;
}

export default function EnhancedLineChart({
  data,
  title,
  dataKey,
  color = chartColors.primary,
  unit = '',
  showTarget = true,
  height = 300,
  animated = true,
  exportable = false,
  onDataPointClick,
}: EnhancedLineChartProps) {
  const chartRef = useRef<any>(null);

  // Prepare chart data
  const chartData: ChartData<'line'> = {
    labels: data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: title || dataKey,
        data: data.map(d => d.value),
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
      ...(showTarget && data.some(d => d.target) ? [{
        label: 'Target',
        data: data.map(d => d.target || null),
        borderColor: chartColors.secondary,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: chartColors.secondary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }] : []),
    ],
  };

  // Chart options
  const options: ChartOptions<'line'> = {
    ...commonOptions,
    animation: animated ? animations.smooth : false,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !!title,
        text: title,
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
            return `${label}: ${Math.round(value)}${unit}`;
          },
          afterLabel: (context) => {
            const dataIndex = context.dataIndex;
            const point = data[dataIndex];
            if (point.target && context.datasetIndex === 0) {
              const diff = point.value - point.target;
              const percentage = ((diff / point.target) * 100).toFixed(1);
              return `Target: ${Math.round(point.target)}${unit} (${diff > 0 ? '+' : ''}${percentage}%)`;
            }
            return '';
          },
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onDataPointClick) {
        const index = elements[0].index;
        onDataPointClick(data[index], index);
      }
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales?.y,
        beginAtZero: false,
        ticks: {
          ...commonOptions.scales?.y?.ticks,
          callback: (value) => `${Math.round(Number(value))}${unit}`,
        },
      },
    },
  };

  // Export functionality
  const exportChart = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title || dataKey}-chart.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="relative">
      {exportable && (
        <button
          onClick={exportChart}
          className="absolute top-2 right-2 z-10 px-3 py-1 text-xs bg-background border rounded-md hover:bg-muted transition-colors"
        >
          Export
        </button>
      )}
      <div style={{ height: `${height}px` }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}