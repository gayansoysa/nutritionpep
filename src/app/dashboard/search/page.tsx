"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MagnifyingGlassIcon, CameraIcon, HeartIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import AddItemForm from "../(components)/AddItemForm";
import { FoodSearchSkeleton } from "@/components/ui/food-search-skeleton";
import { SlideInFromBottom } from "@/components/ui/success-animation";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { SearchErrorBoundary } from "@/components/ui/error-boundary";
import { apiClient } from "@/lib/utils/api-client";

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
  isExternal?: boolean;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const barcodeParam = searchParams.get("barcode");
  const foodIdParam = searchParams.get("food_id");
  const nameParam = searchParams.get("name");
  const mealParam = searchParams.get("meal") as "breakfast" | "lunch" | "dinner" | "snack" | null;
  
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [favoritesFoods, setFavoritesFoods] = useState<Food[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [isAddingExternalFood, setIsAddingExternalFood] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isExternal, setIsExternal] = useState(false);
  
  const RESULTS_PER_PAGE = 20;
  
  // Memoize Supabase client to prevent re-creation
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  
  const fetchUserFavorites = useCallback(async () => {
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
  }, []);

  // Fetch user's favorites on component mount
  useEffect(() => {
    fetchUserFavorites();
  }, [fetchUserFavorites]);
  
  // If barcode is provided in URL, search for it on load
  useEffect(() => {
    if (barcodeParam) {
      searchByBarcode(barcodeParam);
    }
  }, [barcodeParam]);
  
  // If food_id is provided in URL, fetch the specific food
  useEffect(() => {
    if (foodIdParam) {
      fetchFoodById(foodIdParam);
    }
  }, [foodIdParam]);
  
  const handleSearch = useCallback(async (e: React.FormEvent, page: number = 0) => {
    e?.preventDefault();
    
    if (!query.trim()) return;
    
    console.log("Starting search for:", query, "page:", page);
    setIsSearching(true);
    
    // Reset results only for new search (page 0)
    if (page === 0) {
      setResults([]);
      setCurrentPage(0);
      setTotalResults(0);
      setHasMore(false);
      setIsExternal(false);
    }
    
    try {
      // Check if query looks like a barcode (all digits)
      if (/^\d+$/.test(query)) {
        await searchByBarcode(query);
        return;
      }
      
      // Use the paginated search API
      const searchResponse = await fetch(
        `/api/foods/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${RESULTS_PER_PAGE}&includeExternal=true`
      );
      const searchData = await searchResponse.json();
      
      if (!searchResponse.ok) {
        throw new Error(searchData.error || 'Search failed');
      }
      
      console.log("Search response:", searchData);
      
      if (searchData.data && searchData.data.length > 0) {
        setResults(searchData.data);
        setCurrentPage(page);
        setTotalResults(searchData.total);
        setHasMore(searchData.hasMore);
        setIsExternal(searchData.isExternal || false);
        
        if (searchData.isExternal) {
          toast.success(`Found ${searchData.data.length} foods from ${searchData.source || 'external'} database`);
        } else {
          toast.success(`Found ${searchData.total} foods in database`);
        }
      } else {
        setResults([]);
        setCurrentPage(0);
        setTotalResults(0);
        setHasMore(false);
        setIsExternal(false);
        toast.info("No foods found. Try a different search term.");
      }
    } catch (error: any) {
      console.error("Search error:", error);
      setResults([]);
      setCurrentPage(0);
      setTotalResults(0);
      setHasMore(false);
      setIsExternal(false);
      toast.error("Search failed: " + error.message);
    } finally {
      setIsSearching(false);
    }
  }, [query, RESULTS_PER_PAGE]);
  
  const searchByBarcode = useCallback(async (barcode: string) => {
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
  }, []);

  const fetchFoodById = useCallback(async (foodId: string) => {
    setIsSearching(true);
    
    try {
      const data = await apiClient.get(`/api/foods/${encodeURIComponent(foodId)}`, {
        retries: 3,
        showRetryToast: true
      });
      
      if (data.food) {
        setResults([data.food]);
        
        // Auto-select the food if it's the only result
        setSelectedFood(data.food);
        
        // Set the query to the food name for better UX
        if (nameParam) {
          setQuery(decodeURIComponent(nameParam));
        } else {
          setQuery(data.food.name);
        }
      } else {
        toast.error(data.error || "Food not found");
        setResults([]);
      }
    } catch (error: any) {
      console.error("Food lookup error:", error);
      setResults([]);
      toast.error("Failed to load food details");
    } finally {
      setIsSearching(false);
    }
  }, [nameParam]);

  const handleExternalFoodSelection = useCallback(async (food: Food & { isExternal?: boolean; external_id?: string; source?: string }) => {
    setIsAddingExternalFood(true);
    
    try {

      
      // Add the external food to our database
      const response = await fetch('/api/foods/add-external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ food }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add food to database');
      }

      // Update the food in the results array to reflect it's now in the database
      setResults(prevResults => 
        prevResults.map(f => 
          f.id === food.id 
            ? { ...f, id: result.food_id, isExternal: false }
            : f
        )
      );

      // Automatically open the food for adding to diary
      const updatedFood = { ...food, id: result.food_id, isExternal: false };
      setSelectedFood(updatedFood);

      toast.success('Food added successfully! Now you can add it to your meal.');

    } catch (error: any) {
      console.error('Error adding external food:', error);
      toast.error(error.message || 'Failed to add food to database');
    } finally {
      setIsAddingExternalFood(false);
    }
  }, []);

  const handleNextPage = useCallback(() => {
    if (hasMore && !isSearching) {
      handleSearch(null as any, currentPage + 1);
    }
  }, [hasMore, isSearching, handleSearch, currentPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0 && !isSearching) {
      handleSearch(null as any, currentPage - 1);
    }
  }, [currentPage, isSearching, handleSearch]);
  
  return (
    <SearchErrorBoundary>
      <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Find Your Food</h1>
        <p className="text-muted-foreground">Search our database of thousands of foods</p>
      </div>
      
      {/* Search Card */}
          <Card className="glass-effect ">
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
        <Card className="glass-effect ">
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
        <Card className="glass-effect ">
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
                            <div className="text-xs text-muted-foreground">kcal/100g</div>
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
                            size="sm"
                            variant="ghost"
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
              <div className={`w-2 h-2 rounded-full ${results.some(f => f.isExternal) ? 'bg-blue-500' : 'bg-green-500'}`}></div>
              Found {results.length} result{results.length > 1 ? 's' : ''}
              {results.some(f => f.isExternal) && (
                <span className="text-sm font-normal text-muted-foreground">(from external sources)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((food, index) => (
                <SlideInFromBottom key={food.id} delay={index * 0.1}>
                  <div
                    className={`p-4 border border-border/50 rounded-xl transition-all duration-200 hover:shadow-sm relative ${isAddingExternalFood && food.isExternal ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {isAddingExternalFood && food.isExternal && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Adding to database...
                        </div>
                      </div>
                    )}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{food.name}</div>
                      {food.brand && (
                        <div className="text-sm text-muted-foreground mt-1">{food.brand}</div>
                      )}
                      <div className="flex gap-2 mt-2">
                        {food.category && (
                          <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {food.category}
                          </div>
                        )}
                        {food.isExternal && (
                          <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            External Source
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {Math.round(food.nutrients_per_100g.calories_kcal)}
                        </div>
                        <div className="text-xs text-muted-foreground">kcal per 100g</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    <div className="text-xs text-muted-foreground">Nutrition per 100g:</div>
                    <div className="flex gap-4 text-sm">
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
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      {food.isExternal ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExternalFoodSelection(food);
                          }}
                          disabled={isAddingExternalFood}
                          className="flex items-center gap-1"
                        >
                          <PlusIcon className="h-3 w-3" />
                          {isAddingExternalFood ? 'Adding...' : 'Add to Meal'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFood(food);
                          }}
                          className="flex items-center gap-1"
                        >
                          <PlusIcon className="h-3 w-3" />
                          Add to Diary
                        </Button>
                      )}
                    </div>
                    
                    {!food.isExternal && (
                      <FavoriteButton
                        foodId={food.id}
                        size="sm"
                        variant="ghost"
                      />
                    )}
                  </div>
                    </div>
                </SlideInFromBottom>
              ))}
            </div>
          </CardContent>
          {/* Pagination */}
          {results.length > 0 && (totalResults > RESULTS_PER_PAGE || currentPage > 0) && (
            <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {currentPage * RESULTS_PER_PAGE + 1}-{Math.min((currentPage + 1) * RESULTS_PER_PAGE, totalResults)} of {totalResults} results
                </span>
                {isExternal && (
                  <span className="text-blue-600">(external source)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0 || isSearching}
                  className="flex items-center gap-1"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore || isSearching}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
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