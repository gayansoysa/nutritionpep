import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    console.log("🚀 Applying performance optimizations...");

    // Apply critical performance indexes for Quick Add functionality
    const optimizations = [
      {
        name: "User Favorites Index",
        sql: `CREATE INDEX IF NOT EXISTS idx_user_favorites_user_created 
              ON public.user_favorites(user_id, created_at DESC);`
      },
      {
        name: "Recent Foods Index",
        sql: `CREATE INDEX IF NOT EXISTS idx_recent_foods_user_last_used 
              ON public.recent_foods(user_id, last_used_at DESC) 
              WHERE last_used_at IS NOT NULL;`
      },
      {
        name: "Diary Entries User Date Index",
        sql: `CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date_optimized 
              ON public.diary_entries(user_id, date DESC, created_at DESC);`
      },
      {
        name: "Foods Search Index",
        sql: `CREATE INDEX IF NOT EXISTS idx_foods_name_trgm 
              ON public.foods USING gin(name gin_trgm_ops);`
      },
      {
        name: "Foods Brand Search Index", 
        sql: `CREATE INDEX IF NOT EXISTS idx_foods_brand_trgm 
              ON public.foods USING gin(brand gin_trgm_ops) 
              WHERE brand IS NOT NULL;`
      },
      {
        name: "Foods Verified Index",
        sql: `CREATE INDEX IF NOT EXISTS idx_foods_verified_name 
              ON public.foods(verified, name) WHERE verified = true;`
      },
      {
        name: "User Favorites Food Join Index",
        sql: `CREATE INDEX IF NOT EXISTS idx_user_favorites_food_join 
              ON public.user_favorites(user_id, food_id, created_at DESC);`
      }
    ];

    const results = [];
    let successCount = 0;
    let warningCount = 0;

    for (const optimization of optimizations) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: optimization.sql });
        
        if (error) {
          console.warn(`⚠️  Warning applying ${optimization.name}:`, error.message);
          results.push({
            name: optimization.name,
            status: 'warning',
            message: error.message
          });
          warningCount++;
        } else {
          console.log(`✅ ${optimization.name} applied successfully`);
          results.push({
            name: optimization.name,
            status: 'success',
            message: 'Applied successfully'
          });
          successCount++;
        }
      } catch (err: any) {
        console.error(`❌ Error applying ${optimization.name}:`, err.message);
        results.push({
          name: optimization.name,
          status: 'error',
          message: err.message
        });
      }
    }

    // Try to enable pg_trgm extension for better text search
    try {
      await supabase.rpc('exec_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS pg_trgm;' });
      console.log('✅ pg_trgm extension enabled');
    } catch (err) {
      console.warn('⚠️  Could not enable pg_trgm extension:', err);
    }

    console.log(`🎉 Performance optimizations completed! ${successCount} successful, ${warningCount} warnings`);

    return NextResponse.json({
      success: true,
      message: `Applied ${successCount} optimizations with ${warningCount} warnings`,
      results,
      improvements: [
        "Faster food search queries with trigram indexes",
        "Improved favorites loading with optimized indexes", 
        "Better recent foods performance",
        "Optimized dashboard queries with composite indexes",
        "Enhanced Quick Add functionality performance"
      ]
    });

  } catch (error: any) {
    console.error("❌ Error applying performance optimizations:", error);
    return NextResponse.json(
      { error: "Failed to apply optimizations", details: error.message },
      { status: 500 }
    );
  }
}

// Create the exec_sql function if it doesn't exist
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (error) {
      return NextResponse.json({ 
        message: "exec_sql function setup attempted", 
        error: error.message 
      });
    }

    return NextResponse.json({ 
      message: "exec_sql function created successfully",
      ready: true
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to setup exec_sql function", details: error.message },
      { status: 500 }
    );
  }
}