import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/recipes/[id]/rating - Get user's rating for recipe
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
      console.log("No session found in GET /api/recipes/[id]/rating");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    console.log("GET recipe rating - Session found for user:", session.user.id, "Recipe ID:", recipeId);

    const { data: rating, error } = await supabase
      .from("recipe_ratings")
      .select("*")
      .eq("recipe_id", recipeId)
      .eq("user_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      console.error("Error fetching recipe rating:", error);
      return NextResponse.json({ error: "Failed to fetch rating" }, { status: 500 });
    }

    return NextResponse.json({ rating: rating || null });
  } catch (error) {
    console.error("Error in recipe rating GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/recipes/[id]/rating - Add or update recipe rating
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
      console.log("No session found in POST /api/recipes/[id]/rating");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { rating, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: "Rating must be between 1 and 5" 
      }, { status: 400 });
    }

    console.log("POST recipe rating - Session found for user:", session.user.id, "Recipe ID:", recipeId);

    // Check if recipe exists and is not owned by the user
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("id, user_id, visibility")
      .eq("id", recipeId)
      .single();

    if (recipeError) {
      console.error("Error checking recipe:", recipeError);
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Users cannot rate their own recipes
    if (recipe.user_id === session.user.id) {
      return NextResponse.json({ error: "Cannot rate your own recipe" }, { status: 403 });
    }

    // Check if user can access this recipe
    const canAccess = recipe.visibility === 'public' || recipe.visibility === 'shared';

    if (!canAccess) {
      return NextResponse.json({ error: "Recipe not accessible" }, { status: 403 });
    }

    // Upsert rating
    const { data: ratingData, error: ratingError } = await supabase
      .from("recipe_ratings")
      .upsert({
        recipe_id: recipeId,
        user_id: session.user.id,
        rating,
        review: review || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (ratingError) {
      console.error("Error saving recipe rating:", ratingError);
      return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
    }

    return NextResponse.json({ 
      rating: ratingData,
      message: "Rating saved successfully"
    });
  } catch (error) {
    console.error("Error in recipe rating POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/recipes/[id]/rating - Delete recipe rating
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
      console.log("No session found in DELETE /api/recipes/[id]/rating");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    console.log("DELETE recipe rating - Session found for user:", session.user.id, "Recipe ID:", recipeId);

    const { error } = await supabase
      .from("recipe_ratings")
      .delete()
      .eq("recipe_id", recipeId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error deleting recipe rating:", error);
      return NextResponse.json({ error: "Failed to delete rating" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Rating deleted successfully"
    });
  } catch (error) {
    console.error("Error in recipe rating DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}