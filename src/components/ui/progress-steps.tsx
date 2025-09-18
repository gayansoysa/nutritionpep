"use client";

import { ReactNode } from 'react';
import { Check, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  className?: string;
}

export function ProgressSteps({
  steps,
  currentStep,
  completedSteps = [],
  orientation = 'horizontal',
  showLabels = true,
  className = ''
}: ProgressStepsProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={`${className} ${isHorizontal ? 'w-full' : 'h-full'}`}>
      <div className={`flex ${isHorizontal ? 'flex-row items-center' : 'flex-col items-start'} ${
        isHorizontal ? 'justify-between' : 'space-y-4'
      }`}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber) || stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div
              key={step.id}
              className={`flex ${isHorizontal ? 'flex-col items-center' : 'flex-row items-center'} ${
                isHorizontal ? 'flex-1' : 'w-full'
              }`}
            >
              {/* Step indicator */}
              <div className="relative flex items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted 
                      ? 'rgb(34, 197, 94)' // green-500
                      : isCurrent 
                        ? 'rgb(59, 130, 246)' // blue-500
                        : 'rgb(156, 163, 175)' // gray-400
                  }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : isCurrent
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </motion.div>

                {/* Progress line */}
                {index < steps.length - 1 && (
                  <div
                    className={`${
                      isHorizontal
                        ? 'absolute left-full top-1/2 transform -translate-y-1/2 w-full h-0.5'
                        : 'absolute top-full left-1/2 transform -translate-x-1/2 h-full w-0.5'
                    } ${
                      isHorizontal ? 'ml-2' : 'mt-2'
                    }`}
                  >
                    <div className={`${isHorizontal ? 'h-full' : 'w-full'} bg-gray-200 relative overflow-hidden`}>
                      <motion.div
                        initial={{ [isHorizontal ? 'width' : 'height']: '0%' }}
                        animate={{
                          [isHorizontal ? 'width' : 'height']: isCompleted ? '100%' : '0%'
                        }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={`${isHorizontal ? 'h-full' : 'w-full'} bg-green-500`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step labels */}
              {showLabels && (
                <div className={`${isHorizontal ? 'mt-3 text-center' : 'ml-4 text-left'} ${
                  isHorizontal ? 'max-w-[120px]' : 'flex-1'
                }`}>
                  <motion.h3
                    animate={{
                      color: isCurrent 
                        ? 'rgb(59, 130, 246)' // blue-500
                        : isCompleted
                          ? 'rgb(34, 197, 94)' // green-500
                          : 'rgb(107, 114, 128)' // gray-500
                    }}
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </motion.h3>
                  {step.description && (
                    <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Circular progress indicator
export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  className = ''
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="text-blue-500"
          strokeLinecap="round"
        />
      </svg>
      {/* Progress text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-semibold text-gray-700">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// Linear progress bar
export function LinearProgress({
  progress,
  showPercentage = true,
  className = '',
  color = 'blue'
}: {
  progress: number;
  showPercentage?: boolean;
  className?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${colorClasses[color]} rounded-full`}
        />
      </div>
    </div>
  );
}