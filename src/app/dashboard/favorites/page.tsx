"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, Clock, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FoodImage } from "@/components/ui/food-image";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  const [userId, setUserId] = useState<string>('');
  const [selectedMeal, setSelectedMeal] = useState<string>("breakfast");
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

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
    updateFavoriteUsage,
    toggleFavorite 
  } = useFavorites(userId);

  const handleQuickAdd = async (item: any, meal: string) => {
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
      const calories_kcal = Math.round(item.calories_per_100g * multiplier);
      const protein_g = Math.round(item.protein_per_100g * multiplier * 10) / 10;
      const carbs_g = Math.round(item.carbs_per_100g * multiplier * 10) / 10;
      const fat_g = Math.round(item.fat_per_100g * multiplier * 10) / 10;
      const fiber_g = 0; // Default to 0 if not available

      // Prepare item object for diary entry
      const diaryItem = {
        item_id: crypto.randomUUID(),
        food_id: item.food_id,
        name: item.name,
        brand: item.brand || null,
        barcode: null,
        serving: unit,
        quantity: quantity,
        grams: quantity, // Assuming quantity is in grams
        nutrients_snapshot: {
          calories_kcal,
          protein_g,
          carbs_g,
          fat_g,
          fiber_g,
        }
      };

      // Prepare totals object
      const totals = {
        calories_kcal,
        protein_g,
        carbs_g,
        fat_g,
        fiber_g,
      };

      // Add to diary using the proper RPC function
      const { error } = await supabase.rpc("add_diary_item", {
        p_date: today,
        p_meal: meal,
        p_item: diaryItem,
        p_totals: totals
      });

      if (error) throw error;

      // Update favorite usage if it's a favorite
      if ('preferred_quantity' in item) {
        updateFavoriteUsage(item.food_id);
      }

      toast.success(`Added ${item.name} to ${meal}`);
      
    } catch (error: any) {
      console.error("Error adding food:", error);
      toast.error("Failed to add food to diary");
    } finally {
      setIsAdding(null);
    }
  };

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please log in to view your favorites</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            Favorites & Recent Foods
          </h1>
          <p className="text-muted-foreground">Quick access to your most used foods</p>
        </div>
      </div>

      <Tabs defaultValue="favorites" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Favorites ({favorites.length})
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent ({recentFoods.length})
          </TabsTrigger>
        </TabsList>

        {/* Meal Selection */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Add to:</span>
          <Select value={selectedMeal} onValueChange={setSelectedMeal}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start adding foods to your favorites for quick access
                </p>
                <Button asChild>
                  <a href="/dashboard/search">
                    <Plus className="h-4 w-4 mr-2" />
                    Search Foods
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((favorite) => (
                <Card key={favorite.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FoodImage
                        src={favorite.image_url}
                        alt={favorite.name}
                        width={64}
                        height={64}
                        className="rounded-lg flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm leading-tight line-clamp-2">
                              {favorite.name}
                            </h3>
                            {favorite.brand && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {favorite.brand}
                              </p>
                            )}
                          </div>
                          <FavoriteButton
                            foodId={favorite.food_id}
                            quantity={favorite.preferred_quantity}
                            unit={favorite.preferred_unit}
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                          />
                        </div>

                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Usual serving:</span>
                            <span className="font-medium">
                              {favorite.preferred_quantity}{favorite.preferred_unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Calories:</span>
                            <span className="font-medium">
                              {Math.round((favorite.calories_per_100g * favorite.preferred_quantity) / 100)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Used:</span>
                            <Badge variant="secondary" className="text-xs">
                              {favorite.use_count} times
                            </Badge>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => handleQuickAdd(favorite, selectedMeal)}
                          disabled={isAdding === favorite.food_id}
                        >
                          {isAdding === favorite.food_id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add to {selectedMeal}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recent Foods Tab */}
        <TabsContent value="recent" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentFoods.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No recent foods</h3>
                <p className="text-muted-foreground mb-4">
                  Foods you've logged recently will appear here
                </p>
                <Button asChild>
                  <a href="/dashboard/search">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Some Foods
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentFoods.map((recent) => (
                <Card key={recent.food_id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FoodImage
                        src={recent.image_url}
                        alt={recent.name}
                        width={64}
                        height={64}
                        className="rounded-lg flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm leading-tight line-clamp-2">
                              {recent.name}
                            </h3>
                            {recent.brand && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {recent.brand}
                              </p>
                            )}
                          </div>
                          <FavoriteButton
                            foodId={recent.food_id}
                            quantity={recent.last_quantity}
                            unit={recent.last_unit}
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                          />
                        </div>

                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Last serving:</span>
                            <span className="font-medium">
                              {recent.last_quantity}{recent.last_unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Calories:</span>
                            <span className="font-medium">
                              {Math.round((recent.calories_per_100g * recent.last_quantity) / 100)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Used:</span>
                            <Badge variant="secondary" className="text-xs">
                              {recent.use_count} times
                            </Badge>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => handleQuickAdd(recent, selectedMeal)}
                          disabled={isAdding === recent.food_id}
                        >
                          {isAdding === recent.food_id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add to {selectedMeal}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}