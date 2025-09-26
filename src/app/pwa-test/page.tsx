import { PWAStatus } from '@/components/pwa/PWAStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Smartphone, Wifi, Download } from 'lucide-react';

export default function PWATestPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PWA Status & Testing</h1>
        <p className="text-muted-foreground">
          Check the Progressive Web App functionality and installation status
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* PWA Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              PWA Status
            </CardTitle>
            <CardDescription>
              Current Progressive Web App installation and functionality status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PWAStatus />
          </CardContent>
        </Card>

        {/* PWA Features Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              PWA Features
            </CardTitle>
            <CardDescription>
              Progressive Web App capabilities implemented
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Web App Manifest</span>
              <Badge variant="default" className="ml-auto">Ready</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Service Worker</span>
              <Badge variant="default" className="ml-auto">Active</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Offline Caching</span>
              <Badge variant="default" className="ml-auto">Enabled</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">App Icons</span>
              <Badge variant="default" className="ml-auto">Complete</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Install Prompt</span>
              <Badge variant="default" className="ml-auto">Ready</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Background Sync</span>
              <Badge variant="default" className="ml-auto">Ready</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Installation Instructions
            </CardTitle>
            <CardDescription>
              How to install NutritionPep as a Progressive Web App
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Chrome/Edge (Desktop & Mobile)</h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>1. Look for the install icon in the address bar</li>
                <li>2. Click "Install NutritionPep" when prompted</li>
                <li>3. The app will be added to your home screen/app drawer</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Safari (iOS)</h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>1. Tap the Share button in Safari</li>
                <li>2. Scroll down and tap "Add to Home Screen"</li>
                <li>3. Tap "Add" to install the app</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Firefox (Desktop & Mobile)</h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>1. Look for the install icon in the address bar</li>
                <li>2. Click "Install" when the prompt appears</li>
                <li>3. The app will be available in your applications</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* PWA Benefits */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>PWA Benefits</CardTitle>
            <CardDescription>
              Why install NutritionPep as a Progressive Web App
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Native-like Experience</h4>
                <p className="text-sm text-muted-foreground">
                  Runs like a native app with smooth animations and gestures
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Wifi className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Offline Access</h4>
                <p className="text-sm text-muted-foreground">
                  Continue tracking nutrition even without internet connection
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Fast Loading</h4>
                <p className="text-sm text-muted-foreground">
                  Cached resources load instantly for better performance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}