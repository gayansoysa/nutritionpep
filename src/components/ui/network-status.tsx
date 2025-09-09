'use client'

import { useNetworkIndicator } from '@/lib/hooks/useNetworkStatus'
import { Wifi, WifiOff, Signal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface NetworkStatusProps {
  className?: string
  showText?: boolean
  variant?: 'badge' | 'icon' | 'full'
}

export function NetworkStatus({ 
  className, 
  showText = true, 
  variant = 'badge' 
}: NetworkStatusProps) {
  const { isOnline, isSlowConnection, effectiveType, showIndicator } = useNetworkIndicator()

  if (!showIndicator && isOnline && !isSlowConnection) {
    return null
  }

  const getStatusColor = () => {
    if (!isOnline) return 'destructive'
    if (isSlowConnection) return 'secondary'
    return 'default'
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (isSlowConnection) return `Slow (${effectiveType})`
    return 'Online'
  }

  const getIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />
    if (isSlowConnection) return <Signal className="h-3 w-3" />
    return <Wifi className="h-3 w-3" />
  }

  if (variant === 'icon') {
    return (
      <div className={cn(
        "flex items-center justify-center p-1 rounded-full",
        !isOnline ? "text-destructive" : isSlowConnection ? "text-warning" : "text-muted-foreground",
        className
      )}>
        {getIcon()}
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border",
        !isOnline 
          ? "bg-destructive/10 border-destructive/20 text-destructive" 
          : isSlowConnection 
            ? "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200"
            : "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
        className
      )}>
        {getIcon()}
        {showText && (
          <span className="text-sm font-medium">
            {getStatusText()}
          </span>
        )}
        {!isOnline && (
          <span className="text-xs opacity-75">
            Some features won't work
          </span>
        )}
      </div>
    )
  }

  // Default badge variant
  return (
    <Badge 
      variant={getStatusColor()}
      className={cn("flex items-center gap-1", className)}
    >
      {getIcon()}
      {showText && (
        <span className="text-xs">
          {getStatusText()}
        </span>
      )}
    </Badge>
  )
}

// Floating network status indicator for global use
export function FloatingNetworkStatus() {
  const { isOnline, isSlowConnection, showIndicator } = useNetworkIndicator()

  if (!showIndicator) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2">
      <NetworkStatus variant="full" />
    </div>
  )
}

// Header network status indicator
export function HeaderNetworkStatus() {
  const { isOnline, isSlowConnection } = useNetworkIndicator()

  if (isOnline && !isSlowConnection) return null

  return (
    <NetworkStatus 
      variant="badge" 
      showText={false}
      className="ml-2"
    />
  )
}