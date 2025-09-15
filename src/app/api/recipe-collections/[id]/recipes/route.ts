import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/recipe-collections/[id]/recipes - Add recipe to collection
export async function POST(
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
      console.log("No session found in POST /api/recipe-collections/[id]/recipes");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collectionId = params.id;

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    console.log("POST recipe to collection - Session found for user:", session.user.id, "Collection ID:", collectionId);

    const body = await request.json();
    const { recipe_id } = body;

    if (!recipe_id) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    // Check if user owns the collection
    const { data: collection, error: collectionError } = await supabase
      .from("recipe_collections")
      .select("user_id")
      .eq("id", collectionId)
      .single();

    if (collectionError) {
      console.error("Error checking collection:", collectionError);
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to modify this collection" }, { status: 403 });
    }

    // Check if recipe exists and is accessible
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("id, user_id, visibility")
      .eq("id", recipe_id)
      .single();

    if (recipeError) {
      console.error("Error checking recipe:", recipeError);
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Check if user can access this recipe
    const canAccess = recipe.user_id === session.user.id || 
                     recipe.visibility === 'public' || 
                     recipe.visibility === 'shared';

    if (!canAccess) {
      return NextResponse.json({ error: "Recipe not accessible" }, { status: 403 });
    }

    // Add recipe to collection
    const { data: collectionItem, error: addError } = await supabase
      .from("recipe_collection_items")
      .insert({
        collection_id: collectionId,
        recipe_id: recipe_id
      })
      .select(`
        *,
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
          times_favorited
        )
      `)
      .single();

    if (addError) {
      if (addError.code === "23505") { // Unique constraint violation
        return NextResponse.json({ error: "Recipe is already in this collection" }, { status: 409 });
      }
      console.error("Error adding recipe to collection:", addError);
      return NextResponse.json({ error: "Failed to add recipe to collection" }, { status: 500 });
    }

    return NextResponse.json({ 
      collection_item: collectionItem,
      message: "Recipe added to collection successfully"
    });
  } catch (error) {
    console.error("Error in collection recipe POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/recipe-collections/[id]/recipes - Remove recipe from collection
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
      console.log("No session found in DELETE /api/recipe-collections/[id]/recipes");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collectionId = params.id;

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const recipe_id = searchParams.get("recipe_id");

    if (!recipe_id) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    console.log("DELETE recipe from collection - Session found for user:", session.user.id, "Collection ID:", collectionId, "Recipe ID:", recipe_id);

    // Check if user owns the collection
    const { data: collection, error: collectionError } = await supabase
      .from("recipe_collections")
      .select("user_id")
      .eq("id", collectionId)
      .single();

    if (collectionError) {
      console.error("Error checking collection:", collectionError);
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to modify this collection" }, { status: 403 });
    }

    // Remove recipe from collection
    const { error: removeError } = await supabase
      .from("recipe_collection_items")
      .delete()
      .eq("collection_id", collectionId)
      .eq("recipe_id", recipe_id);

    if (removeError) {
      console.error("Error removing recipe from collection:", removeError);
      return NextResponse.json({ error: "Failed to remove recipe from collection" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Recipe removed from collection successfully"
    });
  } catch (error) {
    console.error("Error in collection recipe DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}