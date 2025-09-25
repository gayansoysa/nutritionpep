"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Clock, Heart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FoodImage } from "@/components/ui/food-image";
import { useFavorites, FavoriteFood, RecentFood } from "@/lib/hooks/useFavorites";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

interface QuickAddFavoritesProps {
  mealType?: "breakfast" | "lunch" | "dinner" | "snacks";
  className?: string;
  maxItems?: number;
}

export function QuickAddFavorites({ 
  mealType = "breakfast", 
  className,
  maxItems = 8 
}: QuickAddFavoritesProps) {
  const [userId, setUserId] = useState<string>('');
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []); // Memoize supabase client

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || '');
    };
    getUser();
  }, [supabase]);

  const { 
    favorites, 
    recentFoods, 
    isLoading, 
    updateFavoriteUsage 
  } = useFavorites(userId);

  // Memoize combined items to prevent unnecessary recalculations
  const quickItems = useMemo(() => {
    const favoritesCount = Math.floor(maxItems * 0.6);
    const recentCount = Math.ceil(maxItems * 0.4);
    
    return [
      ...favorites.slice(0, favoritesCount),
      ...recentFoods.slice(0, recentCount)
    ].slice(0, maxItems);
  }, [favorites, recentFoods, maxItems]);

  const handleQuickAdd = useCallback(async (item: FavoriteFood | (RecentFood & { food_id: string })) => {
    if (!userId || userId === '' || isAdding) return;

    setIsAdding(item.food_id);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Determine quantity and unit
      const quantity = 'preferred_quantity' in item 
        ? item.preferred_quantity 
        : item.last_quantity;
      const unit = 'preferred_unit' in item 
        ? item.preferred_unit 
        : item.last_unit;

      // Calculate nutrition values
      const multiplier = quantity / 100;
      const calories = Math.round(item.calories_per_100g * multiplier);
      const protein = Math.round(item.protein_per_100g * multiplier * 10) / 10;
      const carbs = Math.round(item.carbs_per_100g * multiplier * 10) / 10;
      const fat = Math.round(item.fat_per_100g * multiplier * 10) / 10;

      // Add to diary
      const { error } = await supabase
        .from("diary_entries")
        .insert({
          user_id: userId,
          food_id: item.food_id,
          date: today,
          meal: mealType,
          quantity,
          unit,
          calories,
          protein,
          carbs,
          fat,
        });

      if (error) throw error;

      // Update favorite usage if it's a favorite
      if ('preferred_quantity' in item) {
        updateFavoriteUsage(item.food_id);
      }

      toast.success(`Added ${item.name} to ${mealType}`);
      
      // Use router refresh instead of full page reload for better performance
      window.location.reload();
      
    } catch (error: any) {
      console.error("Error adding food:", error);
      toast.error("Failed to add food to diary");
    } finally {
      setIsAdding(null);
    }
  }, [userId, isAdding, supabase, mealType, updateFavoriteUsage]);

  if (!userId || userId === '' || isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Quick Add
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-2" />
                <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quickItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Quick Add
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No favorites or recent foods yet</p>
            <p className="text-xs mt-1">Start logging foods to see quick add options</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Quick Add
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {quickItems.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickItems.map((item) => {
            const isFavorite = 'preferred_quantity' in item;
            const quantity = isFavorite ? item.preferred_quantity : item.last_quantity;
            const unit = isFavorite ? item.preferred_unit : item.last_unit;
            const isCurrentlyAdding = isAdding === item.food_id;
            
            return (
              <div
                key={item.food_id}
                className="group relative"
              >
                <Button
                  variant="outline"
                  className={cn(
                    "h-auto p-3 flex flex-col items-center gap-2 w-full",
                    "hover:bg-muted/50 transition-colors",
                    isCurrentlyAdding && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleQuickAdd(item)}
                  disabled={isCurrentlyAdding}
                >
                  {/* Food Image */}
                  <div className="relative">
                    <FoodImage
                      src={item.image_url}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                    {/* Type indicator */}
                    <div className="absolute -top-1 -right-1">
                      {isFavorite ? (
                        <Heart className="h-3 w-3 text-red-500 fill-current" />
                      ) : (
                        <Clock className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  </div>

                  {/* Food Info */}
                  <div className="text-center min-h-[2.5rem] flex flex-col justify-center">
                    <p className="font-medium text-xs leading-tight line-clamp-2">
                      {item.name}
                    </p>
                    {item.brand && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.brand}
                      </p>
                    )}
                  </div>

                  {/* Quantity & Calories */}
                  <div className="text-center">
                    <p className="text-xs font-medium">
                      {quantity}{unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((item.calories_per_100g * quantity) / 100)} cal
                    </p>
                  </div>

                  {/* Add button overlay */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    {isCurrentlyAdding ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                    ) : (
                      <Plus className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </Button>
              </div>
            );
          })}
        </div>

        {/* View all link */}
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard/favorites">
              View All Favorites
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}