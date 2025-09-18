import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TrendingUpIcon, TargetIcon, AwardIcon } from "lucide-react";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
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

  // Get last 30 days of data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  // Get diary entries for the period
  const { data: entries } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", today)
    .order("date", { ascending: true });

  // Get targets for the period
  const { data: targets } = await supabase
    .from("targets")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", today)
    .order("date", { ascending: true });

  // Process data for analytics
  const dailyData = [];
  const dateMap = new Map();

  // Initialize all dates
  for (let d = new Date(startDate); d <= new Date(today); d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    dateMap.set(dateStr, {
      date: dateStr,
      consumed: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      target: null,
    });
  }

  // Add consumed data
  (entries || []).forEach(entry => {
    const dateData = dateMap.get(entry.date);
    if (dateData && entry.totals) {
      dateData.consumed.calories += Number(entry.totals.calories_kcal || 0);
      dateData.consumed.protein += Number(entry.totals.protein_g || 0);
      dateData.consumed.carbs += Number(entry.totals.carbs_g || 0);
      dateData.consumed.fat += Number(entry.totals.fat_g || 0);
      dateData.consumed.fiber += Number(entry.totals.fiber_g || 0);
    }
  });

  // Add target data
  (targets || []).forEach(target => {
    const dateData = dateMap.get(target.date);
    if (dateData) {
      dateData.target = {
        calories: Number(target.calories_kcal || 2000),
        protein: Number(target.protein_g || 100),
        carbs: Number(target.carbs_g || 250),
        fat: Number(target.fat_g || 70),
        fiber: Number(target.fiber_g || 30),
      };
    }
  });

  // Convert to array
  for (const data of dateMap.values()) {
    dailyData.push(data);
  }

  // Calculate streak and achievements data
  const today_data = dateMap.get(today);
  const currentStreak = calculateStreak(dailyData);
  const weeklyConsistency = calculateWeeklyConsistency(dailyData.slice(-7));
  const goalsMetToday = today_data ? calculateGoalsMet(today_data) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <TrendingUpIcon className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your nutrition progress and trends</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <CalendarIcon className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{weeklyConsistency}%</div>
            <div className="text-sm text-muted-foreground">Weekly Consistency</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{goalsMetToday}/4</div>
            <div className="text-sm text-muted-foreground">Goals Met Today</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(dailyData.reduce((sum, d) => sum + d.consumed.calories, 0) / dailyData.length)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Daily Calories</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <AnalyticsClient 
        dailyData={dailyData}
        currentStreak={currentStreak}
        weeklyConsistency={weeklyConsistency}
        goalsMetToday={goalsMetToday}
      />
    </div>
  );
}

function calculateStreak(dailyData: any[]): number {
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  
  for (let i = dailyData.length - 1; i >= 0; i--) {
    const data = dailyData[i];
    if (data.date > today) continue;
    
    const hasLogged = data.consumed.calories > 0;
    if (hasLogged) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateWeeklyConsistency(weekData: any[]): number {
  const daysWithData = weekData.filter(d => d.consumed.calories > 0).length;
  return Math.round((daysWithData / 7) * 100);
}

function calculateGoalsMet(dayData: any): number {
  if (!dayData.target) return 0;
  
  let goalsMet = 0;
  const tolerance = 0.1; // 10% tolerance
  
  ['calories', 'protein', 'carbs', 'fat'].forEach(nutrient => {
    const consumed = dayData.consumed[nutrient];
    const target = dayData.target[nutrient];
    
    if (consumed >= target * (1 - tolerance) && consumed <= target * (1 + tolerance)) {
      goalsMet++;
    }
  });
  
  return goalsMet;
}