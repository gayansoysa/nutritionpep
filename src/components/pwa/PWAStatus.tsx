'use client';

import { usePWAInstall } from './PWAInstaller';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';

export function PWAStatus() {
  const { canInstall, isInstalled } = usePWAInstall();
  const { isOnline, isSlowConnection } = useNetworkStatus();

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">App Status</span>
          </div>
          <div className="flex items-center gap-2">
            {isInstalled ? (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Installed
              </Badge>
            ) : canInstall ? (
              <Badge variant="secondary">
                Can Install
              </Badge>
            ) : (
              <Badge variant="outline">
                Web App
              </Badge>
            )}
            
            {isOnline ? (
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">
                  {isSlowConnection ? 'Slow' : 'Online'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <WifiOff className="h-3 w-3 text-red-600" />
                <span className="text-xs text-red-600">Offline</span>
              </div>
            )}
          </div>
        </div>
        
        {!isInstalled && (
          <p className="text-xs text-muted-foreground mt-2">
            Install the app for better performance and offline access
          </p>
        )}
      </CardContent>
    </Card>
  );
}