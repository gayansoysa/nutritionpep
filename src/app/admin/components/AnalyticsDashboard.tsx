"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { StatCardSkeleton, CardSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "@/lib/utils/toast";

export default function AnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [signupData, setSignupData] = useState<any[]>([]);
  const [foodLogData, setFoodLogData] = useState<any[]>([]);
  const [topFoods, setTopFoods] = useState<any[]>([]);
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    fetchAnalytics();
  }, []);
  
  const fetchAnalytics = async () => {
    setIsLoading(true);
    
    try {
      // Fetch signups by day (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: signups, error: signupsError } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString());
        
      if (signupsError) {
        throw signupsError;
      }
      
      // Process signup data by day
      const signupsByDay = signups.reduce((acc: Record<string, number>, profile) => {
        const date = new Date(profile.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      
      // Convert to array for chart
      const signupChartData = Object.entries(signupsByDay).map(([date, count]) => ({
        date,
        count
      }));
      
      setSignupData(signupChartData);
      
      // Fetch food logs by day (last 7 days)
      const { data: logs, error: logsError } = await supabase
        .from("diary_entries")
        .select("date, meal_type")
        .gte("date", sevenDaysAgo.toISOString().split("T")[0]);
        
      if (logsError) {
        throw logsError;
      }
      
      // Process log data by meal type
      const logsByMeal = logs.reduce((acc: Record<string, number>, entry) => {
        const mealType = entry.meal_type;
        acc[mealType] = (acc[mealType] || 0) + 1;
        return acc;
      }, {});
      
      // Convert to array for chart
      const logChartData = Object.entries(logsByMeal).map(([name, value]) => ({
        name,
        value
      }));
      
      setFoodLogData(logChartData);
      
      // For demo purposes, create mock top foods data
      // In a real app, you would query this from the database
      setTopFoods([
        { name: "Chicken Breast", count: 42 },
        { name: "Eggs", count: 38 },
        { name: "Banana", count: 35 },
        { name: "Rice", count: 31 },
        { name: "Apple", count: 28 }
      ]);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };
  
  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New User Signups (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <CardSkeleton className="h-full border-0" />
              ) : signupData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={signupData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Signups" fill="var(--chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Food Logs by Meal Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <CardSkeleton className="h-full border-0" />
              ) : foodLogData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={foodLogData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    >
                      {foodLogData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Foods Logged</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {isLoading ? (
              <CardSkeleton className="h-full border-0" />
            ) : topFoods.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topFoods}
                  margin={{ top: 10, right: 10, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" name="Times Logged" fill="var(--chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}