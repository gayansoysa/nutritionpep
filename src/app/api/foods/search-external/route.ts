/**
 * External API Food Search Route
 * 
 * This route provides access to external nutrition APIs with intelligent fallback,
 * caching, and analytics tracking.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { externalAPIService } from "@/lib/services/external-apis";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");
  const preferredAPIs = searchParams.get("apis")?.split(",");
  const includeBarcode = searchParams.get("includeBarcode") === "true";

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters long" },
      { status: 400 }
    );
  }

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
    const startTime = Date.now();

    // Get user ID for analytics (optional)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Search external APIs
    const result = await externalAPIService.searchFoods(query, {
      limit,
      offset,
      preferredAPIs,
      includeBarcode
    });

    const responseTime = Date.now() - startTime;

    // Track search analytics
    if (result.source !== 'cache') {
      await trackSearchAnalytics({
        userId: userId || null,
        query,
        apiUsed: result.source,
        resultsCount: result.foods.length,
        responseTime,
        userAgent: request.headers.get('user-agent'),
        ipAddress: getClientIP(request)
      });
    }

    // Return results with metadata
    return NextResponse.json({
      foods: result.foods,
      pagination: {
        limit,
        offset,
        total: result.totalResults,
        hasMore: result.hasMore
      },
      metadata: {
        source: result.source,
        responseTime,
        cached: result.source === 'cache',
        query: query.trim()
      }
    });

  } catch (error: any) {
    console.error("External API search error:", error);

    // Track error in analytics
    await trackSearchAnalytics({
      userId: null,
      query,
      apiUsed: 'error',
      resultsCount: 0,
      responseTime: 0,
      errorMessage: error.message,
      userAgent: request.headers.get('user-agent'),
      ipAddress: getClientIP(request)
    });

    return NextResponse.json(
      { 
        error: "Search failed", 
        message: error.message,
        foods: [],
        pagination: { limit, offset, total: 0, hasMore: false }
      },
      { status: 500 }
    );
  }
}

/**
 * Track search analytics
 */
async function trackSearchAnalytics(data: {
  userId: string | null;
  query: string;
  apiUsed: string;
  resultsCount: number;
  responseTime: number;
  errorMessage?: string;
  userAgent: string | null;
  ipAddress: string | null;
}) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined; }
        }
      }
    );

    await supabase.from('search_analytics').insert({
      user_id: data.userId,
      search_query: data.query.toLowerCase().trim(),
      results_count: data.resultsCount,
      api_used: data.apiUsed,
      response_time_ms: data.responseTime,
      error_message: data.errorMessage,
      user_agent: data.userAgent,
      ip_address: data.ipAddress,
      search_timestamp: new Date().toISOString()
    });

    // Update API usage statistics
    if (data.apiUsed !== 'cache' && data.apiUsed !== 'error') {
      await supabase.rpc('update_api_usage_stats', {
        p_api_name: data.apiUsed,
        p_success: data.resultsCount > 0,
        p_response_time_ms: data.responseTime
      });
    }
  } catch (error) {
    console.error("Failed to track search analytics:", error);
    // Don't throw - analytics failure shouldn't break the search
  }
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return null;
}

/**
 * POST endpoint for tracking selected foods from search results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchQuery, selectedFoodId, apiSource } = body;

    if (!searchQuery || !selectedFoodId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    const { data: { user } } = await supabase.auth.getUser();

    // Update the search analytics record to include the selected food
    await supabase
      .from('search_analytics')
      .update({ selected_food_id: selectedFoodId })
      .eq('user_id', user?.id)
      .eq('search_query', searchQuery.toLowerCase().trim())
      .eq('api_used', apiSource)
      .order('search_timestamp', { ascending: false })
      .limit(1);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Failed to track food selection:", error);
    return NextResponse.json(
      { error: "Failed to track selection" },
      { status: 500 }
    );
  }
}