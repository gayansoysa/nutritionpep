import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/recipes/[id] - Get recipe by ID with ingredients
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
      console.log("No session found in GET /api/recipes/[id]");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    console.log("GET recipe - Session found for user:", session.user.id, "Recipe ID:", recipeId);

    const { data: recipes, error } = await supabase.rpc(
      "get_recipe_with_ingredients",
      { recipe_id_param: recipeId }
    );

    if (error) {
      console.error("Error fetching recipe:", error);
      if (error.code === "42883") {
        return NextResponse.json({ error: "Recipe function not available" }, { status: 503 });
      }
      return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
    }

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const recipe = recipes[0];

    // Increment times_made if this is the recipe owner viewing it
    if (recipe.user_id === session.user.id) {
      try {
        await supabase
          .from("recipes")
          .update({ times_made: (recipe.times_made || 0) + 1 })
          .eq("id", recipeId);
      } catch (updateError) {
        console.error("Error updating times_made:", updateError);
        // Don't fail the request for this
      }
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Error in recipe GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/recipes/[id] - Update recipe
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
      console.log("No session found in PUT /api/recipes/[id]");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    console.log("PUT recipe - Session found for user:", session.user.id, "Recipe ID:", recipeId);

    const body = await request.json();
    const {
      name,
      description,
      instructions,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      difficulty,
      visibility,
      image_url,
      tags,
      category,
      cuisine,
      source_url,
      notes,
      ingredients
    } = body;

    // Check if user owns the recipe
    const { data: existingRecipe, error: checkError } = await supabase
      .from("recipes")
      .select("user_id")
      .eq("id", recipeId)
      .single();

    if (checkError) {
      console.error("Error checking recipe ownership:", checkError);
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (existingRecipe.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to update this recipe" }, { status: 403 });
    }

    // Update recipe
    const { data: recipe, error: updateError } = await supabase
      .from("recipes")
      .update({
        name,
        description,
        instructions,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        difficulty,
        visibility,
        image_url,
        tags: tags || [],
        category,
        cuisine,
        source_url,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", recipeId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating recipe:", updateError);
      return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
    }

    // Update ingredients if provided
    if (ingredients && Array.isArray(ingredients)) {
      // Remove existing ingredients
      await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", recipeId);

      // Add new ingredients
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        
        try {
          await supabase.rpc("add_recipe_ingredient", {
            recipe_id_param: recipeId,
            food_id_param: ingredient.food_id || null,
            name_param: ingredient.name,
            amount_param: ingredient.amount,
            unit_param: ingredient.unit,
            grams_param: ingredient.grams,
            preparation_param: ingredient.preparation || null,
            notes_param: ingredient.notes || null,
            optional_param: ingredient.optional || false,
            sort_order_param: i
          });
        } catch (ingredientError) {
          console.error("Error adding ingredient:", ingredientError);
          // Continue with other ingredients
        }
      }
    }

    // Fetch the complete updated recipe with ingredients
    const { data: completeRecipe, error: fetchError } = await supabase.rpc(
      "get_recipe_with_ingredients",
      { recipe_id_param: recipeId }
    );

    if (fetchError) {
      console.error("Error fetching complete recipe:", fetchError);
      return NextResponse.json({ recipe });
    }

    return NextResponse.json({ recipe: completeRecipe[0] || recipe });
  } catch (error) {
    console.error("Error in recipe PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/recipes/[id] - Delete recipe
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
      console.log("No session found in DELETE /api/recipes/[id]");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    console.log("DELETE recipe - Session found for user:", session.user.id, "Recipe ID:", recipeId);

    // Check if user owns the recipe
    const { data: existingRecipe, error: checkError } = await supabase
      .from("recipes")
      .select("user_id")
      .eq("id", recipeId)
      .single();

    if (checkError) {
      console.error("Error checking recipe ownership:", checkError);
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (existingRecipe.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this recipe" }, { status: 403 });
    }

    // Delete recipe (ingredients will be deleted by cascade)
    const { error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (deleteError) {
      console.error("Error deleting recipe:", deleteError);
      return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in recipe DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}