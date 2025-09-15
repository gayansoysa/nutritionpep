'use client';

import { useState, useEffect } from 'react';
import { RecipeWithUser, RecipeWithIngredients, RecipeSearchParams } from '@/lib/types/recipes';
import { toast } from 'sonner';

export function useRecipes(searchParams?: RecipeSearchParams) {
  const [recipes, setRecipes] = useState<RecipeWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async (params?: RecipeSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParamsObj = new URLSearchParams();
      
      if (params?.search) searchParamsObj.append('search', params.search);
      if (params?.category) searchParamsObj.append('category', params.category);
      if (params?.cuisine) searchParamsObj.append('cuisine', params.cuisine);
      if (params?.difficulty) searchParamsObj.append('difficulty', params.difficulty);
      if (params?.maxTime) searchParamsObj.append('maxTime', params.maxTime.toString());
      if (params?.minRating) searchParamsObj.append('minRating', params.minRating.toString());
      if (params?.tags?.length) searchParamsObj.append('tags', params.tags.join(','));
      if (params?.visibility) searchParamsObj.append('visibility', params.visibility);
      if (params?.userId) searchParamsObj.append('userId', params.userId);
      if (params?.limit) searchParamsObj.append('limit', params.limit.toString());
      if (params?.offset) searchParamsObj.append('offset', params.offset.toString());

      const response = await fetch(`/api/recipes?${searchParamsObj}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      
      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recipes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(searchParams);
  }, []);

  return {
    recipes,
    loading,
    error,
    refetch: (params?: RecipeSearchParams) => fetchRecipes(params || searchParams),
  };
}

export function useRecipe(id: string) {
  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipe = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/recipes/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Recipe not found');
        }
        throw new Error('Failed to fetch recipe');
      }
      
      const data = await response.json();
      setRecipe(data.recipe);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recipe';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  return {
    recipe,
    loading,
    error,
    refetch: fetchRecipe,
  };
}

export function useRecipeMutations() {
  const [loading, setLoading] = useState(false);

  const createRecipe = async (recipeData: any) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create recipe');
      }

      const data = await response.json();
      toast.success('Recipe created successfully!');
      return data.recipe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create recipe';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRecipe = async (id: string, recipeData: any) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update recipe');
      }

      const data = await response.json();
      toast.success('Recipe updated successfully!');
      return data.recipe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recipe';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete recipe');
      }

      toast.success('Recipe deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recipe';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const response = await fetch(`/api/recipes/${id}/favorite`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      const data = await response.json();
      toast.success(data.message);
      return data.is_favorited;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update favorite';
      toast.error(errorMessage);
      throw err;
    }
  };

  const rateRecipe = async (id: string, rating: number, review?: string) => {
    try {
      const response = await fetch(`/api/recipes/${id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, review }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rate recipe');
      }

      const data = await response.json();
      toast.success(data.message);
      return data.rating;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rate recipe';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    createRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    rateRecipe,
    loading,
  };
}