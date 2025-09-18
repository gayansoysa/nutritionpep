import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, PersonIcon, TargetIcon, StarIcon } from "@radix-ui/react-icons";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default async function ProfilePage() {
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

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get latest biometrics
  const { data: biometrics } = await supabase
    .from("biometrics")
    .select("*")
    .eq("user_id", user.id)
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get current goals
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get diary stats for achievements
  const { data: diaryStats } = await supabase
    .from("diary_entries")
    .select("id, date")
    .eq("user_id", user.id);

  // Calculate achievements
  const totalDaysLogged = diaryStats ? new Set(diaryStats.map(entry => entry.date)).size : 0;
  const currentStreak = calculateCurrentStreak(diaryStats || []);
  const memberSince = profile?.created_at ? new Date(profile.created_at) : new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your progress and manage your nutrition journey
              </p>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="outline">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Overview */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PersonIcon className="h-5 w-5" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {profile?.full_name || 'User'}
                    </h3>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      Member since {format(memberSince, 'MMM yyyy')}
                    </Badge>
                    {profile?.activity_level && (
                      <Badge variant="outline">
                        {profile.activity_level.replace('_', ' ')} activity
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Current Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {biometrics && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Weight</span>
                    <span className="font-medium">{biometrics.weight} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Height</span>
                    <span className="font-medium">{biometrics.height} cm</span>
                  </div>
                  {biometrics.body_fat_percentage && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Body Fat</span>
                      <span className="font-medium">{biometrics.body_fat_percentage}%</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">BMI</span>
                    <span className="font-medium">
                      {calculateBMI(biometrics.weight, biometrics.height)}
                    </span>
                  </div>
                </>
              )}
              {!biometrics && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">No biometric data available</p>
                  <Link href="/dashboard/settings">
                    <Button size="sm">Add Measurements</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals & Targets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TargetIcon className="h-5 w-5" />
                Goals & Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Daily Calories</span>
                    <span className="font-medium">{goals.daily_calories} kcal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Protein</span>
                    <span className="font-medium">{goals.protein_grams}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Carbs</span>
                    <span className="font-medium">{goals.carbs_grams}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fat</span>
                    <span className="font-medium">{goals.fat_grams}g</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Goal</span>
                    <Badge variant="outline">
                      {goals.goal_type?.replace('_', ' ') || 'Maintain'}
                    </Badge>
                  </div>
                </>
              )}
              {!goals && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">No goals set</p>
                  <Link href="/dashboard/settings">
                    <Button size="sm">Set Goals</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StarIcon className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">{totalDaysLogged}</div>
                  <div className="text-sm text-muted-foreground">Days Logged</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">{currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">
                    {Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-muted-foreground">Days as Member</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/dashboard/today">
                  <Button variant="outline" className="w-full">
                    Today's Log
                  </Button>
                </Link>
                <Link href="/dashboard/analytics">
                  <Button variant="outline" className="w-full">
                    View Analytics
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="outline" className="w-full">
                    Edit Settings
                  </Button>
                </Link>
                <Link href="/recipes">
                  <Button variant="outline" className="w-full">
                    Browse Recipes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function calculateBMI(weight: number, height: number): string {
  const bmi = weight / Math.pow(height / 100, 2);
  return bmi.toFixed(1);
}

function calculateCurrentStreak(diaryEntries: { date: string }[]): number {
  if (!diaryEntries.length) return 0;
  
  const dates = [...new Set(diaryEntries.map(entry => entry.date))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  for (let i = 0; i < dates.length; i++) {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedDateStr = expectedDate.toISOString().split('T')[0];
    
    if (dates[i] === expectedDateStr) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}