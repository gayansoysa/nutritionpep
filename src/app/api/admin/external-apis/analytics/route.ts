/**
 * External API Search Analytics Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

    // Get search analytics summary
    const { data: analytics, error } = await supabase
      .from('search_analytics_summary')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(analytics || []);

  } catch (error: any) {
    console.error("Failed to get search analytics:", error);
    return NextResponse.json(
      { error: "Failed to get search analytics" },
      { status: 500 }
    );
  }
}