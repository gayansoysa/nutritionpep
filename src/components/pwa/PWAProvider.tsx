'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/utils/service-worker';
import { PWAInstaller } from './PWAInstaller';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker on mount
    if (typeof window !== 'undefined') {
      registerServiceWorker({
        onSuccess: (registration) => {
          console.log('Service Worker registered successfully:', registration);
        },
        onUpdate: (registration) => {
          console.log('Service Worker updated:', registration);
          // You could show a toast here asking user to refresh
        },
        onError: (error) => {
          console.error('Service Worker registration failed:', error);
        },
      });
    }
  }, []);

  return (
    <>
      {children}
      <PWAInstaller />
    </>
  );
}