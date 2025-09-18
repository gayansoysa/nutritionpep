import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/recipes/[id]/ingredients - Get recipe ingredients
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Session error:", userError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }

    if (!user) {
      console.log("No user found in GET /api/recipes/[id]/ingredients");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const recipeId = resolvedParams.id;

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    console.log("GET recipe ingredients - User found:", user.id, "Recipe ID:", recipeId);

    // Check if user can access this recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("user_id, visibility")
      .eq("id", recipeId)
      .single();

    if (recipeError) {
      console.error("Error checking recipe:", recipeError);
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const canAccess = recipe.user_id === user.id || 
                     recipe.visibility === 'public' || 
                     recipe.visibility === 'shared';

    if (!canAccess) {
      return NextResponse.json({ error: "Recipe not accessible" }, { status: 403 });
    }

    const { data: ingredients, error } = await supabase
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
      .eq("recipe_id", recipeId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching recipe ingredients:", error);
      return NextResponse.json({ error: "Failed to fetch ingredients" }, { status: 500 });
    }

    return NextResponse.json({ ingredients: ingredients || [] });
  } catch (error) {
    console.error("Error in recipe ingredients GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/recipes/[id]/ingredients - Add ingredient to recipe
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Session error:", userError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }

    if (!user) {
      console.log("No user found in POST /api/recipes/[id]/ingredients");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const recipeId = resolvedParams.id;

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
    }

    console.log("POST recipe ingredient - User found:", user.id, "Recipe ID:", recipeId);

    // Check if user owns this recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("user_id")
      .eq("id", recipeId)
      .single();

    if (recipeError) {
      console.error("Error checking recipe:", recipeError);
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (recipe.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized to modify this recipe" }, { status: 403 });
    }

    const body = await request.json();
    const {
      food_id,
      name,
      amount,
      unit,
      grams,
      preparation,
      notes,
      optional,
      sort_order
    } = body;

    // Validate required fields
    if (!name || !amount || !unit || !grams) {
      return NextResponse.json({ 
        error: "Name, amount, unit, and grams are required" 
      }, { status: 400 });
    }

    // Add ingredient using the database function
    const { data: ingredientId, error: addError } = await supabase.rpc(
      "add_recipe_ingredient",
      {
        recipe_id_param: recipeId,
        food_id_param: food_id || null,
        name_param: name,
        amount_param: amount,
        unit_param: unit,
        grams_param: grams,
        preparation_param: preparation || null,
        notes_param: notes || null,
        optional_param: optional || false,
        sort_order_param: sort_order || 0
      }
    );

    if (addError) {
      console.error("Error adding recipe ingredient:", addError);
      if (addError.code === "42883") {
        return NextResponse.json({ error: "Ingredient function not available" }, { status: 503 });
      }
      return NextResponse.json({ error: "Failed to add ingredient" }, { status: 500 });
    }

    // Fetch the added ingredient
    const { data: ingredient, error: fetchError } = await supabase
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
      console.error("Error fetching added ingredient:", fetchError);
      return NextResponse.json({ ingredient_id: ingredientId });
    }

    return NextResponse.json({ 
      ingredient,
      message: "Ingredient added successfully"
    });
  } catch (error) {
    console.error("Error in recipe ingredient POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}