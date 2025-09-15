'use client';

import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { ChartOptions, ChartData } from 'chart.js';
import { chartColors, animations } from './ChartConfig';

interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

interface MacroBreakdownChartProps {
  consumed: MacroData;
  target: MacroData;
  type?: 'doughnut' | 'bar';
  showCalories?: boolean;
  animated?: boolean;
  height?: number;
}

export default function MacroBreakdownChart({
  consumed,
  target,
  type = 'doughnut',
  showCalories = true,
  animated = true,
  height = 300,
}: MacroBreakdownChartProps) {
  // Calculate calories from macros
  const consumedCalories = (consumed.protein * 4) + (consumed.carbs * 4) + (consumed.fat * 9);
  const targetCalories = (target.protein * 4) + (target.carbs * 4) + (target.fat * 9);

  if (type === 'doughnut') {
    // Doughnut chart for macro distribution
    const chartData: ChartData<'doughnut'> = {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [
        {
          label: 'Consumed',
          data: [consumed.protein * 4, consumed.carbs * 4, consumed.fat * 9],
          backgroundColor: [
            chartColors.protein,
            chartColors.carbs,
            chartColors.fat,
          ],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };

    const options: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: animated ? animations.smooth : false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              const grams = Math.round(value / (label === 'Fat' ? 9 : 4));
              return `${label}: ${grams}g (${percentage}%)`;
            },
          },
        },
      },
    };

    return (
      <div className="space-y-4">
        <div style={{ height: `${height}px` }}>
          <Doughnut data={chartData} options={options} />
        </div>
        
        {showCalories && (
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Math.round(consumedCalories)} / {Math.round(targetCalories)}
            </div>
            <div className="text-sm text-muted-foreground">Calories</div>
          </div>
        )}
      </div>
    );
  }

  // Bar chart for macro comparison
  const chartData: ChartData<'bar'> = {
    labels: ['Protein', 'Carbs', 'Fat', ...(consumed.fiber !== undefined ? ['Fiber'] : [])],
    datasets: [
      {
        label: 'Consumed',
        data: [
          consumed.protein,
          consumed.carbs,
          consumed.fat,
          ...(consumed.fiber !== undefined ? [consumed.fiber] : []),
        ],
        backgroundColor: [
          chartColors.protein,
          chartColors.carbs,
          chartColors.fat,
          ...(consumed.fiber !== undefined ? [chartColors.fiber] : []),
        ],
        borderRadius: 4,
      },
      {
        label: 'Target',
        data: [
          target.protein,
          target.carbs,
          target.fat,
          ...(target.fiber !== undefined ? [target.fiber] : []),
        ],
        backgroundColor: [
          `${chartColors.protein}40`,
          `${chartColors.carbs}40`,
          `${chartColors.fat}40`,
          ...(target.fiber !== undefined ? [`${chartColors.fiber}40`] : []),
        ],
        borderColor: [
          chartColors.protein,
          chartColors.carbs,
          chartColors.fat,
          ...(target.fiber !== undefined ? [chartColors.fiber] : []),
        ],
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animated ? animations.smooth : false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${Math.round(value)}g`;
          },
          afterLabel: (context) => {
            if (context.dataset.label === 'Consumed') {
              const macroIndex = context.dataIndex;
              const macroNames = ['protein', 'carbs', 'fat', 'fiber'];
              const macroName = macroNames[macroIndex] as keyof MacroData;
              const targetValue = target[macroName];
              
              if (targetValue) {
                const diff = context.parsed.y - targetValue;
                const percentage = ((diff / targetValue) * 100).toFixed(1);
                return `Target: ${Math.round(targetValue)}g (${diff > 0 ? '+' : ''}${percentage}%)`;
              }
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}g`,
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div style={{ height: `${height}px` }}>
        <Bar data={chartData} options={options} />
      </div>
      
      {showCalories && (
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold">{Math.round(consumedCalories)}</div>
            <div className="text-sm text-muted-foreground">Consumed</div>
          </div>
          <div>
            <div className="text-lg font-bold">{Math.round(targetCalories)}</div>
            <div className="text-sm text-muted-foreground">Target</div>
          </div>
        </div>
      )}
    </div>
  );
}