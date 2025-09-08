import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
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
    data: { session },
  } = await supabase.auth.getSession();

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold">NutritionPep</h1>
          <p className="mt-2 text-xl text-muted-foreground">
            Track your nutrition, reach your goals
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Track</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Log your meals and track your daily nutrition with ease
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Analyze</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                See your progress and patterns with detailed charts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Quickly add foods by scanning barcodes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Achieve</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Reach your nutrition goals with personalized targets
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Button size="lg" asChild>
            <a href="/login">Get Started</a>
          </Button>
        </div>
      </div>
    </div>
  );
}