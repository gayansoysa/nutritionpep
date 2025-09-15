import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/recipes/[id]/favorite - Toggle recipe favorite
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
      console.log("No session found in POST /api/recipes/[id]/favorite");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    console.log("POST recipe favorite - Session found for user:", session.user.id, "Recipe ID:", recipeId);

    // Check if recipe exists and is accessible
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("id, user_id, visibility")
      .eq("id", recipeId)
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

    // Toggle favorite using the database function
    const { data: isFavorited, error: toggleError } = await supabase.rpc(
      "toggle_recipe_favorite",
      { recipe_id_param: recipeId }
    );

    if (toggleError) {
      console.error("Error toggling recipe favorite:", toggleError);
      if (toggleError.code === "42883") {
        return NextResponse.json({ error: "Favorite function not available" }, { status: 503 });
      }
      return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 });
    }

    return NextResponse.json({ 
      is_favorited: isFavorited,
      message: isFavorited ? "Recipe added to favorites" : "Recipe removed from favorites"
    });
  } catch (error) {
    console.error("Error in recipe favorite POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}