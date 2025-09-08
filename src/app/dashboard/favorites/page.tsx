"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartIcon, PlusIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { SubtleHover, SlideInFromBottom } from "@/components/ui/success-animation";
import AddItemForm from "../(components)/AddItemForm";

type Food = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  barcode?: string;
  serving_sizes: Array<{ name: string; grams: number }>;
  nutrients_per_100g: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
  };
};

type Favorite = {
  id: string;
  created_at: string;
  foods: Food;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/favorites", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch favorites");
      }

      setFavorites(data.favorites || []);
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
      toast.error("Failed to load favorites");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = (foodId: string) => {
    setFavorites(prev => prev.filter(fav => fav.foods.id !== foodId));
  };

  const handleQuickAdd = (food: Food) => {
    setSelectedFood(food);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">Your Favorites</h1>
          <p className="text-muted-foreground">Loading your favorite foods...</p>
        </div>
        
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="h-6 bg-muted rounded w-48 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                    <div className="h-5 bg-muted rounded w-20"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="h-6 bg-muted rounded w-12 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                    <div className="h-8 w-8 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-text flex items-center justify-center gap-2">
          <HeartIcon className="h-8 w-8 text-red-500" />
          Your Favorites
        </h1>
        <p className="text-muted-foreground">
          Quick access to your most-loved foods
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HeartIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">
              Start adding foods to your favorites for quick access
            </p>
            <Button asChild>
              <a href="/dashboard/search">
                <PlusIcon className="mr-2 h-4 w-4" />
                Find Foods to Favorite
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {favorites.map((favorite, index) => (
            <SlideInFromBottom key={favorite.id} delay={index * 0.1}>
              <SubtleHover>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{favorite.foods.name}</div>
                        {favorite.foods.brand && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {favorite.foods.brand}
                          </div>
                        )}
                        {favorite.foods.category && (
                          <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full mt-2">
                            {favorite.foods.category}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {Math.round(favorite.foods.nutrients_per_100g.calories_kcal)}
                          </div>
                          <div className="text-xs text-muted-foreground">kcal/100g</div>
                        </div>
                        <FavoriteButton
                          foodId={favorite.foods.id}
                          foodName={favorite.foods.name}
                          isFavorite={true}
                          size="sm"
                          variant="ghost"
                          onToggle={(isFavorite) => {
                            if (!isFavorite) {
                              handleRemoveFavorite(favorite.foods.id);
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground">Protein:</span>
                        <span className="font-medium">
                          {Math.round(favorite.foods.nutrients_per_100g.protein_g)}g
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-muted-foreground">Carbs:</span>
                        <span className="font-medium">
                          {Math.round(favorite.foods.nutrients_per_100g.carbs_g)}g
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-muted-foreground">Fat:</span>
                        <span className="font-medium">
                          {Math.round(favorite.foods.nutrients_per_100g.fat_g)}g
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50">
                      <Button
                        onClick={() => handleQuickAdd(favorite.foods)}
                        size="sm"
                        className="w-full"
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Quick Add to Diary
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </SubtleHover>
            </SlideInFromBottom>
          ))}
        </div>
      )}

      {selectedFood && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <AddItemForm 
              food={selectedFood} 
              onCancel={() => setSelectedFood(null)}
              defaultMeal="breakfast"
            />
          </div>
        </div>
      )}
    </div>
  );
}