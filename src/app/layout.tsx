import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FloatingNetworkStatus, HeaderNetworkStatus } from "@/components/ui/network-status";
import { QueryProvider } from "@/lib/react-query/provider";
import { LoadingProgress, RouteChangeIndicator } from "@/components/ui/loading-progress";
import { ProfileDropdownServer } from "@/components/navigation/ProfileDropdownServer";

import "./globals.css";

export const metadata = {
  title: "NutritionPep",
  description: "Track your nutrition and reach your health goals",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutritionPep"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000"
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NutritionPep" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
            <RouteChangeIndicator />
            <FloatingNetworkStatus />
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
              <header className="border-b border-border/50 bg-background/95 backdrop-blur-lg sticky top-0 z-50">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <div className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    NutritionPep
                  </div>
                </div>
                <nav className="flex items-center gap-4">
                  {user ? (
                    <>
                      <a href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                        Dashboard
                      </a>
                      <HeaderNetworkStatus />
                      <ProfileDropdownServer />
                    </>
                  ) : (
                    <>
                      <a href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                        Login
                      </a>
                      <HeaderNetworkStatus />
                    </>
                  )}
                </nav>
              </div>
              </header>
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
            </ErrorBoundary>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}