"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Minus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FoodImage } from "@/components/ui/food-image";
import { cn } from "@/lib/utils";

export interface SelectedFood {
  id: string;
  name: string;
  brand?: string;
  image_url?: string;
  quantity: number;
  unit: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  image_url?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

interface BulkFoodSelectorProps {
  foods: Food[];
  selectedFoods: SelectedFood[];
  onSelectionChange: (foods: SelectedFood[]) => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function BulkFoodSelector({
  foods,
  selectedFoods,
  onSelectionChange,
  onSearch,
  isLoading = false,
  className,
}: BulkFoodSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Initialize quantities for selected foods
  useEffect(() => {
    const newQuantities: Record<string, number> = {};
    selectedFoods.forEach(food => {
      newQuantities[food.id] = food.quantity;
    });
    setQuantities(newQuantities);
  }, [selectedFoods]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const isSelected = (foodId: string) => {
    return selectedFoods.some(f => f.id === foodId);
  };

  const toggleFood = (food: Food) => {
    if (isSelected(food.id)) {
      // Remove from selection
      const updated = selectedFoods.filter(f => f.id !== food.id);
      onSelectionChange(updated);
    } else {
      // Add to selection with default quantity
      const defaultQuantity = 100;
      const newFood: SelectedFood = {
        ...food,
        quantity: defaultQuantity,
        unit: 'g',
      };
      onSelectionChange([...selectedFoods, newFood]);
      setQuantities(prev => ({ ...prev, [food.id]: defaultQuantity }));
    }
  };

  const updateQuantity = (foodId: string, quantity: number) => {
    if (quantity <= 0) return;
    
    setQuantities(prev => ({ ...prev, [foodId]: quantity }));
    
    const updated = selectedFoods.map(food => 
      food.id === foodId ? { ...food, quantity } : food
    );
    onSelectionChange(updated);
  };

  const removeSelected = (foodId: string) => {
    const updated = selectedFoods.filter(f => f.id !== foodId);
    onSelectionChange(updated);
    setQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[foodId];
      return newQuantities;
    });
  };

  const clearAll = () => {
    onSelectionChange([]);
    setQuantities({});
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
    <div className={cn("space-y-4", className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search foods to add..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Foods Summary */}
      {selectedFoods.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Selected Foods ({selectedFoods.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Selected foods list */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFoods.map((food) => (
                <div key={food.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                  <FoodImage
                    src={food.image_url}
                    alt={food.name}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{food.name}</p>
                    {food.brand && (
                      <p className="text-xs text-muted-foreground truncate">{food.brand}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(food.id, Math.max(10, (quantities[food.id] || food.quantity) - 10))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={quantities[food.id] || food.quantity}
                      onChange={(e) => updateQuantity(food.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-6 text-xs text-center"
                      min="1"
                    />
                    <span className="text-xs text-muted-foreground">g</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(food.id, (quantities[food.id] || food.quantity) + 10)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeSelected(food.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Nutrition totals */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm font-medium">{Math.round(totals.calories)}</p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
              <div>
                <p className="text-sm font-medium">{Math.round(totals.protein)}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div>
                <p className="text-sm font-medium">{Math.round(totals.carbs)}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div>
                <p className="text-sm font-medium">{Math.round(totals.fat)}g</p>
                <p className="text-xs text-muted-foreground">Fat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Foods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Foods</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="w-8 h-8 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : foods.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? "No foods found for your search" : "Start typing to search for foods"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {foods.map((food) => {
                const selected = isSelected(food.id);
                return (
                  <div
                    key={food.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selected 
                        ? "bg-primary/10 border-primary" 
                        : "hover:bg-muted/50 border-border"
                    )}
                    onClick={() => toggleFood(food)}
                  >
                    <FoodImage
                      src={food.image_url}
                      alt={food.name}
                      width={48}
                      height={48}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{food.name}</p>
                      {food.brand && (
                        <p className="text-sm text-muted-foreground truncate">{food.brand}</p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span>{food.calories_per_100g} cal</span>
                        <span>{food.protein_per_100g}g protein</span>
                      </div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      selected 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-muted-foreground"
                    )}>
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}