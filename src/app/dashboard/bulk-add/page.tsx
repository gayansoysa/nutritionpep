"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BulkFoodSelector, SelectedFood, Food } from "@/components/ui/bulk-food-selector";
import { CopyMealDialog } from "@/components/ui/copy-meal-dialog";
import { MealTemplatesDialog } from "@/components/ui/meal-templates-dialog";
import { ArrowLeft, Plus, Copy, BookOpen } from "lucide-react";
import { toast } from 'sonner';

export default function BulkAddPage() {
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  // Set initial meal from URL parameter
  useEffect(() => {
    const mealParam = searchParams.get('meal');
    if (mealParam && ['breakfast', 'lunch', 'dinner', 'snack'].includes(mealParam)) {
      setSelectedMeal(mealParam);
    }
  }, [searchParams]);

  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setAvailableFoods([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("search_foods", {
        q: query,
        max_results: 20
      });

      if (error) throw error;

      setAvailableFoods(data || []);
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Failed to search foods");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (selectedFoods.length === 0) {
      toast.error("Please select at least one food item");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Add each food item using the add_diary_item RPC function
      for (const food of selectedFoods) {
        // Calculate nutrition values
        const multiplier = food.quantity / 100;
        const calories_kcal = Math.round(food.calories_per_100g * multiplier);
        const protein_g = Math.round(food.protein_per_100g * multiplier * 10) / 10;
        const carbs_g = Math.round(food.carbs_per_100g * multiplier * 10) / 10;
        const fat_g = Math.round(food.fat_per_100g * multiplier * 10) / 10;
        const fiber_g = 0; // Default to 0 if not available

        // Prepare item object
        const item = {
          item_id: crypto.randomUUID(),
          food_id: food.id,
          name: food.name,
          brand: food.brand || null,
          barcode: null, // Not available in SelectedFood interface
          serving: food.unit,
          quantity: food.quantity,
          grams: food.quantity, // Assuming quantity is in grams
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

        // Add item using RPC function
        const { error } = await supabase.rpc("add_diary_item", {
          p_date: today,
          p_meal: selectedMeal,
          p_item: item,
          p_totals: totals
        });

        if (error) throw error;
      }

      toast.success(`Added ${selectedFoods.length} foods to ${selectedMeal}`);
      
      // Clear selection and redirect
      setSelectedFoods([]);
      router.push("/dashboard");
      
    } catch (error: any) {
      console.error("Error adding foods:", error);
      toast.error("Failed to add foods to diary");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMealCopiedOrApplied = () => {
    // Refresh the page to show updated meal
    setRefreshKey(prev => prev + 1);
    // Optionally redirect to today's page to see the changes
    router.push("/dashboard/today");
  };

  const getTotalNutrition = () => {
    return selectedFoods.reduce((totals, food) => {
      const multiplier = food.quantity / 100;
      return {
        calories: totals.calories + (food.calories_per_100g * multiplier),
        protein: totals.protein + (food.protein_per_100g * multiplier),
        carbs: totals.carbs + (food.carbs_per_100g * multiplier),
        fat: totals.fat + (food.fat_per_100g * multiplier),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const totals = getTotalNutrition();

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
          <h1 className="text-2xl font-bold">Bulk Add Foods</h1>
          <p className="text-muted-foreground">Add multiple foods to your diary at once</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main selector */}
        <div className="lg:col-span-2">
          <BulkFoodSelector
            foods={availableFoods}
            selectedFoods={selectedFoods}
            onSelectionChange={setSelectedFoods}
            onSearch={searchFoods}
            isLoading={isLoading}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Meal Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add to Meal</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedFoods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-lg">{Math.round(totals.calories)}</p>
                    <p className="text-muted-foreground">Calories</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-lg">{selectedFoods.length}</p>
                    <p className="text-muted-foreground">Foods</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Protein:</span>
                    <span className="font-medium">{Math.round(totals.protein)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbs:</span>
                    <span className="font-medium">{Math.round(totals.carbs)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fat:</span>
                    <span className="font-medium">{Math.round(totals.fat)}g</span>
                  </div>
                </div>

                <Button
                  onClick={handleBulkAdd}
                  disabled={selectedFoods.length === 0 || isSubmitting}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isSubmitting 
                    ? "Adding..." 
                    : `Add ${selectedFoods.length} Food${selectedFoods.length !== 1 ? 's' : ''}`
                  }
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <CopyMealDialog 
                targetMeal={selectedMeal}
                onMealCopied={handleMealCopiedOrApplied}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy from Previous Day
                </Button>
              </CopyMealDialog>
              
              <MealTemplatesDialog
                targetMeal={selectedMeal}
                onTemplateApplied={handleMealCopiedOrApplied}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Use Meal Template
                </Button>
              </MealTemplatesDialog>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/dashboard/favorites")}
              >
                Add from Favorites
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/dashboard/recent")}
              >
                Add Recent Foods
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}