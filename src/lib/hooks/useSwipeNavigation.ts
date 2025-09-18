"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SwipeNavigationOptions {
  threshold?: number;
  velocity?: number;
  preventScroll?: boolean;
}

interface TabRoute {
  href: string;
  name: string;
}

export function useSwipeNavigation(
  tabs: TabRoute[],
  currentPath: string,
  options: SwipeNavigationOptions = {}
) {
  const router = useRouter();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  
  const {
    threshold = 50,
    velocity = 0.3,
    preventScroll = false
  } = options;

  const getCurrentTabIndex = () => {
    return tabs.findIndex(tab => 
      currentPath === tab.href || currentPath.startsWith(`${tab.href}/`)
    );
  };

  const navigateToTab = (direction: 'left' | 'right') => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'left') {
      // Swipe left = next tab
      newIndex = currentIndex + 1;
      if (newIndex >= tabs.length) newIndex = 0; // Loop to first
    } else {
      // Swipe right = previous tab
      newIndex = currentIndex - 1;
      if (newIndex < 0) newIndex = tabs.length - 1; // Loop to last
    }

    router.push(tabs[newIndex].href);
  };

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchStartTime.current = Date.now();
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Determine if this is a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isSwiping.current = true;
        
        if (preventScroll) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX.current || !isSwiping.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      const deltaTime = Date.now() - touchStartTime.current;
      
      // Calculate velocity (pixels per millisecond)
      const velocityX = Math.abs(deltaX) / deltaTime;
      
      // Check if swipe meets threshold and velocity requirements
      const isValidSwipe = Math.abs(deltaX) > threshold && 
                          Math.abs(deltaX) > Math.abs(deltaY) && 
                          velocityX > velocity;

      if (isValidSwipe) {
        if (deltaX > 0) {
          // Swipe right
          navigateToTab('right');
        } else {
          // Swipe left
          navigateToTab('left');
        }
      }

      // Reset
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchStartTime.current = 0;
      isSwiping.current = false;
    };

    // Add event listeners to the document
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentPath, tabs, threshold, velocity, preventScroll]);

  return {
    getCurrentTabIndex,
    navigateToTab,
    isSwiping: isSwiping.current
  };
}