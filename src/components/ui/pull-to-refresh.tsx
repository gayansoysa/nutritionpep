"use client";

import { ReactNode } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  threshold?: number;
  resistance?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  resistance = 2.5
}: PullToRefreshProps) {
  const {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    pullToRefreshStyles,
    indicatorOpacity,
    shouldTrigger
  } = usePullToRefresh({
    threshold,
    resistance,
    onRefresh,
    disabled
  });

  return (
    <div ref={containerRef} className="relative">
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
        style={{
          transform: `translateY(-${threshold}px)`,
          opacity: indicatorOpacity,
          height: `${threshold}px`
        }}
      >
        <div className={`flex flex-col items-center transition-all duration-200 ${
          shouldTrigger ? 'scale-110' : 'scale-100'
        }`}>
          <div className={`p-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 transition-all duration-300 ${
            isRefreshing ? 'animate-spin' : shouldTrigger ? 'rotate-180' : 'rotate-0'
          }`}>
            {isRefreshing ? (
              <RefreshCw className="h-5 w-5 text-primary" />
            ) : (
              <ArrowDown className="h-5 w-5 text-primary" />
            )}
          </div>
          <span className="text-xs text-primary font-medium mt-1">
            {isRefreshing 
              ? 'Refreshing...' 
              : shouldTrigger 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </span>
        </div>
      </div>

      {/* Content container */}
      <div style={pullToRefreshStyles}>
        {children}
      </div>
    </div>
  );
}