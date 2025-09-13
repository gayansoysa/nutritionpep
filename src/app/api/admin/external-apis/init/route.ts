/**
 * Initialize API Configurations
 * Creates default API configurations if they don't exist
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
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

    // Initialize API configurations
    const apiConfigs = [
      {
        api_name: 'USDA',
        is_enabled: false,
        rate_limit_per_hour: 1000,
        rate_limit_per_day: 24000,
        rate_limit_per_month: 720000
      },
      {
        api_name: 'CalorieNinjas',
        is_enabled: false,
        rate_limit_per_month: 100000
      },
      {
        api_name: 'FatSecret',
        is_enabled: false,
        rate_limit_per_day: 10000,
        rate_limit_per_month: 300000
      },
      {
        api_name: 'Edamam',
        is_enabled: false,
        rate_limit_per_month: 10000
      },
      {
        api_name: 'OpenFoodFacts',
        is_enabled: true
      }
    ];

    // Insert configurations (ignore conflicts)
    const { data, error } = await supabase
      .from('api_configurations')
      .upsert(apiConfigs, { 
        onConflict: 'api_name',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Failed to initialize API configurations:', error);
      return NextResponse.json(
        { error: "Failed to initialize API configurations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API configurations initialized successfully",
      configurations: data
    });

  } catch (error: any) {
    console.error("Failed to initialize API configurations:", error);
    return NextResponse.json(
      { error: "Failed to initialize API configurations" },
      { status: 500 }
    );
  }
}