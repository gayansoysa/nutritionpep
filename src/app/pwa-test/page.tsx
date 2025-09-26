'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Smartphone, Download, Wifi, WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus'

interface PWAStatus {
  isInstallable: boolean
  isInstalled: boolean
  isStandalone: boolean
  hasServiceWorker: boolean
  hasManifest: boolean
  supportsNotifications: boolean
  isOnline: boolean
}

export default function PWATestPage() {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    hasServiceWorker: false,
    hasManifest: false,
    supportsNotifications: false,
    isOnline: true
  })
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installPromptShown, setInstallPromptShown] = useState(false)
  const networkStatus = useNetworkStatus()

  useEffect(() => {
    checkPWAStatus()
    
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setPwaStatus(prev => ({ ...prev, isInstallable: true }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const checkPWAStatus = async () => {
    const status: PWAStatus = {
      isInstallable: false,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasManifest: false,
      supportsNotifications: 'Notification' in window,
      isOnline: navigator.onLine
    }

    // Check if manifest is accessible
    try {
      const response = await fetch('/manifest.json')
      status.hasManifest = response.ok
    } catch (error) {
      status.hasManifest = false
    }

    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        status.hasServiceWorker = !!registration
      } catch (error) {
        status.hasServiceWorker = false
      }
    }

    setPwaStatus(status)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('Install prompt not available. Try adding to home screen manually.')
      return
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setPwaStatus(prev => ({ ...prev, isInstalled: true }))
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setInstallPromptShown(true)
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  const StatusIcon = ({ condition }: { condition: boolean }) => {
    return condition ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return (
        <div className="space-y-2 text-sm">
          <p className="font-medium">iOS Safari Installation:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Tap the Share button (square with arrow up)</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" to confirm</li>
          </ol>
        </div>
      )
    } else if (userAgent.includes('android')) {
      return (
        <div className="space-y-2 text-sm">
          <p className="font-medium">Android Chrome Installation:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Tap the menu (three dots)</li>
            <li>Tap "Add to Home screen" or "Install app"</li>
            <li>Tap "Add" or "Install" to confirm</li>
          </ol>
        </div>
      )
    } else {
      return (
        <div className="space-y-2 text-sm">
          <p className="font-medium">Desktop Installation:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Look for an install icon in the address bar</li>
            <li>Or use browser menu → "Install NutritionPep"</li>
            <li>Click "Install" to confirm</li>
          </ol>
        </div>
      )
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">PWA Status Test</h1>
        <p className="text-muted-foreground">
          Check if NutritionPep is working as a Progressive Web App
        </p>
      </div>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {networkStatus.isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Online</span>
            <Badge variant={networkStatus.isOnline ? "default" : "destructive"}>
              {networkStatus.isOnline ? "Connected" : "Offline"}
            </Badge>
          </div>
          {networkStatus.effectiveType && (
            <div className="flex items-center justify-between">
              <span>Connection Type</span>
              <Badge variant="outline">{networkStatus.effectiveType}</Badge>
            </div>
          )}
          {networkStatus.isSlowConnection && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Slow connection detected</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PWA Features Status */}
      <Card>
        <CardHeader>
          <CardTitle>PWA Features</CardTitle>
          <CardDescription>
            Check which PWA features are available and working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon condition={pwaStatus.hasManifest} />
                <span>Web App Manifest</span>
              </div>
              <Badge variant={pwaStatus.hasManifest ? "default" : "destructive"}>
                {pwaStatus.hasManifest ? "Available" : "Missing"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon condition={pwaStatus.hasServiceWorker} />
                <span>Service Worker</span>
              </div>
              <Badge variant={pwaStatus.hasServiceWorker ? "default" : "destructive"}>
                {pwaStatus.hasServiceWorker ? "Registered" : "Not Found"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon condition={pwaStatus.isStandalone} />
                <span>Standalone Mode</span>
              </div>
              <Badge variant={pwaStatus.isStandalone ? "default" : "secondary"}>
                {pwaStatus.isStandalone ? "Active" : "Browser Mode"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon condition={pwaStatus.supportsNotifications} />
                <span>Notifications</span>
              </div>
              <Badge variant={pwaStatus.supportsNotifications ? "default" : "destructive"}>
                {pwaStatus.supportsNotifications ? "Supported" : "Not Supported"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon condition={pwaStatus.isInstallable || pwaStatus.isInstalled} />
                <span>Installable</span>
              </div>
              <Badge variant={pwaStatus.isInstallable || pwaStatus.isInstalled ? "default" : "secondary"}>
                {pwaStatus.isInstalled ? "Installed" : pwaStatus.isInstallable ? "Available" : "Not Ready"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            App Installation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pwaStatus.isInstalled ? (
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-lg font-medium">App is installed!</p>
              <p className="text-muted-foreground">
                You're running NutritionPep as a standalone app.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pwaStatus.isInstallable && deferredPrompt ? (
                <div className="text-center space-y-4">
                  <Download className="h-12 w-12 text-blue-500 mx-auto" />
                  <p className="text-lg font-medium">Ready to install!</p>
                  <Button onClick={handleInstall} size="lg" className="w-full">
                    Install NutritionPep
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
                  <div className="text-center">
                    <p className="text-lg font-medium">Manual Installation</p>
                    <p className="text-muted-foreground">
                      Use your browser's install option or add to home screen.
                    </p>
                  </div>
                  {getInstallInstructions()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div>User Agent: {navigator.userAgent}</div>
            <div>Display Mode: {window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'}</div>
            <div>Online: {navigator.onLine ? 'true' : 'false'}</div>
            <div>Service Worker Support: {'serviceWorker' in navigator ? 'true' : 'false'}</div>
            <div>Notification Support: {'Notification' in window ? 'true' : 'false'}</div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={checkPWAStatus} variant="outline">
          Refresh Status
        </Button>
      </div>
    </div>
  )
}