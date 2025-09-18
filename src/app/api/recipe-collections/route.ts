import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/recipe-collections - Get user's recipe collections
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error:", userError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }

    if (!user) {
      console.log("No user found in GET /api/recipe-collections");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const visibility = searchParams.get("visibility");
    const userId = searchParams.get("userId");

    console.log("GET recipe collections - User found:", user.id);

    let query = supabase
      .from("recipe_collections")
      .select(`
        *,
        profiles!recipe_collections_user_id_fkey (
          full_name
        ),
        recipe_collection_items (
          id,
          recipes (
            id,
            name,
            image_url,
            average_rating,
            times_favorited
          )
        )
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (visibility) {
      query = query.eq("visibility", visibility);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      // Default to user's own collections and public ones
      query = query.or(`user_id.eq.${user.id},visibility.eq.public,visibility.eq.shared`);
    }

    const { data: collections, error } = await query;

    if (error) {
      console.error("Error fetching recipe collections:", error);
      // If table doesn't exist, return empty array
      if (error.code === "42P01") {
        return NextResponse.json({ collections: [] });
      }
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    return NextResponse.json({ collections: collections || [] });
  } catch (error) {
    console.error("Error in recipe collections GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/recipe-collections - Create new recipe collection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error:", userError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }

    if (!user) {
      console.log("No user found in POST /api/recipe-collections");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST recipe collection - User found:", user.id);

    const body = await request.json();
    const { name, description, image_url, visibility } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: "Collection name is required" 
      }, { status: 400 });
    }

    // Create collection
    const { data: collection, error: createError } = await supabase
      .from("recipe_collections")
      .insert({
        user_id: user.id,
        name,
        description,
        image_url,
        visibility: visibility || "private"
      })
      .select(`
        *,
        profiles!recipe_collections_user_id_fkey (
          full_name
        )
      `)
      .single();

    if (createError) {
      console.error("Error creating recipe collection:", createError);
      return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
    }

    return NextResponse.json({ 
      collection,
      message: "Collection created successfully"
    });
  } catch (error) {
    console.error("Error in recipe collection POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}