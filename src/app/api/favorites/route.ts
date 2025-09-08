import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/favorites - Get user's favorite foods
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }

    if (!session) {
      console.log("No session found in GET /api/favorites");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("GET favorites - Session found for user:", session.user.id);

    const { data: favorites, error } = await supabase
      .from("user_favorites")
      .select(`
        id,
        created_at,
        foods (
          id,
          name,
          brand,
          category,
          barcode,
          serving_sizes,
          nutrients_per_100g
        )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching favorites:", error);
      // If table doesn't exist, return empty array
      if (error.code === "42P01") {
        return NextResponse.json({ favorites: [] });
      }
      return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
    }

    return NextResponse.json({ favorites: favorites || [] });
  } catch (error) {
    console.error("Error in favorites GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/favorites - Add food to favorites
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/favorites - Starting request");
    const supabase = await createSupabaseRouteHandlerClient();
    console.log("POST /api/favorites - Supabase client created");

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error in POST /api/favorites:", sessionError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }

    if (!session) {
      console.log("No session found in POST /api/favorites");
      console.log("Request headers:", Object.fromEntries(request.headers.entries()));
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST favorites - Session found for user:", session.user.id);

    const { food_id } = await request.json();

    if (!food_id) {
      return NextResponse.json({ error: "food_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_favorites")
      .insert({
        user_id: session.user.id,
        food_id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") { // Unique constraint violation
        return NextResponse.json({ error: "Food is already in favorites" }, { status: 409 });
      }
      if (error.code === "42P01") { // Table doesn't exist
        return NextResponse.json({ error: "Favorites feature not available yet" }, { status: 503 });
      }
      console.error("Error adding favorite:", error);
      return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
    }

    return NextResponse.json({ favorite: data });
  } catch (error) {
    console.error("Error in favorites POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove food from favorites
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }

    if (!session) {
      console.log("No session found in DELETE /api/favorites");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("DELETE favorites - Session found for user:", session.user.id);

    const { searchParams } = new URL(request.url);
    const food_id = searchParams.get("food_id");

    if (!food_id) {
      return NextResponse.json({ error: "food_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", session.user.id)
      .eq("food_id", food_id);

    if (error) {
      console.error("Error removing favorite:", error);
      return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in favorites DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}