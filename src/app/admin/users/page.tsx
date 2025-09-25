"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, TrendingUp, UserCheck } from "lucide-react";
import { toast } from 'sonner';
import AdminAccessRequired from "@/components/admin/AdminAccessRequired";
import UsersList from "@/app/admin/components/UsersList";
import UserActivityDashboard from "@/app/admin/components/UserActivityDashboard";
import UserEngagementMetrics from "@/app/admin/components/UserEngagementMetrics";
import UserRetentionAnalysis from "@/app/admin/components/UserRetentionAnalysis";
import UserSupportTools from "@/app/admin/components/UserSupportTools";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newSignups: number;
  retentionRate: number;
}

export default function UsersPage() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newSignups: 0,
    retentionRate: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // First check if user has admin access
      const { data: currentUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Authentication error:", authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!currentUser.user) {
        setHasAdminAccess(false);
        throw new Error("Please log in to access the admin panel");
      }

      setUserEmail(currentUser.user.email || "");

      // Get current user's profile to check admin status
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", {
          message: profileError?.message || "Unknown error",
          details: profileError?.details || "No details",
          hint: profileError?.hint || "No hint",
          code: profileError?.code || "No code",
          error: profileError
        });
        
        // If profile doesn't exist, user might need to complete onboarding
        if (profileError.code === 'PGRST116') {
          setHasAdminAccess(false);
          throw new Error("User profile not found. Please complete your profile setup first.");
        }
        
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      setUserRole(profile?.role || "user");

      if (profile?.role !== "admin" && profile?.role !== "moderator") {
        setHasAdminAccess(false);
        throw new Error(`Access denied: Admin privileges required. Current role: ${profile?.role || 'none'}. Please run the admin setup SQL command in Supabase to promote your account.`);
      }

      setHasAdminAccess(true);

      // Get total users count
      const { count: totalUsers, error: totalError } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get users created in the last 7 days (new signups)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: newSignups, error: signupsError } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      if (signupsError) throw signupsError;

      // Get diary entries from last 7 days to estimate active users
      const { data: recentEntries, error: entriesError } = await supabase
        .from("diary_entries")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      if (entriesError) throw entriesError;

      // Count unique active users
      const uniqueActiveUsers = new Set(recentEntries?.map(entry => entry.user_id) || []).size;

      // Calculate retention rate (simplified)
      const retentionRate = totalUsers ? Math.round((uniqueActiveUsers / totalUsers) * 100) : 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: uniqueActiveUsers,
        newSignups: newSignups || 0,
        retentionRate
      });
    } catch (error: any) {
      console.error("Error fetching stats:", {
        message: error?.message || "Unknown error",
        details: error?.details || "No details",
        hint: error?.hint || "No hint",
        code: error?.code || "No code",
        error: error
      });
      toast.error("Failed to load user statistics");
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Show admin access required screen if user doesn't have permissions
  if (hasAdminAccess === false) {
    return <AdminAccessRequired userEmail={userEmail} currentRole={userRole} />;
  }

  // Show loading state while checking permissions
  if (hasAdminAccess === null) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Comprehensive user management, analytics, and support tools
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Retention
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "Loading..." : stats.totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "Loading..." : stats.activeUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active in last 7 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Signups</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "Loading..." : stats.newSignups.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "Loading..." : `${stats.retentionRate}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  7-day activity rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <UserActivityDashboard />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <UserEngagementMetrics />
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <UserRetentionAnalysis />
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <UserSupportTools />
        </TabsContent>
      </Tabs>
    </div>
  );
}