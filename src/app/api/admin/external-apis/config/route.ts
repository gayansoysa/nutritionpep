/**
 * External API Configuration Management Routes
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

    // Get API configurations
    const { data: configs, error } = await supabase
      .from('api_configurations')
      .select('*')
      .order('api_name');

    if (error) throw error;

    // Add credential status (don't expose actual credentials)
    const configsWithStatus = configs.map(config => {
      let has_credentials = false;
      
      switch (config.api_name) {
        case 'OpenFoodFacts':
          has_credentials = true; // No credentials needed
          break;
        case 'USDA':
        case 'CalorieNinjas':
          has_credentials = !!config.api_key_encrypted;
          break;
        case 'FatSecret':
          has_credentials = !!(
            config.additional_config?.client_id && 
            config.additional_config?.client_secret
          );
          break;
        case 'Edamam':
          has_credentials = !!(
            config.additional_config?.app_id && 
            config.additional_config?.app_key
          );
          break;
      }
      
      return {
        ...config,
        has_credentials,
        api_key_encrypted: undefined, // Remove from response
        additional_config: undefined // Remove from response
      };
    });

    return NextResponse.json(configsWithStatus);

  } catch (error: any) {
    console.error("Failed to get API configurations:", error);
    return NextResponse.json(
      { error: "Failed to get API configurations" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { api_name, ...updates } = body;

    if (!api_name) {
      return NextResponse.json(
        { error: "API name is required" },
        { status: 400 }
      );
    }

    // Update API configuration
    const { data, error } = await supabase
      .from('api_configurations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('api_name', api_name)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Failed to update API configuration:", error);
    return NextResponse.json(
      { error: "Failed to update API configuration" },
      { status: 500 }
    );
  }
}