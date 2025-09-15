import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/recipe-collections/[id] - Get collection by ID with recipes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      console.log("No session found in GET /api/recipe-collections/[id]");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collectionId = params.id;

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    console.log("GET recipe collection - Session found for user:", session.user.id, "Collection ID:", collectionId);

    const { data: collection, error } = await supabase
      .from("recipe_collections")
      .select(`
        *,
        profiles!recipe_collections_user_id_fkey (
          full_name
        ),
        recipe_collection_items (
          id,
          added_at,
          recipes (
            id,
            name,
            description,
            image_url,
            prep_time_minutes,
            cook_time_minutes,
            servings,
            difficulty,
            average_rating,
            rating_count,
            times_favorited,
            created_at,
            profiles!recipes_user_id_fkey (
              full_name
            )
          )
        )
      `)
      .eq("id", collectionId)
      .single();

    if (error) {
      console.error("Error fetching recipe collection:", error);
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Check if user can access this collection
    const canAccess = collection.user_id === session.user.id || 
                     collection.visibility === 'public' || 
                     collection.visibility === 'shared';

    if (!canAccess) {
      return NextResponse.json({ error: "Collection not accessible" }, { status: 403 });
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Error in recipe collection GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/recipe-collections/[id] - Update collection
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      console.log("No session found in PUT /api/recipe-collections/[id]");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collectionId = params.id;

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    console.log("PUT recipe collection - Session found for user:", session.user.id, "Collection ID:", collectionId);

    // Check if user owns the collection
    const { data: existingCollection, error: checkError } = await supabase
      .from("recipe_collections")
      .select("user_id")
      .eq("id", collectionId)
      .single();

    if (checkError) {
      console.error("Error checking collection ownership:", checkError);
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (existingCollection.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to update this collection" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, image_url, visibility } = body;

    // Update collection
    const { data: collection, error: updateError } = await supabase
      .from("recipe_collections")
      .update({
        name,
        description,
        image_url,
        visibility,
        updated_at: new Date().toISOString()
      })
      .eq("id", collectionId)
      .select(`
        *,
        profiles!recipe_collections_user_id_fkey (
          full_name
        )
      `)
      .single();

    if (updateError) {
      console.error("Error updating recipe collection:", updateError);
      return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
    }

    return NextResponse.json({ 
      collection,
      message: "Collection updated successfully"
    });
  } catch (error) {
    console.error("Error in recipe collection PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/recipe-collections/[id] - Delete collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      console.log("No session found in DELETE /api/recipe-collections/[id]");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collectionId = params.id;

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    console.log("DELETE recipe collection - Session found for user:", session.user.id, "Collection ID:", collectionId);

    // Check if user owns the collection
    const { data: existingCollection, error: checkError } = await supabase
      .from("recipe_collections")
      .select("user_id")
      .eq("id", collectionId)
      .single();

    if (checkError) {
      console.error("Error checking collection ownership:", checkError);
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (existingCollection.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this collection" }, { status: 403 });
    }

    // Delete collection (items will be deleted by cascade)
    const { error: deleteError } = await supabase
      .from("recipe_collections")
      .delete()
      .eq("id", collectionId);

    if (deleteError) {
      console.error("Error deleting recipe collection:", deleteError);
      return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Collection deleted successfully"
    });
  } catch (error) {
    console.error("Error in recipe collection DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}