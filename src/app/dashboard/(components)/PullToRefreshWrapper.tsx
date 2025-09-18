"use client";

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

interface PullToRefreshWrapperProps {
  children: ReactNode;
}

export function PullToRefreshWrapper({ children }: PullToRefreshWrapperProps) {
  const router = useRouter();

  const handleRefresh = async () => {
    // Refresh the current page
    router.refresh();
    
    // Add a small delay to show the refresh animation
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {children}
    </PullToRefresh>
  );
}