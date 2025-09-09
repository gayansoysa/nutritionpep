"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MagnifyingGlassIcon, CameraIcon, HeartIcon, PlusIcon, SwitchIcon } from "@radix-ui/react-icons";
import AddItemForm from "../(components)/AddItemForm";
import { FoodSearchSkeleton } from "@/components/ui/food-search-skeleton";
import { SlideInFromBottom } from "@/components/ui/success-animation";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { SearchErrorBoundary } from "@/components/ui/error-boundary";
import { apiClient } from "@/lib/utils/api-client";
import InfiniteFoodSearch from "../(components)/InfiniteFoodSearch";

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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const barcodeParam = searchParams.get("barcode");
  const mealParam = searchParams.get("meal") as "breakfast" | "lunch" | "dinner" | "snack" | null;
  
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [favoritesFoods, setFavoritesFoods] = useState<Food[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [useInfiniteScroll, setUseInfiniteScroll] = useState(true);
  
  const supabase = createSupabaseBrowserClient();
  
  // Fetch user's favorites on component mount
  useEffect(() => {
    fetchUserFavorites();
  }, []);
  
  // If barcode is provided in URL, search for it on load
  useEffect(() => {
    if (barcodeParam) {
      searchByBarcode(barcodeParam);
    }
  }, [barcodeParam]);
  
  const fetchUserFavorites = async () => {
    try {
      const data = await apiClient.get("/api/favorites", {
        showErrorToast: false, // Don't show error toast for favorites
        retries: 2
      });
      
      if (data.favorites) {
        const favoriteIds = new Set<string>(data.favorites.map((fav: any) => fav.foods.id as string));
        const favoriteFoods = data.favorites.map((fav: any) => fav.foods);
        setUserFavorites(favoriteIds);
        setFavoritesFoods(favoriteFoods);
      }
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      // Don't show error toast for favorites, as it's not critical for search functionality
    } finally {
      setIsLoadingFavorites(false);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsSearching(true);
    setResults([]);
    
    try {
      // Check if query looks like a barcode (all digits)
      if (/^\d+$/.test(query)) {
        await searchByBarcode(query);
        return;
      }
      
      // Otherwise do a text search
      const { data, error } = await supabase.rpc("search_foods", {
        q: query,
        max_results: 10
      });
      
      if (error) {
        throw error;
      }
      
      setResults(data || []);
      
      if ((data || []).length === 0) {
        toast.info("No foods found. Try a different search term.");
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Search failed: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };
  
  const searchByBarcode = async (barcode: string) => {
    setIsSearching(true);
    
    try {
      const data = await apiClient.get(`/api/barcode/lookup?code=${encodeURIComponent(barcode)}`, {
        retries: 3,
        showRetryToast: true
      });
      
      if (data.food) {
        setResults([data.food]);
        
        // Auto-select the food if it's the only result
        setSelectedFood(data.food);
      } else {
        toast.error(data.error || "Food not found");
        setResults([]);
      }
    } catch (error: any) {
      console.error("Barcode lookup error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <SearchErrorBoundary>
      <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold gradient-text">Find Your Food</h1>
            <p className="text-muted-foreground">Search our database of thousands of foods</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className={!useInfiniteScroll ? "font-medium" : "text-muted-foreground"}>
              Classic
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseInfiniteScroll(!useInfiniteScroll)}
              className="p-1"
            >
              <SwitchIcon className={`h-5 w-5 ${useInfiniteScroll ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <span className={useInfiniteScroll ? "font-medium" : "text-muted-foreground"}>
              Infinite
            </span>
          </div>
        </div>
      </div>
      
      {/* Infinite Scroll Search */}
      {useInfiniteScroll ? (
        <InfiniteFoodSearch
          onSelectFood={setSelectedFood}
          userFavorites={userFavorites}
          onToggleFavorite={(foodId, isFavorite) => {
            if (isFavorite) {
              setUserFavorites(prev => new Set([...prev, foodId]))
            } else {
              setUserFavorites(prev => {
                const newSet = new Set(prev)
                newSet.delete(foodId)
                return newSet
              })
              setFavoritesFoods(prev => prev.filter(f => f.id !== foodId))
            }
          }}
        />
      ) : (
        <>
          {/* Classic Search Card */}
          <Card className="glass-effect shadow-lg">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, brand, or barcode..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 text-lg border-2 focus:border-primary/50 transition-colors"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSearching}
              className="w-full h-12 text-lg font-medium shadow-md"
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Searching...
                </div>
              ) : (
                <>
                  <MagnifyingGlassIcon className="mr-2 h-5 w-5" />
                  Search Foods
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">Or scan a barcode</p>
              <Button variant="outline" size="lg" asChild className="shadow-sm">
                <a href="/dashboard/scan" className="flex items-center gap-2">
                  <CameraIcon className="h-5 w-5" />
                  Scan Barcode
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Favorites Loading State */}
      {isLoadingFavorites && (
        <Card className="glass-effect shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="h-5 w-5 text-red-500" />
              Your Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="p-3 border border-border/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-32 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="h-4 bg-muted rounded w-8 mb-1"></div>
                          <div className="h-3 bg-muted rounded w-6"></div>
                        </div>
                        <div className="h-6 w-6 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Favorites Section */}
      {!isLoadingFavorites && favoritesFoods.length > 0 && (
        <Card className="glass-effect shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="h-5 w-5 text-red-500" />
              Your Favorites
              <span className="text-sm font-normal text-muted-foreground">
                ({favoritesFoods.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {favoritesFoods.slice(0, 6).map((food, index) => (
                <SlideInFromBottom key={food.id} delay={index * 0.05}>
                  <div
                    className="p-3 border border-border/50 rounded-lg cursor-pointer hover:bg-accent/30 hover:border-border transition-all duration-200 hover:shadow-sm"
                    onClick={() => setSelectedFood(food)}
                  >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{food.name}</div>
                          {food.brand && (
                            <div className="text-xs text-muted-foreground mt-1">{food.brand}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary">
                              {Math.round(food.nutrients_per_100g.calories_kcal)}
                            </div>
                            <div className="text-xs text-muted-foreground">kcal</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFood(food);
                            }}
                            title="Quick Add to Diary"
                          >
                            <PlusIcon className="h-3 w-3" />
                          </Button>
                          <FavoriteButton
                            foodId={food.id}
                            foodName={food.name}
                            isFavorite={true}
                            size="sm"
                            variant="ghost"
                            onToggle={(isFavorite) => {
                              if (!isFavorite) {
                                setUserFavorites(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(food.id);
                                  return newSet;
                                });
                                setFavoritesFoods(prev => prev.filter(f => f.id !== food.id));
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                </SlideInFromBottom>
              ))}
            </div>
            {favoritesFoods.length > 6 && (
              <div className="mt-4 pt-3 border-t border-border/50 text-center">
                <Button variant="outline" size="sm" asChild>
                  <a href="/dashboard/favorites">
                    View All {favoritesFoods.length} Favorites
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Loading State */}
      {isSearching && (
        <FoodSearchSkeleton />
      )}
      
      {/* Results */}
      {results.length > 0 && !selectedFood && (
        <Card className="animate-bounce-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Found {results.length} result{results.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((food, index) => (
                <SlideInFromBottom key={food.id} delay={index * 0.1}>
                  <div
                    className="p-4 border border-border/50 rounded-xl cursor-pointer hover:bg-accent/30 hover:border-border transition-all duration-200 hover:shadow-sm"
                    onClick={() => setSelectedFood(food)}
                  >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{food.name}</div>
                      {food.brand && (
                        <div className="text-sm text-muted-foreground mt-1">{food.brand}</div>
                      )}
                      {food.category && (
                        <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full mt-2">
                          {food.category}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {Math.round(food.nutrients_per_100g.calories_kcal)}
                        </div>
                        <div className="text-xs text-muted-foreground">kcal/100g</div>
                      </div>
                      <FavoriteButton
                        foodId={food.id}
                        foodName={food.name}
                        isFavorite={userFavorites.has(food.id)}
                        size="sm"
                        variant="ghost"
                        onToggle={(isFavorite) => {
                          if (isFavorite) {
                            setUserFavorites(prev => new Set([...prev, food.id]));
                            setFavoritesFoods(prev => [...prev, food]);
                          } else {
                            setUserFavorites(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(food.id);
                              return newSet;
                            });
                            setFavoritesFoods(prev => prev.filter(f => f.id !== food.id));
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-muted-foreground">Protein:</span>
                      <span className="font-medium">{Math.round(food.nutrients_per_100g.protein_g)}g</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-muted-foreground">Carbs:</span>
                      <span className="font-medium">{Math.round(food.nutrients_per_100g.carbs_g)}g</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-muted-foreground">Fat:</span>
                      <span className="font-medium">{Math.round(food.nutrients_per_100g.fat_g)}g</span>
                    </div>
                  </div>
                    </div>
                </SlideInFromBottom>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}
      
      {selectedFood && (
        <div className="animate-bounce-in">
          <AddItemForm 
            food={selectedFood} 
            onCancel={() => setSelectedFood(null)}
            defaultMeal={mealParam || "breakfast"}
          />
        </div>
      )}
      </div>
    </SearchErrorBoundary>
  );
}