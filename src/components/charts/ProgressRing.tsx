'use client';

import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ChartOptions, ChartData } from 'chart.js';
import { chartColors, animations } from './ChartConfig';

interface ProgressRingProps {
  value: number;
  target: number;
  label: string;
  unit?: string;
  size?: number;
  color?: string;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export default function ProgressRing({
  value,
  target,
  label,
  unit = '',
  size = 200,
  color = chartColors.primary,
  showPercentage = true,
  animated = true,
  className = '',
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.min((value / target) * 100, 100);
  const remaining = Math.max(0, target - value);

  // Animate the value
  useEffect(() => {
    if (!animated) {
      setAnimatedValue(value);
      return;
    }

    const duration = 1000;
    const steps = 60;
    const stepValue = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setAnimatedValue(stepValue * currentStep);
      
      if (currentStep >= steps) {
        setAnimatedValue(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animated]);

  // Determine color based on progress
  const getProgressColor = () => {
    if (percentage >= 100) return chartColors.success;
    if (percentage >= 80) return chartColors.warning;
    return color;
  };

  const progressColor = getProgressColor();

  // Chart data
  const chartData: ChartData<'doughnut'> = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [progressColor, 'rgba(0, 0, 0, 0.1)'],
        borderWidth: 0,
      },
    ],
  };

  // Chart options
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    animation: animated ? {
      animateRotate: true,
      duration: 1000,
    } : false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div style={{ width: size, height: size }}>
        <Doughnut data={chartData} options={options} />
      </div>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold">
            {Math.round(animatedValue)}
          </div>
          <div className="text-sm text-muted-foreground">
            {label}
          </div>
          {showPercentage && (
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round(percentage)}%
            </div>
          )}
        </div>
      </div>
      
      {/* Stats below */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <div className="font-semibold" style={{ color: progressColor }}>
              {Math.round(target)}
            </div>
            <div className="text-muted-foreground text-xs">Goal</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">
              {Math.round(remaining)}
            </div>
            <div className="text-muted-foreground text-xs">Left</div>
          </div>
        </div>
      </div>
    </div>
  );
}