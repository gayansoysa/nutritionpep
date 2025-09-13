/**
 * External API Cache Management Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Clear all API cache
    const { error } = await supabase
      .from('api_food_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: "API cache cleared successfully" 
    });

  } catch (error: any) {
    console.error("Failed to clear API cache:", error);
    return NextResponse.json(
      { error: "Failed to clear API cache" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get cache statistics
    const { data: cacheStats, error } = await supabase
      .from('api_food_cache')
      .select('api_source, cached_at, expires_at')
      .order('cached_at', { ascending: false });

    if (error) throw error;

    // Calculate cache statistics
    const now = new Date();
    const stats = {
      total_entries: cacheStats.length,
      active_entries: cacheStats.filter(entry => new Date(entry.expires_at) > now).length,
      expired_entries: cacheStats.filter(entry => new Date(entry.expires_at) <= now).length,
      by_api: cacheStats.reduce((acc, entry) => {
        acc[entry.api_source] = (acc[entry.api_source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      oldest_entry: cacheStats[cacheStats.length - 1]?.cached_at,
      newest_entry: cacheStats[0]?.cached_at
    };

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error("Failed to get cache statistics:", error);
    return NextResponse.json(
      { error: "Failed to get cache statistics" },
      { status: 500 }
    );
  }
}