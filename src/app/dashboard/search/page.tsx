"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MagnifyingGlassIcon, CameraIcon } from "@radix-ui/react-icons";
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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const barcodeParam = searchParams.get("barcode");
  const mealParam = searchParams.get("meal") as "breakfast" | "lunch" | "dinner" | "snack" | null;
  
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  
  const supabase = createClientComponentClient();
  
  // If barcode is provided in URL, search for it on load
  useEffect(() => {
    if (barcodeParam) {
      searchByBarcode(barcodeParam);
    }
  }, [barcodeParam]);
  
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
      const response = await fetch(`/api/barcode/lookup?code=${encodeURIComponent(barcode)}`);
      const data = await response.json();
      
      if (response.ok && data.food) {
        setResults([data.food]);
        
        // Auto-select the food if it's the only result
        setSelectedFood(data.food);
      } else {
        toast.error(data.error || "Food not found");
        setResults([]);
      }
    } catch (error: any) {
      console.error("Barcode lookup error:", error);
      toast.error("Barcode lookup failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Find Your Food</h1>
        <p className="text-muted-foreground">Search our database of thousands of foods</p>
      </div>
      
      {/* Search Card */}
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
                <div
                  key={food.id}
                  className="p-4 border border-border/50 rounded-xl cursor-pointer hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                  onClick={() => setSelectedFood(food)}
                  style={{ animationDelay: `${index * 0.1}s` }}
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
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-primary">
                        {Math.round(food.nutrients_per_100g.calories_kcal)}
                      </div>
                      <div className="text-xs text-muted-foreground">kcal/100g</div>
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
              ))}
            </div>
          </CardContent>
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
  );
}