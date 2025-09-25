"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FoodImage } from "@/components/ui/food-image";
import { toast } from 'sonner';
import { MagnifyingGlassIcon, PlusIcon } from "@radix-ui/react-icons";

type ImportedFood = {
  name: string;
  brand?: string;
  barcode: string;
  nutrients_per_100g: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
  };
  serving_sizes: Array<{ name: string; grams: number }>;
  image_url?: string;
};

export default function ImportPage() {
  const [barcode, setBarcode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchResult, setSearchResult] = useState<ImportedFood | null>(null);
  
  const supabase = createClientComponentClient();

  const searchOpenFoodFacts = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcode.trim()) {
      toast.error("Please enter a barcode");
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      // First check if the food already exists in our database
      const { data: existingFood } = await supabase
        .from("foods")
        .select("id, name, brand")
        .eq("barcode", barcode)
        .single();

      if (existingFood) {
        toast.error(`Food "${existingFood.name}" already exists in database`);
        setIsSearching(false);
        return;
      }

      // Search Open Food Facts
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 0) {
        toast.error("Product not found in Open Food Facts");
        setIsSearching(false);
        return;
      }

      const product = data.product;
      
      // Extract nutrition data
      const nutriments = product.nutriments || {};
      
      const importedFood: ImportedFood = {
        name: product.product_name || product.product_name_en || "Unknown Product",
        brand: product.brands?.split(",")[0]?.trim() || undefined,
        barcode: barcode,
        nutrients_per_100g: {
          calories_kcal: nutriments["energy-kcal_100g"] || nutriments["energy_100g"] / 4.184 || 0,
          protein_g: nutriments["proteins_100g"] || 0,
          carbs_g: nutriments["carbohydrates_100g"] || 0,
          fat_g: nutriments["fat_100g"] || 0,
          fiber_g: nutriments["fiber_100g"] || undefined,
          sugar_g: nutriments["sugars_100g"] || undefined,
          sodium_mg: nutriments["sodium_100g"] ? nutriments["sodium_100g"] * 1000 : undefined,
        },
        serving_sizes: [
          { name: "100g", grams: 100 },
          ...(product.serving_size ? [{ 
            name: `1 serving (${product.serving_size})`, 
            grams: parseFloat(product.serving_size.replace(/[^\d.]/g, "")) || 100 
          }] : [])
        ],
        image_url: product.image_url || product.image_front_url || undefined,
      };

      setSearchResult(importedFood);
      toast.success("Product found in Open Food Facts!");
    } catch (error: any) {
      console.error("Error searching Open Food Facts:", error);
      toast.error("Failed to search Open Food Facts");
    } finally {
      setIsSearching(false);
    }
  };

  const importFood = async () => {
    if (!searchResult) return;

    setIsImporting(true);

    try {
      const { error } = await supabase.from("foods").insert({
        name: searchResult.name,
        brand: searchResult.brand || null,
        barcode: searchResult.barcode,
        source: "openfoodfacts",
        verified: false,
        serving_sizes: searchResult.serving_sizes,
        nutrients_per_100g: searchResult.nutrients_per_100g,
        nutrients_per_serving: {
          calories_kcal: (searchResult.nutrients_per_100g.calories_kcal * searchResult.serving_sizes[0].grams) / 100,
          protein_g: (searchResult.nutrients_per_100g.protein_g * searchResult.serving_sizes[0].grams) / 100,
          carbs_g: (searchResult.nutrients_per_100g.carbs_g * searchResult.serving_sizes[0].grams) / 100,
          fat_g: (searchResult.nutrients_per_100g.fat_g * searchResult.serving_sizes[0].grams) / 100,
          fiber_g: searchResult.nutrients_per_100g.fiber_g ? (searchResult.nutrients_per_100g.fiber_g * searchResult.serving_sizes[0].grams) / 100 : undefined,
          sugar_g: searchResult.nutrients_per_100g.sugar_g ? (searchResult.nutrients_per_100g.sugar_g * searchResult.serving_sizes[0].grams) / 100 : undefined,
          sodium_mg: searchResult.nutrients_per_100g.sodium_mg ? (searchResult.nutrients_per_100g.sodium_mg * searchResult.serving_sizes[0].grams) / 100 : undefined,
        },
        category: "Imported",
      });

      if (error) {
        throw error;
      }

      toast.success("Food imported successfully!");
      setSearchResult(null);
      setBarcode("");
    } catch (error: any) {
      console.error("Error importing food:", error);
      toast.error("Failed to import food: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Import from Open Food Facts</h1>
        <Button variant="outline" asChild>
          <a href="/admin">Back to Admin</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search by Barcode</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={searchOpenFoodFacts} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter barcode (e.g., 3017620422003)"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : (
                <>
                  <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Import Preview</CardTitle>
              <Badge variant="outline">Open Food Facts</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg">{searchResult.name}</h3>
                {searchResult.brand && (
                  <p className="text-muted-foreground">{searchResult.brand}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Barcode: {searchResult.barcode}
                </p>
              </div>
              
              <div className="flex justify-end">
                <FoodImage 
                  src={searchResult.image_url} 
                  alt={searchResult.name}
                  width={96}
                  height={96}
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Nutrition (per 100g)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Calories:</span> {Math.round(searchResult.nutrients_per_100g.calories_kcal)} kcal
                </div>
                <div>
                  <span className="font-medium">Protein:</span> {searchResult.nutrients_per_100g.protein_g.toFixed(1)}g
                </div>
                <div>
                  <span className="font-medium">Carbs:</span> {searchResult.nutrients_per_100g.carbs_g.toFixed(1)}g
                </div>
                <div>
                  <span className="font-medium">Fat:</span> {searchResult.nutrients_per_100g.fat_g.toFixed(1)}g
                </div>
                {searchResult.nutrients_per_100g.fiber_g && (
                  <div>
                    <span className="font-medium">Fiber:</span> {searchResult.nutrients_per_100g.fiber_g.toFixed(1)}g
                  </div>
                )}
                {searchResult.nutrients_per_100g.sugar_g && (
                  <div>
                    <span className="font-medium">Sugar:</span> {searchResult.nutrients_per_100g.sugar_g.toFixed(1)}g
                  </div>
                )}
                {searchResult.nutrients_per_100g.sodium_mg && (
                  <div>
                    <span className="font-medium">Sodium:</span> {Math.round(searchResult.nutrients_per_100g.sodium_mg)}mg
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Serving Sizes</h4>
              <div className="flex flex-wrap gap-2">
                {searchResult.serving_sizes.map((serving, index) => (
                  <Badge key={index} variant="outline">
                    {serving.name} ({serving.grams}g)
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSearchResult(null)}>
                Cancel
              </Button>
              <Button onClick={importFood} disabled={isImporting}>
                {isImporting ? "Importing..." : (
                  <>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Import Food
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}