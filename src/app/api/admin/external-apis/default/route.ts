/**
 * Default API Management Routes
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

    // Get current default API
    const { data: defaultAPI, error } = await supabase
      .rpc('get_default_api');

    if (error) throw error;

    return NextResponse.json({ 
      default_api: defaultAPI || 'USDA'
    });

  } catch (error: any) {
    console.error("Failed to get default API:", error);
    return NextResponse.json(
      { error: "Failed to get default API" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { api_name } = body;

    if (!api_name) {
      return NextResponse.json(
        { error: "API name is required" },
        { status: 400 }
      );
    }

    // Validate that the API exists and is enabled
    const { data: apiConfig } = await supabase
      .from('api_configurations')
      .select('api_name, is_enabled')
      .eq('api_name', api_name)
      .single();

    if (!apiConfig) {
      return NextResponse.json(
        { error: "API configuration not found" },
        { status: 404 }
      );
    }

    if (!apiConfig.is_enabled) {
      return NextResponse.json(
        { error: "Cannot set disabled API as default" },
        { status: 400 }
      );
    }

    // Set the default API using the database function
    const { data, error } = await supabase
      .rpc('set_default_api', { api_name });

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      default_api: api_name,
      message: `${api_name} set as default API`
    });

  } catch (error: any) {
    console.error("Failed to set default API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set default API" },
      { status: 500 }
    );
  }
}