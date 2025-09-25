'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType: string | null
  effectiveType: string | null
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: null,
    effectiveType: null
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      const isOnline = navigator.onLine
      const isSlowConnection = connection ? 
        ['slow-2g', '2g'].includes(connection.effectiveType) : false

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        connectionType: connection?.type || null,
        effectiveType: connection?.effectiveType || null
      })
    }

    const handleOnline = () => {
      updateNetworkStatus()
      toast.success('Connection restored')
    }

    const handleOffline = () => {
      updateNetworkStatus()
      toast.error('Connection lost. Some features may not work.')
    }

    const handleConnectionChange = () => {
      updateNetworkStatus()
    }

    // Initial status
    updateNetworkStatus()

    // Event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  return networkStatus
}

// Hook for showing network status indicator
export function useNetworkIndicator() {
  const networkStatus = useNetworkStatus()
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    if (!networkStatus.isOnline || networkStatus.isSlowConnection) {
      setShowIndicator(true)
    } else {
      // Hide indicator after a delay when connection is restored
      const timer = setTimeout(() => setShowIndicator(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [networkStatus.isOnline, networkStatus.isSlowConnection])

  return {
    ...networkStatus,
    showIndicator
  }
}