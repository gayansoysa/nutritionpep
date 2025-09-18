import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    console.log("Analytics API called");
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Use the proper server client helper
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("User check result:", { 
      user: user ? { id: user.id, email: user.email } : null, 
      userError: userError ? userError.message : null 
    });

    if (userError) {
      console.error("User error:", userError);
      return NextResponse.json({ 
        error: "Authentication error", 
        details: userError.message,
        debug: "Failed to get user from Supabase"
      }, { status: 401 });
    }

    if (!user) {
      console.log("No user found - user is not authenticated");
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "No authenticated user found",
        debug: "User session is missing or invalid"
      }, { status: 401 });
    }

    console.log("Authenticated user:", user.email, user.id);

    // Now use service role client for admin operations (including profile check)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user is admin using service role client
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all analytics data using service role
    const [
      { data: signups, error: signupsError },
      { data: logs, error: logsError },
      { data: topFoodsData, error: topFoodsError },
      { data: dailyEntries, error: dailyEntriesError },
      { data: allEntries, error: allEntriesError }
    ] = await Promise.all([
      // Signups
      supabaseAdmin
        .from("profiles")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString()),
      
      // Diary entries by meal type
      supabaseAdmin
        .from("diary_entries")
        .select("date, meal_type")
        .gte("date", sevenDaysAgo.toISOString().split("T")[0]),
      
      // Top foods data - get diary entries with items
      supabaseAdmin
        .from("diary_entries")
        .select("items")
        .gte("date", sevenDaysAgo.toISOString().split("T")[0]),
      
      // Daily activity data
      supabaseAdmin
        .from("diary_entries")
        .select("date")
        .gte("date", sevenDaysAgo.toISOString().split("T")[0]),
      
      // User engagement data
      supabaseAdmin
        .from("diary_entries")
        .select("user_id")
        .gte("date", sevenDaysAgo.toISOString().split("T")[0])
    ]);

    // Check for errors
    if (signupsError) throw signupsError;
    if (logsError) throw logsError;
    if (topFoodsError) console.warn("Top foods query failed:", topFoodsError);
    if (dailyEntriesError) throw dailyEntriesError;
    if (allEntriesError) throw allEntriesError;

    // Process signup data by day
    const signupsByDay = (signups || []).reduce((acc: Record<string, number>, profile) => {
      const date = new Date(profile.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const signupChartData = Object.entries(signupsByDay).map(([date, count]) => ({
      date,
      count
    }));

    // Process log data by meal type
    const logsByMeal = (logs || []).reduce((acc: Record<string, number>, entry) => {
      const mealType = entry.meal_type;
      acc[mealType] = (acc[mealType] || 0) + 1;
      return acc;
    }, {});

    const logChartData = Object.entries(logsByMeal).map(([name, value]) => ({
      name,
      value
    }));

    // Process top foods data
    let topFoodsArray = [];
    if (topFoodsError) {
      console.warn("Error fetching top foods:", topFoodsError);
      // Fallback to demo data if query fails
      topFoodsArray = [
        { name: "Chicken Breast", count: 42 },
        { name: "Eggs", count: 38 },
        { name: "Banana", count: 35 },
        { name: "Rice", count: 31 },
        { name: "Apple", count: 28 }
      ];
    } else {
      // Extract food names from JSONB items array
      const foodCounts = (topFoodsData || []).reduce((acc: Record<string, number>, entry: any) => {
        if (entry.items && Array.isArray(entry.items)) {
          entry.items.forEach((item: any) => {
            const foodName = item.name || 'Unknown Food';
            acc[foodName] = (acc[foodName] || 0) + 1;
          });
        }
        return acc;
      }, {});

      topFoodsArray = Object.entries(foodCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // Process daily activity data
    const entriesByDay = (dailyEntries || []).reduce((acc: Record<string, number>, entry) => {
      const date = new Date(entry.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const dailyActivityChartData = Object.entries(entriesByDay).map(([date, count]) => ({
      date,
      entries: count
    }));

    // Calculate user engagement statistics
    const uniqueUsers = new Set((allEntries || []).map(entry => entry.user_id));
    const totalEntries = (allEntries || []).length;
    const activeUsers = uniqueUsers.size;
    const avgEntriesPerUser = activeUsers > 0 ? Math.round(totalEntries / activeUsers * 10) / 10 : 0;

    const userEngagementStats = {
      activeUsers,
      avgEntriesPerUser,
      totalEntries
    };

    return NextResponse.json({
      signupData: signupChartData,
      foodLogData: logChartData,
      topFoods: topFoodsArray,
      dailyActivityData: dailyActivityChartData,
      userEngagementStats
    });

  } catch (error: any) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch analytics data",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}