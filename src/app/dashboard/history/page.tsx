import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import HistoryChart from "./HistoryChart";

export default async function HistoryPage() {
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

  // Get targets for the period
  const { data: targets } = await supabase
    .from("targets")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", today)
    .order("date", { ascending: true });

  // Get diary entries for the period
  const { data: entries } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", today)
    .order("date", { ascending: true });

  // Get recent biometrics
  const { data: biometrics } = await supabase
    .from("biometrics")
    .select("*")
    .eq("user_id", user.id)
    .gte("ts", thirtyDaysAgo.toISOString())
    .order("ts", { ascending: false })
    .limit(10);

  // Process data for charts
  const dailyData = [];
  const dateMap = new Map();

  // Group entries by date
  (entries || []).forEach(entry => {
    if (!dateMap.has(entry.date)) {
      dateMap.set(entry.date, {
        date: entry.date,
        consumed: { calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
        target: null
      });
    }
    
    const dayData = dateMap.get(entry.date);
    if (entry.totals) {
      dayData.consumed.calories_kcal += Number(entry.totals.calories_kcal || 0);
      dayData.consumed.protein_g += Number(entry.totals.protein_g || 0);
      dayData.consumed.carbs_g += Number(entry.totals.carbs_g || 0);
      dayData.consumed.fat_g += Number(entry.totals.fat_g || 0);
      dayData.consumed.fiber_g += Number(entry.totals.fiber_g || 0);
    }
  });

  // Add targets
  (targets || []).forEach(target => {
    if (!dateMap.has(target.date)) {
      dateMap.set(target.date, {
        date: target.date,
        consumed: { calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
        target: null
      });
    }
    
    const dayData = dateMap.get(target.date);
    dayData.target = {
      calories_kcal: target.calories_kcal,
      protein_g: target.protein_g,
      carbs_g: target.carbs_g,
      fat_g: target.fat_g,
      fiber_g: target.fiber_g
    };
  });

  // Convert to array and sort
  const chartData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate streaks and stats
  const loggedDays = chartData.filter(d => d.consumed.calories_kcal > 0).length;
  const avgCalories = loggedDays > 0 ? 
    chartData.reduce((sum, d) => sum + d.consumed.calories_kcal, 0) / loggedDays : 0;

  // Recent weight trend
  const weightTrend = biometrics && biometrics.length >= 2 ? 
    biometrics[0].weight_kg - biometrics[biometrics.length - 1].weight_kg : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">History</h2>
        <Badge variant="outline" className="gap-1">
          <CalendarIcon className="h-3 w-3" />
          Last 30 days
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days Logged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loggedDays}</div>
            <p className="text-xs text-muted-foreground">
              out of 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgCalories)}</div>
            <p className="text-xs text-muted-foreground">
              kcal per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weight Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {weightTrend > 0 ? '+' : ''}{weightTrend.toFixed(1)}kg
              </div>
              {weightTrend !== 0 && (
                weightTrend > 0 ? 
                  <ArrowUpIcon className="h-4 w-4 text-green-500" /> :
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="calories" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calories">Calories</TabsTrigger>
          <TabsTrigger value="protein">Protein</TabsTrigger>
          <TabsTrigger value="carbs">Carbs</TabsTrigger>
          <TabsTrigger value="fat">Fat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Calories</CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryChart 
                data={chartData} 
                dataKey="calories_kcal"
                targetKey="calories_kcal"
                color="#8884d8"
                unit="kcal"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="protein" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Protein</CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryChart 
                data={chartData} 
                dataKey="protein_g"
                targetKey="protein_g"
                color="#82ca9d"
                unit="g"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="carbs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Carbohydrates</CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryChart 
                data={chartData} 
                dataKey="carbs_g"
                targetKey="carbs_g"
                color="#ffc658"
                unit="g"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Fat</CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryChart 
                data={chartData} 
                dataKey="fat_g"
                targetKey="fat_g"
                color="#ff7c7c"
                unit="g"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Days List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chartData.slice(-7).reverse().map((day) => {
              const date = new Date(day.date);
              const isToday = day.date === today;
              const hasData = day.consumed.calories_kcal > 0;
              
              return (
                <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {day.date}
                    </div>
                  </div>
                  
                  {hasData ? (
                    <div className="text-right">
                      <div className="font-medium">
                        {Math.round(day.consumed.calories_kcal)} kcal
                      </div>
                      <div className="text-sm text-muted-foreground">
                        P: {Math.round(day.consumed.protein_g)}g • 
                        C: {Math.round(day.consumed.carbs_g)}g • 
                        F: {Math.round(day.consumed.fat_g)}g
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline">No data</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}