import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlusIcon, CalendarIcon, TargetIcon } from "@radix-ui/react-icons";
import TodayClient from "./TodayClient";
import MealSections from "./MealSections";
import SmartSuggestions from "../(components)/SmartSuggestions";
import { QuickAddFavorites } from "@/components/ui/quick-add-favorites";

export default async function TodayPage() {
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
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);

  // Get user's targets for today
  const { data: targets } = await supabase
    .from("targets")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  // Get diary entries for today
  const { data: entries } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("created_at", { ascending: false });

  // Calculate consumed totals
  const consumed = {
    calories_kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
  };

  (entries || []).forEach((entry) => {
    if (entry.totals) {
      consumed.calories_kcal += Number(entry.totals.calories_kcal || 0);
      consumed.protein_g += Number(entry.totals.protein_g || 0);
      consumed.carbs_g += Number(entry.totals.carbs_g || 0);
      consumed.fat_g += Number(entry.totals.fat_g || 0);
      consumed.fiber_g += Number(entry.totals.fiber_g || 0);
    }
  });

  // Default targets if none set
  const defaultTargets = {
    calories_kcal: 2000,
    protein_g: 100,
    carbs_g: 250,
    fat_g: 70,
    fiber_g: 30,
  };

  const userTargets = targets || defaultTargets;

  const caloriesProgress = (consumed.calories_kcal / userTargets.calories_kcal) * 100;
  const remaining = Math.max(0, userTargets.calories_kcal - consumed.calories_kcal);

  return (
    <div className="space-y-6">
      {/* Header with Date */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold">Today</h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        <Button size="sm" asChild className="shadow-sm">
          <a href="/dashboard/search">
            <PlusIcon className="mr-1 h-4 w-4" /> Add Food
          </a>
        </Button>
      </div>

      {/* Main Calories Card - iOS Health Style */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(caloriesProgress * 3.14, 314)} 314`}
                  className="text-primary transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold">{Math.round(consumed.calories_kcal)}</div>
                <div className="text-sm text-muted-foreground">calories</div>
              </div>
            </div>
            
            <div className="flex justify-center gap-8 text-sm">
              <div className="text-center">
                <div className="font-semibold text-primary">{Math.round(userTargets.calories_kcal)}</div>
                <div className="text-muted-foreground">Goal</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{Math.round(remaining)}</div>
                <div className="text-muted-foreground">Remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macros Grid - Inspired by Cronometer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow p-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-medium">Protein</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(consumed.protein_g)}g
              </span>
            </div>
            <Progress 
              value={(consumed.protein_g / userTargets.protein_g) * 100} 
              className="h-2 mb-2"
            />
            <div className="text-xs text-muted-foreground">
              Goal: {Math.round(userTargets.protein_g)}g
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow p-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium">Carbs</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(consumed.carbs_g)}g
              </span>
            </div>
            <Progress 
              value={(consumed.carbs_g / userTargets.carbs_g) * 100} 
              className="h-2 mb-2"
            />
            <div className="text-xs text-muted-foreground">
              Goal: {Math.round(userTargets.carbs_g)}g
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow p-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="font-medium">Fat</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(consumed.fat_g)}g
              </span>
            </div>
            <Progress 
              value={(consumed.fat_g / userTargets.fat_g) * 100} 
              className="h-2 mb-2"
            />
            <div className="text-xs text-muted-foreground">
              Goal: {Math.round(userTargets.fat_g)}g
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Favorites */}
      <QuickAddFavorites />

      {/* Smart Suggestions Section */}
      <SmartSuggestions />

      <MealSections entries={entries || []} />
    </div>
  );
}