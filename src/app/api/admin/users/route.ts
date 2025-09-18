/**
 * Admin Users Management API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Create admin client with service role key
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }
  
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured. Please add it to your .env.local file.");
  }
  
  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      get() { return undefined; },
      set() {},
      remove() {},
    },
  });
}

// Create regular client for auth checks
function createRegularClient(cookieStore: any) {
  return createServerClient(
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
}

async function checkAdminAccess(cookieStore: any) {
  const supabase = createRegularClient(cookieStore);
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  // Check if user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("Profile fetch error:", profileError);
    return { error: "Failed to verify admin access", status: 500 };
  }

  if (profile?.role !== 'admin' && profile?.role !== 'moderator') {
    return { error: "Forbidden: Admin access required", status: 403 };
  }

  return { user, profile };
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  try {
    // Check admin access
    const accessCheck = await checkAdminAccess(cookieStore);
    if ('error' in accessCheck) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = page * pageSize;

    // Create admin client for auth operations
    const adminSupabase = createAdminClient();
    const regularSupabase = createRegularClient(cookieStore);

    // Get total count of profiles
    const { count: totalUsers, error: countError } = await regularSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count users: ${countError.message}`);
    }

    // Get profiles with pagination
    const { data: profiles, error: profilesError } = await regularSupabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Try to get auth users for additional info (email, last_sign_in_at)
    let authUsers: any = null;
    try {
      const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers({
        page: page + 1, // Supabase admin API uses 1-based pagination
        perPage: pageSize
      });
      
      if (authError) {
        console.warn("Auth admin API error:", authError);
      } else if (authData) {
        authUsers = authData;
        console.log(`Successfully fetched ${authData.users?.length || 0} auth users`);
      }
    } catch (authError) {
      console.warn("Could not fetch auth users, using profile data only:", authError);
    }

    // Combine profile and auth data
    const combinedUsers = profiles.map(profile => {
      const authUser = authUsers?.users?.find((user: any) => user.id === profile.id);
      return {
        id: profile.id,
        email: authUser?.email || `user-${profile.id.slice(0, 8)}@example.com`,
        full_name: profile.full_name,
        role: profile.role || 'user',
        last_sign_in_at: authUser?.last_sign_in_at || null,
        created_at: authUser?.created_at || profile.created_at
      };
    });

    return NextResponse.json({
      users: combinedUsers,
      totalUsers: totalUsers || 0,
      currentPage: page,
      pageSize,
      hasNextPage: profiles.length === pageSize
    });

  } catch (error: any) {
    console.error("Failed to fetch users:", {
      message: error?.message || "Unknown error",
      stack: error?.stack,
      error
    });
    
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  
  try {
    // Check admin access
    const accessCheck = await checkAdminAccess(cookieStore);
    if ('error' in accessCheck) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'user', 'moderator', or 'admin'" },
        { status: 400 }
      );
    }

    // Update user role in profiles table
    const regularSupabase = createRegularClient(cookieStore);
    const { data, error } = await regularSupabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }

    return NextResponse.json({
      message: `User role updated to ${role}`,
      user: data
    });

  } catch (error: any) {
    console.error("Failed to update user role:", {
      message: error?.message || "Unknown error",
      stack: error?.stack,
      error
    });
    
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}