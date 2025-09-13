/**
 * API Credentials Management Routes
 * Handles secure storage and retrieval of API keys
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { encrypt, decrypt } from "@/lib/crypto";

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
    const { api_name, credentials } = body;

    if (!api_name || !credentials) {
      return NextResponse.json(
        { error: "API name and credentials are required" },
        { status: 400 }
      );
    }

    // Encrypt credentials
    const encryptedCredentials: any = {};
    
    if (credentials.api_key) {
      encryptedCredentials.api_key = encrypt(credentials.api_key);
    }
    
    if (credentials.client_id) {
      encryptedCredentials.client_id = encrypt(credentials.client_id);
    }
    
    if (credentials.client_secret) {
      encryptedCredentials.client_secret = encrypt(credentials.client_secret);
    }
    
    if (credentials.app_id) {
      encryptedCredentials.app_id = encrypt(credentials.app_id);
    }
    
    if (credentials.app_key) {
      encryptedCredentials.app_key = encrypt(credentials.app_key);
    }

    // Update API configuration with encrypted credentials
    const { data, error } = await supabase
      .from('api_configurations')
      .update({
        api_key_encrypted: encryptedCredentials.api_key || null,
        additional_config: {
          client_id: encryptedCredentials.client_id || null,
          client_secret: encryptedCredentials.client_secret || null,
          app_id: encryptedCredentials.app_id || null,
          app_key: encryptedCredentials.app_key || null,
        },
        updated_at: new Date().toISOString()
      })
      .eq('api_name', api_name)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: "Credentials updated successfully",
      has_credentials: true
    });

  } catch (error: any) {
    console.error("Failed to update API credentials:", error);
    return NextResponse.json(
      { error: "Failed to update API credentials" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const api_name = searchParams.get('api_name');

    if (!api_name) {
      return NextResponse.json(
        { error: "API name is required" },
        { status: 400 }
      );
    }

    // Remove credentials
    const { data, error } = await supabase
      .from('api_configurations')
      .update({
        api_key_encrypted: null,
        additional_config: null,
        updated_at: new Date().toISOString()
      })
      .eq('api_name', api_name)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: "Credentials removed successfully",
      has_credentials: false
    });

  } catch (error: any) {
    console.error("Failed to remove API credentials:", error);
    return NextResponse.json(
      { error: "Failed to remove API credentials" },
      { status: 500 }
    );
  }
}