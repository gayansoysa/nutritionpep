"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Target,
  BarChart3
} from "lucide-react";

interface RetentionData {
  period: string;
  new_users: number;
  retained_users: number;
  retention_rate: number;
}

interface RetentionMetrics {
  day_1_retention: number;
  day_7_retention: number;
  day_30_retention: number;
  overall_retention: number;
  cohort_data: RetentionData[];
}

export default function UserRetentionAnalysis() {
  const [metrics, setMetrics] = useState<RetentionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRetentionMetrics();
  }, []);

  const fetchRetentionMetrics = async () => {
    setIsLoading(true);
    try {
      // Get user creation dates and activity
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      if (!profiles) {
        throw new Error('No profiles found');
      }

      // Get diary entries to determine activity
      const { data: diaryEntries } = await supabase
        .from('diary_entries')
        .select('user_id, created_at');

      // Calculate retention metrics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Users who signed up in the last periods
      const usersLast1Day = profiles.filter(p => new Date(p.created_at) >= oneDayAgo);
      const usersLast7Days = profiles.filter(p => new Date(p.created_at) >= sevenDaysAgo);
      const usersLast30Days = profiles.filter(p => new Date(p.created_at) >= thirtyDaysAgo);

      // Active users (users with diary entries)
      const activeUserIds = new Set(diaryEntries?.map(entry => entry.user_id) || []);

      // Calculate retention rates
      const day1Retained = usersLast1Day.filter(u => activeUserIds.has(u.id)).length;
      const day7Retained = usersLast7Days.filter(u => activeUserIds.has(u.id)).length;
      const day30Retained = usersLast30Days.filter(u => activeUserIds.has(u.id)).length;

      const day1Retention = usersLast1Day.length > 0 ? (day1Retained / usersLast1Day.length) * 100 : 0;
      const day7Retention = usersLast7Days.length > 0 ? (day7Retained / usersLast7Days.length) * 100 : 0;
      const day30Retention = usersLast30Days.length > 0 ? (day30Retained / usersLast30Days.length) * 100 : 0;
      const overallRetention = profiles.length > 0 ? (activeUserIds.size / profiles.length) * 100 : 0;

      // Generate cohort data for the last 6 months
      const cohortData: RetentionData[] = [];
      for (let i = 0; i < 6; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthUsers = profiles.filter(p => {
          const createdAt = new Date(p.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });

        const monthRetained = monthUsers.filter(u => activeUserIds.has(u.id)).length;
        const retentionRate = monthUsers.length > 0 ? (monthRetained / monthUsers.length) * 100 : 0;

        cohortData.push({
          period: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          new_users: monthUsers.length,
          retained_users: monthRetained,
          retention_rate: Math.round(retentionRate)
        });
      }

      setMetrics({
        day_1_retention: Math.round(day1Retention),
        day_7_retention: Math.round(day7Retention),
        day_30_retention: Math.round(day30Retention),
        overall_retention: Math.round(overallRetention),
        cohort_data: cohortData.reverse()
      });
    } catch (error) {
      console.error("Error fetching retention metrics:", error);
      toast.error("Failed to load retention analysis");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <TableSkeleton columns={["Period", "New Users", "Retained", "Rate"]} rows={6} />
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No retention data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Retention Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">1-Day Retention</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.day_1_retention}%</div>
            <p className="text-xs text-muted-foreground">
              Users active after 1 day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">7-Day Retention</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.day_7_retention}%</div>
            <p className="text-xs text-muted-foreground">
              Users active after 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30-Day Retention</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.day_30_retention}%</div>
            <p className="text-xs text-muted-foreground">
              Users active after 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Retention</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overall_retention}%</div>
            <p className="text-xs text-muted-foreground">
              All-time retention rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Retention Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Trends</CardTitle>
          <CardDescription>
            Visual representation of retention rates over time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">1-Day Retention</span>
              <span className="text-sm text-muted-foreground">{metrics.day_1_retention}%</span>
            </div>
            <Progress value={metrics.day_1_retention} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">7-Day Retention</span>
              <span className="text-sm text-muted-foreground">{metrics.day_7_retention}%</span>
            </div>
            <Progress value={metrics.day_7_retention} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">30-Day Retention</span>
              <span className="text-sm text-muted-foreground">{metrics.day_30_retention}%</span>
            </div>
            <Progress value={metrics.day_30_retention} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Analysis</CardTitle>
          <CardDescription>
            Monthly cohort retention analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.cohort_data.map((cohort, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{cohort.period}</p>
                    <p className="text-sm text-muted-foreground">
                      {cohort.new_users} new users
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{cohort.retained_users} retained</p>
                    <p className="text-sm text-muted-foreground">
                      {cohort.retention_rate}% retention
                    </p>
                  </div>
                  <Badge 
                    variant={cohort.retention_rate >= 50 ? "default" : "secondary"}
                    className={cohort.retention_rate >= 50 ? "bg-green-600" : ""}
                  >
                    {cohort.retention_rate}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}