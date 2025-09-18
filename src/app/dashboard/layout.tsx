import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { ModeToggle } from "@/components/mode-toggle";
import BottomTabs from "./(components)/BottomTabs";
import { PullToRefreshWrapper } from "./(components)/PullToRefreshWrapper";
import { TransitionLayout } from "@/components/layout/TransitionLayout";

export default async function DashboardLayout({
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col h-full">
      <PullToRefreshWrapper>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Track your nutrition journey</p>
            </div>
          </div>
          
          {/* Desktop Tabs */}
          <div className="hidden sm:flex border-b border-border/50 mb-6">
            <nav className="flex gap-6">
              <a 
                href="/dashboard/today"
                className="py-3 px-1 border-b-2 border-primary font-medium text-sm text-primary bg-primary/5 rounded-t-lg transition-all"
              >
                Today
              </a>
              <a 
                href="/dashboard/history"
                className="py-3 px-1 border-b-2 border-transparent hover:border-primary/30 text-muted-foreground hover:text-foreground font-medium text-sm transition-all"
              >
                History
              </a>
              <a 
                href="/dashboard/analytics"
                className="py-3 px-1 border-b-2 border-transparent hover:border-primary/30 text-muted-foreground hover:text-foreground font-medium text-sm transition-all"
              >
                Analytics
              </a>
              <a 
                href="/recipes"
                className="py-3 px-1 border-b-2 border-transparent hover:border-primary/30 text-muted-foreground hover:text-foreground font-medium text-sm transition-all"
              >
                Recipes
              </a>
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="pb-20 sm:pb-0">
            <TransitionLayout>
              {children}
            </TransitionLayout>
          </div>
        </div>
      </PullToRefreshWrapper>
      
      {/* Mobile Bottom Tabs */}
      <BottomTabs />
    </div>
  );
}