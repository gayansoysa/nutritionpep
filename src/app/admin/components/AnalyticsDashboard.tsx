"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
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
import { toast } from 'sonner';

export default function AnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signupData, setSignupData] = useState<any[]>([]);
  const [foodLogData, setFoodLogData] = useState<any[]>([]);
  const [topFoods, setTopFoods] = useState<any[]>([]);
  const [dailyActivityData, setDailyActivityData] = useState<any[]>([]);
  const [userEngagementStats, setUserEngagementStats] = useState({
    activeUsers: 0,
    avgEntriesPerUser: 0,
    totalEntries: 0
  });
  
  const supabase = createSupabaseBrowserClient();
  
  useEffect(() => {
    fetchAnalytics();
  }, []);
  
  const fetchAnalytics = async (retryCount = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching analytics data from API...");
      
      const response = await fetch('/api/admin/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      console.log("API response status:", response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          console.log("API error response:", errorData);
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (e) {
          console.log("Failed to parse error response:", e);
          // If we can't parse the error response, use the status
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Analytics API response:", data);
      
      // Set all the state with the fetched data
      setSignupData(data.signupData || []);
      setFoodLogData(data.foodLogData || []);
      setTopFoods(data.topFoods || []);
      setDailyActivityData(data.dailyActivityData || []);
      setUserEngagementStats(data.userEngagementStats || {
        activeUsers: 0,
        avgEntriesPerUser: 0,
        totalEntries: 0
      });
      
      console.log("Analytics data loaded successfully");
      
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error?.constructor?.name);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Error keys:", Object.keys(error || {}));
      
      let errorMessage = "Unknown error occurred";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error?.details) {
        errorMessage = error.details;
      }
      
      console.log("Final error message:", errorMessage);
      setError(errorMessage);
      
      // Retry logic for network errors
      if (retryCount < 2 && (error?.message?.includes('fetch') || error?.message?.includes('network'))) {
        console.log(`Retrying... (attempt ${retryCount + 1})`);
        setTimeout(() => fetchAnalytics(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      toast.error(`Failed to load analytics data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRetry = () => {
    fetchAnalytics(0);
  };
  
  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
  
  // Show error state if there's an error and no data
  if (error && !isLoading && signupData.length === 0 && foodLogData.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to Load Analytics Data
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  {error.includes('Unauthorized') || error.includes('Authentication') ? 
                    'Authentication issue detected. Try refreshing the page or logging in again.' :
                    'There was an error loading the analytics data. Please try again.'
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                  <button
                    onClick={() => window.location.href = '/debug-auth'}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Debug Auth
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <StatCardSkeleton />
              ) : (
                userEngagementStats.activeUsers
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Entries per User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <StatCardSkeleton />
              ) : (
                userEngagementStats.avgEntriesPerUser
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Entries (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <StatCardSkeleton />
              ) : (
                userEngagementStats.totalEntries
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
            <CardTitle>Daily Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <CardSkeleton className="h-full border-0" />
              ) : dailyActivityData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyActivityData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="entries" name="Diary Entries" fill="var(--chart-3)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Food Logs by Meal Type (Last 7 Days)</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Top Foods Logged (Last 7 Days)</CardTitle>
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
    </div>
  );
}