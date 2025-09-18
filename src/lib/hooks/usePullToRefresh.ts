"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface PullToRefreshOptions {
  threshold?: number;
  resistance?: number;
  onRefresh?: () => Promise<void> | void;
  disabled?: boolean;
}

export function usePullToRefresh(options: PullToRefreshOptions = {}) {
  const {
    threshold = 80,
    resistance = 2.5,
    onRefresh,
    disabled = false
  } = options;

  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const touchStartY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isAtTop = useRef<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkIfAtTop = useCallback(() => {
    isAtTop.current = window.scrollY <= 0;
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [onRefresh, isRefreshing]);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      checkIfAtTop();
      if (!isAtTop.current) return;
      
      touchStartY.current = e.touches[0].clientY;
      currentY.current = touchStartY.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop.current || isRefreshing) return;
      
      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - touchStartY.current;
      
      if (deltaY > 0) {
        // Pulling down
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setPullDistance(distance);
        setIsPulling(distance > 10);
        
        // Prevent default scroll behavior when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling || isRefreshing) {
        setPullDistance(0);
        setIsPulling(false);
        return;
      }
      
      if (pullDistance >= threshold) {
        handleRefresh();
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    const handleScroll = () => {
      checkIfAtTop();
      if (!isPulling) {
        setPullDistance(0);
      }
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [disabled, isPulling, isRefreshing, pullDistance, threshold, resistance, handleRefresh, checkIfAtTop]);

  const pullToRefreshStyles = {
    transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
    transition: isPulling ? 'none' : 'transform 0.3s ease-out',
  };

  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    pullToRefreshStyles,
    indicatorOpacity,
    shouldTrigger,
    threshold
  };
}