"use client";

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  loadTime: number;
  renderCount: number;
}

export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>(performance.now());
  const renderCount = useRef<number>(0);
  const hasLogged = useRef<boolean>(false);

  useEffect(() => {
    renderCount.current += 1;
  });

  useEffect(() => {
    if (!hasLogged.current) {
      const loadTime = performance.now() - startTime.current;
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 Performance Monitor - ${componentName}:`, {
          loadTime: `${loadTime.toFixed(2)}ms`,
          renderCount: renderCount.current,
          timestamp: new Date().toISOString()
        });
      }

      // Store metrics for potential analytics
      if (typeof window !== 'undefined') {
        const metrics: PerformanceMetrics = {
          componentName,
          loadTime,
          renderCount: renderCount.current
        };
        
        // Store in sessionStorage for debugging
        const existingMetrics = JSON.parse(
          sessionStorage.getItem('np_performance_metrics') || '[]'
        );
        existingMetrics.push(metrics);
        sessionStorage.setItem('np_performance_metrics', JSON.stringify(existingMetrics));
      }

      hasLogged.current = true;
    }
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    getLoadTime: () => performance.now() - startTime.current
  };
}

// Utility function to get all performance metrics
export function getPerformanceMetrics(): PerformanceMetrics[] {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(sessionStorage.getItem('np_performance_metrics') || '[]');
  } catch {
    return [];
  }
}

// Utility function to clear performance metrics
export function clearPerformanceMetrics(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('np_performance_metrics');
  }
}