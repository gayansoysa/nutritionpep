// Recipe Management System Types

export type RecipeVisibility = 'private' | 'public' | 'shared';
export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

// Base Recipe interface
export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  instructions?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  total_time_minutes?: number;
  servings: number;
  difficulty: RecipeDifficulty;
  visibility: RecipeVisibility;
  image_url?: string;
  tags: string[];
  category?: string;
  cuisine?: string;
  
  // Nutrition per serving
  calories_per_serving?: number;
  protein_per_serving?: number;
  carbs_per_serving?: number;
  fat_per_serving?: number;
  fiber_per_serving?: number;
  
  // Nutrition per 100g
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  
  // Total recipe weight
  total_weight_g?: number;
  
  // Stats
  average_rating: number;
  rating_count: number;
  times_made: number;
  times_favorited: number;
  
  // Metadata
  source_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Recipe with user information
export interface RecipeWithUser extends Recipe {
  user_name?: string;
  is_favorited?: boolean;
}

// Recipe ingredient interface
export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  food_id?: string;
  name: string;
  amount: number;
  unit: string;
  grams: number;
  preparation?: string;
  notes?: string;
  optional: boolean;
  sort_order: number;
  
  // Nutrition snapshot
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  
  created_at: string;
  updated_at: string;
  
  // Related food data (if food_id exists)
  foods?: {
    id: string;
    name: string;
    brand?: string;
    category?: string;
    nutrients_per_100g?: any;
  };
}

// Recipe with ingredients
export interface RecipeWithIngredients extends RecipeWithUser {
  ingredients: RecipeIngredient[];
}

// Recipe rating interface
export interface RecipeRating {
  id: string;
  recipe_id: string;
  user_id: string;
  rating: number; // 1-5
  review?: string;
  created_at: string;
  updated_at: string;
}

// Recipe collection interface
export interface RecipeCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  image_url?: string;
  visibility: RecipeVisibility;
  created_at: string;
  updated_at: string;
  
  // User info
  profiles?: {
    full_name?: string;
  };
}

// Recipe collection item interface
export interface RecipeCollectionItem {
  id: string;
  collection_id: string;
  recipe_id: string;
  added_at: string;
  
  // Recipe data
  recipes?: RecipeWithUser;
}

// Recipe collection with items
export interface RecipeCollectionWithItems extends RecipeCollection {
  recipe_collection_items: RecipeCollectionItem[];
}

// Recipe favorite interface
export interface RecipeFavorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}

// Form data types for creating/updating recipes
export interface CreateRecipeData {
  name: string;
  description?: string;
  instructions?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings: number;
  difficulty?: RecipeDifficulty;
  visibility?: RecipeVisibility;
  image_url?: string;
  tags?: string[];
  category?: string;
  cuisine?: string;
  source_url?: string;
  notes?: string;
  ingredients?: CreateRecipeIngredientData[];
}

export interface UpdateRecipeData extends Partial<CreateRecipeData> {
  id: string;
}

export interface CreateRecipeIngredientData {
  food_id?: string;
  name: string;
  amount: number;
  unit: string;
  grams: number;
  preparation?: string;
  notes?: string;
  optional?: boolean;
}

export interface UpdateRecipeIngredientData extends Partial<CreateRecipeIngredientData> {
  id: string;
}

// Search and filter types
export interface RecipeSearchParams {
  search?: string;
  category?: string;
  cuisine?: string;
  difficulty?: RecipeDifficulty;
  maxTime?: number;
  minRating?: number;
  tags?: string[];
  visibility?: RecipeVisibility;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface RecipeSearchResult {
  recipes: RecipeWithUser[];
  total?: number;
  hasMore?: boolean;
}

// API response types
export interface RecipeApiResponse {
  recipe: RecipeWithIngredients;
  message?: string;
}

export interface RecipesApiResponse {
  recipes: RecipeWithUser[];
  message?: string;
}

export interface RecipeCollectionApiResponse {
  collection: RecipeCollectionWithItems;
  message?: string;
}

export interface RecipeCollectionsApiResponse {
  collections: RecipeCollectionWithItems[];
  message?: string;
}

export interface RecipeRatingApiResponse {
  rating: RecipeRating;
  message?: string;
}

export interface RecipeFavoriteApiResponse {
  is_favorited: boolean;
  message?: string;
}

// Common recipe categories and cuisines for dropdowns
export const RECIPE_CATEGORIES = [
  'Appetizer',
  'Main Course',
  'Side Dish',
  'Dessert',
  'Beverage',
  'Snack',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Soup',
  'Salad',
  'Sauce',
  'Marinade',
  'Dressing'
] as const;

export const RECIPE_CUISINES = [
  'American',
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Thai',
  'French',
  'Greek',
  'Mediterranean',
  'Middle Eastern',
  'Korean',
  'Vietnamese',
  'Spanish',
  'German',
  'British',
  'Brazilian',
  'Moroccan',
  'Ethiopian',
  'Caribbean'
] as const;

export const RECIPE_TAGS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'low-carb',
  'keto',
  'paleo',
  'whole30',
  'low-sodium',
  'high-protein',
  'low-fat',
  'sugar-free',
  'nut-free',
  'soy-free',
  'egg-free',
  'spicy',
  'mild',
  'comfort-food',
  'healthy',
  'quick',
  'easy',
  'make-ahead',
  'freezer-friendly',
  'one-pot',
  'no-cook',
  'grilled',
  'baked',
  'fried',
  'steamed',
  'raw'
] as const;

export type RecipeCategory = typeof RECIPE_CATEGORIES[number];
export type RecipeCuisine = typeof RECIPE_CUISINES[number];
export type RecipeTag = typeof RECIPE_TAGS[number];