"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { queryKeys, cacheTime } from '@/lib/react-query/client';
import { toast } from 'sonner';

export interface FavoriteFood {
  id: string;
  food_id: string;
  name: string;
  brand?: string;
  image_url?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  preferred_quantity: number;
  preferred_unit: string;
  use_count: number;
  last_used_at: string;
}

export interface RecentFood {
  food_id: string;
  name: string;
  brand?: string;
  image_url?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  last_quantity: number;
  last_unit: string;
  use_count: number;
  last_used_at: string;
}

export function useFavorites(userId?: string) {
  const supabase = createSupabaseBrowserClient();
  const queryClient = useQueryClient();

  // Get user's favorite foods
  const {
    data: favorites = [],
    isLoading: favoritesLoading,
    error: favoritesError,
  } = useQuery({
    queryKey: queryKeys.user.favorites(userId || ''),
    queryFn: async () => {
      if (!userId || userId === '') return [];
      
      const { data, error } = await supabase.rpc('get_user_favorites', {
        user_uuid: userId
      });

      if (error) {
        // If function doesn't exist, fallback to direct table query
        if (error.code === '42883') {
          console.warn('get_user_favorites function not found, using fallback');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('user_favorites')
            .select(`
              id,
              food_id,
              preferred_quantity,
              preferred_unit,
              use_count,
              last_used_at,
              foods (
                name,
                brand,
                image_path,
                nutrients_per_100g
              )
            `)
            .eq('user_id', userId)
            .order('last_used_at', { ascending: false })
            .limit(20); // Add limit for better performance

          if (fallbackError) {
            // If table doesn't exist, return empty array
            if (fallbackError.code === '42P01') {
              console.warn('user_favorites table not found, returning empty array');
              return [];
            }
            throw fallbackError;
          }

          // Transform data to match expected format
          return fallbackData?.map(item => {
            const food = Array.isArray(item.foods) ? item.foods[0] : item.foods;
            const nutrients = food?.nutrients_per_100g || {};
            return {
              id: item.id,
              food_id: item.food_id,
              name: food?.name || '',
              brand: food?.brand || '',
              image_url: food?.image_path || '',
              calories_per_100g: nutrients.calories_kcal || 0,
              protein_per_100g: nutrients.protein_g || 0,
              carbs_per_100g: nutrients.carbs_g || 0,
              fat_per_100g: nutrients.fat_g || 0,
              preferred_quantity: item.preferred_quantity,
              preferred_unit: item.preferred_unit,
              use_count: item.use_count,
              last_used_at: item.last_used_at,
            };
          }) || [];
        }
        throw error;
      }
      return data as FavoriteFood[];
    },
    enabled: !!userId && userId !== '',
    staleTime: cacheTime.long, // Increased cache time
    gcTime: cacheTime.veryLong, // Keep in cache longer
  });

  // Get user's recent foods (excluding favorites)
  const {
    data: recentFoods = [],
    isLoading: recentLoading,
    error: recentError,
  } = useQuery({
    queryKey: queryKeys.user.recentFoods(userId || ''),
    queryFn: async () => {
      if (!userId || userId === '') return [];
      
      const { data, error } = await supabase.rpc('get_user_recent_foods', {
        user_uuid: userId,
        limit_count: 15 // Reduced limit for better performance
      });

      if (error) {
        // If function doesn't exist, fallback to direct table query
        if (error.code === '42883') {
          console.warn('get_user_recent_foods function not found, using fallback');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('recent_foods')
            .select(`
              food_id,
              last_used_at,
              usage_count,
              foods (
                name,
                brand,
                image_path,
                nutrients_per_100g
              )
            `)
            .eq('user_id', userId)
            .order('last_used_at', { ascending: false })
            .limit(15); // Reduced limit for better performance

          if (fallbackError) {
            // If table doesn't exist, return empty array
            if (fallbackError.code === '42P01') {
              console.warn('recent_foods table not found, returning empty array');
              return [];
            }
            throw fallbackError;
          }

          // Transform data to match expected format
          return fallbackData?.map(item => {
            const food = Array.isArray(item.foods) ? item.foods[0] : item.foods;
            const nutrients = food?.nutrients_per_100g || {};
            return {
              food_id: item.food_id,
              name: food?.name || '',
              brand: food?.brand || '',
              image_url: food?.image_path || '',
              calories_per_100g: nutrients.calories_kcal || 0,
              protein_per_100g: nutrients.protein_g || 0,
              carbs_per_100g: nutrients.carbs_g || 0,
              fat_per_100g: nutrients.fat_g || 0,
              last_quantity: 100,
              last_unit: 'g',
              use_count: item.usage_count,
              last_used_at: item.last_used_at,
            };
          }) || [];
        }
        throw error;
      }
      return data as RecentFood[];
    },
    enabled: !!userId && userId !== '',
    staleTime: cacheTime.medium, // Increased cache time
    gcTime: cacheTime.long, // Keep in cache longer
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ 
      foodId, 
      quantity = 100, 
      unit = 'g' 
    }: { 
      foodId: string; 
      quantity?: number; 
      unit?: string; 
    }) => {
      if (!userId || userId === '') throw new Error('User not authenticated');
      
      const { data, error } = await supabase.rpc('toggle_favorite', {
        user_uuid: userId,
        food_uuid: foodId,
        quantity,
        unit_name: unit
      });

      if (error) throw error;
      return data as boolean; // Returns true if added, false if removed
    },
    onSuccess: (isNowFavorite, { foodId }) => {
      // Invalidate and refetch favorites and recent foods
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.user.favorites(userId || '') 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.user.recentFoods(userId || '') 
      });

      toast.success(
        isNowFavorite 
          ? 'Added to favorites' 
          : 'Removed from favorites'
      );
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    },
  });

  // Update favorite usage mutation
  const updateUsageMutation = useMutation({
    mutationFn: async (foodId: string) => {
      if (!userId || userId === '') throw new Error('User not authenticated');
      
      const { error } = await supabase.rpc('update_favorite_usage', {
        user_uuid: userId,
        food_uuid: foodId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      // Silently update cache without showing toast
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.user.favorites(userId || '') 
      });
    },
    onError: (error) => {
      console.error('Error updating favorite usage:', error);
      // Don't show error toast for usage updates
    },
  });

  // Check if a food is favorited
  const isFavorite = (foodId: string): boolean => {
    return favorites.some(fav => fav.food_id === foodId);
  };

  // Get favorite by food ID
  const getFavorite = (foodId: string): FavoriteFood | undefined => {
    return favorites.find(fav => fav.food_id === foodId);
  };

  // Toggle favorite function
  const toggleFavorite = (foodId: string, quantity?: number, unit?: string) => {
    toggleFavoriteMutation.mutate({ foodId, quantity, unit });
  };

  // Update usage when food is logged
  const updateFavoriteUsage = (foodId: string) => {
    if (isFavorite(foodId)) {
      updateUsageMutation.mutate(foodId);
    }
  };

  return {
    // Data
    favorites,
    recentFoods,
    
    // Loading states
    favoritesLoading,
    recentLoading,
    isLoading: favoritesLoading || recentLoading,
    
    // Error states
    favoritesError,
    recentError,
    error: favoritesError || recentError,
    
    // Mutation states
    isToggling: toggleFavoriteMutation.isPending,
    isUpdatingUsage: updateUsageMutation.isPending,
    
    // Helper functions
    isFavorite,
    getFavorite,
    toggleFavorite,
    updateFavoriteUsage,
    
    // Combined quick access foods (favorites + recent)
    quickAccessFoods: [...favorites, ...recentFoods.map(rf => ({
      id: `recent-${rf.food_id}`,
      food_id: rf.food_id,
      name: rf.name,
      brand: rf.brand,
      image_url: rf.image_url,
      calories_per_100g: rf.calories_per_100g,
      protein_per_100g: rf.protein_per_100g,
      carbs_per_100g: rf.carbs_per_100g,
      fat_per_100g: rf.fat_per_100g,
      preferred_quantity: rf.last_quantity,
      preferred_unit: rf.last_unit,
      use_count: rf.use_count,
      last_used_at: rf.last_used_at,
    }))],
  };
}

// Hook for checking if a specific food is favorited (lightweight)
export function useIsFavorite(userId: string, foodId: string) {
  const supabase = createSupabaseBrowserClient();
  
  return useQuery({
    queryKey: ['favorite-status', userId, foodId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('food_id', foodId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && userId !== '' && !!foodId,
    staleTime: cacheTime.medium,
  });
}