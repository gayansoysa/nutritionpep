import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/recipes/ingredients/[id] - Update recipe ingredient
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
      console.log("No session found in PUT /api/recipes/ingredients/[id]");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ingredientId = params.id;

    if (!ingredientId) {
      return NextResponse.json({ error: "Ingredient ID is required" }, { status: 400 });
    }

    console.log("PUT recipe ingredient - Session found for user:", session.user.id, "Ingredient ID:", ingredientId);

    // Check if user owns the recipe this ingredient belongs to
    const { data: ingredient, error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .select(`
        recipe_id,
        recipes!inner (
          user_id
        )
      `)
      .eq("id", ingredientId)
      .single();

    if (ingredientError) {
      console.error("Error checking ingredient:", ingredientError);
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    if (ingredient.recipes.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to modify this ingredient" }, { status: 403 });
    }

    const body = await request.json();
    const {
      amount,
      unit,
      grams,
      preparation,
      notes,
      optional,
      sort_order
    } = body;

    // Update ingredient using the database function
    const { error: updateError } = await supabase.rpc(
      "update_recipe_ingredient",
      {
        ingredient_id_param: ingredientId,
        amount_param: amount,
        unit_param: unit,
        grams_param: grams,
        preparation_param: preparation,
        notes_param: notes,
        optional_param: optional,
        sort_order_param: sort_order
      }
    );

    if (updateError) {
      console.error("Error updating recipe ingredient:", updateError);
      if (updateError.code === "42883") {
        return NextResponse.json({ error: "Ingredient function not available" }, { status: 503 });
      }
      return NextResponse.json({ error: "Failed to update ingredient" }, { status: 500 });
    }

    // Fetch the updated ingredient
    const { data: updatedIngredient, error: fetchError } = await supabase
      .from("recipe_ingredients")
      .select(`
        *,
        foods (
          id,
          name,
          brand,
          category,
          nutrients_per_100g
        )
      `)
      .eq("id", ingredientId)
      .single();

    if (fetchError) {
      console.error("Error fetching updated ingredient:", fetchError);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ 
      ingredient: updatedIngredient,
      message: "Ingredient updated successfully"
    });
  } catch (error) {
    console.error("Error in recipe ingredient PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/recipes/ingredients/[id] - Delete recipe ingredient
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
      console.log("No session found in DELETE /api/recipes/ingredients/[id]");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ingredientId = params.id;

    if (!ingredientId) {
      return NextResponse.json({ error: "Ingredient ID is required" }, { status: 400 });
    }

    console.log("DELETE recipe ingredient - Session found for user:", session.user.id, "Ingredient ID:", ingredientId);

    // Check if user owns the recipe this ingredient belongs to
    const { data: ingredient, error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .select(`
        recipe_id,
        recipes!inner (
          user_id
        )
      `)
      .eq("id", ingredientId)
      .single();

    if (ingredientError) {
      console.error("Error checking ingredient:", ingredientError);
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    if (ingredient.recipes.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this ingredient" }, { status: 403 });
    }

    // Remove ingredient using the database function
    const { error: removeError } = await supabase.rpc(
      "remove_recipe_ingredient",
      { ingredient_id_param: ingredientId }
    );

    if (removeError) {
      console.error("Error removing recipe ingredient:", removeError);
      if (removeError.code === "42883") {
        return NextResponse.json({ error: "Ingredient function not available" }, { status: 503 });
      }
      return NextResponse.json({ error: "Failed to remove ingredient" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Ingredient removed successfully"
    });
  } catch (error) {
    console.error("Error in recipe ingredient DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}