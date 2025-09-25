"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FoodLoggedAnimation } from "@/components/ui/success-animation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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

const addItemFormSchema = z.object({
  servingSize: z.coerce.number().positive().min(0.1, "Serving size must be at least 0.1g"),
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

type AddItemFormValues = z.infer<typeof addItemFormSchema>;

export default function AddItemForm({ 
  food, 
  onCancel,
  defaultMeal = "snack"
}: { 
  food: Food;
  onCancel: () => void;
  defaultMeal?: "breakfast" | "lunch" | "dinner" | "snack";
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const supabase = createClientComponentClient();
  
  const form = useForm({
    resolver: zodResolver(addItemFormSchema),
    defaultValues: {
      servingSize: 100, // Default to 100g
      meal: defaultMeal,
    },
  });
  
  // Watch form values to calculate nutrition preview
  const watchServingSize = form.watch("servingSize") as number || 100;
  
  // Calculate nutrition based on serving size (grams) relative to 100g
  const multiplier = watchServingSize / 100;
  
  const nutritionPreview = {
    calories_kcal: Math.round(food.nutrients_per_100g.calories_kcal * multiplier),
    protein_g: Math.round(food.nutrients_per_100g.protein_g * multiplier * 10) / 10,
    carbs_g: Math.round(food.nutrients_per_100g.carbs_g * multiplier * 10) / 10,
    fat_g: Math.round(food.nutrients_per_100g.fat_g * multiplier * 10) / 10,
    fiber_g: food.nutrients_per_100g.fiber_g 
      ? Math.round(food.nutrients_per_100g.fiber_g * multiplier * 10) / 10
      : undefined,
  };
  
  async function onSubmit(data: any) {
    setIsSubmitting(true);
    
    try {
      const today = new Date().toISOString().slice(0, 10);
      const grams = data.servingSize;
      
      // Create diary item
      const item = {
        food_id: food.id,
        name: food.name,
        brand: food.brand,
        barcode: food.barcode,
        serving: `${grams}g`, // Simple serving description
        quantity: 1, // Always 1 since we're using direct grams
        grams,
        item_id: crypto.randomUUID(),
        nutrients_snapshot: {
          calories_kcal: nutritionPreview.calories_kcal,
          protein_g: nutritionPreview.protein_g,
          carbs_g: nutritionPreview.carbs_g,
          fat_g: nutritionPreview.fat_g,
          fiber_g: nutritionPreview.fiber_g,
        }
      };
      
      // Store optimistic update in sessionStorage
      sessionStorage.setItem(
        "np_added_item_delta",
        JSON.stringify({
          totals: item.nutrients_snapshot,
          ts: Date.now()
        })
      );
      
      // Call API to add item to diary
      const response = await fetch("/api/diary/item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: today,
          meal: data.meal,
          item,
          totals: item.nutrients_snapshot,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add item");
      }
      
      // Track recent food usage
      try {
        await fetch("/api/recent-foods", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            food_id: food.id,
          }),
        });
      } catch (error) {
        // Don't fail the main operation if recent foods tracking fails
        console.warn("Failed to track recent food:", error);
      }
      
      // Show success animation
      setShowSuccessAnimation(true);
      
      // Redirect after animation
      setTimeout(() => {
        window.location.href = "/dashboard/today";
      }, 2000);
    } catch (error: any) {
      console.error("Error adding item:", error);
      toast.error(error.message || "Failed to add item");
      sessionStorage.removeItem("np_added_item_delta");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{food.name}</CardTitle>
        {food.brand && (
          <p className="text-sm text-muted-foreground">{food.brand}</p>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="servingSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serving Size (grams)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        min="0.1" 
                        placeholder="Enter serving size in grams"
                        {...field}
                        value={field.value?.toString() ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                    {food.serving_sizes?.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        <span>Common servings: </span>
                        {food.serving_sizes.slice(0, 3).map((serving, index) => (
                          <button
                            key={serving.name}
                            type="button"
                            className="text-primary hover:underline mr-2"
                            onClick={() => form.setValue("servingSize", serving.grams)}
                          >
                            {serving.name} ({serving.grams}g){index < Math.min(food.serving_sizes.length, 3) - 1 ? "," : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="meal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="bg-muted/50 p-4 rounded-md">
              <h3 className="font-medium mb-3">Nutrition Preview</h3>
              <div className="text-xs text-muted-foreground mb-2">
                Based on {watchServingSize}g serving (nutrition per 100g shown in search)
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Calories:</span>
                  <span className="font-medium">{nutritionPreview.calories_kcal} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span>Protein:</span>
                  <span className="font-medium">{nutritionPreview.protein_g}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbs:</span>
                  <span className="font-medium">{nutritionPreview.carbs_g}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Fat:</span>
                  <span className="font-medium">{nutritionPreview.fat_g}g</span>
                </div>
                {nutritionPreview.fiber_g !== undefined && (
                  <div className="flex justify-between">
                    <span>Fiber:</span>
                    <span className="font-medium">{nutritionPreview.fiber_g}g</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add to Diary"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      
      <FoodLoggedAnimation
        show={showSuccessAnimation}
        foodName={food.name}
        onComplete={() => {
          setShowSuccessAnimation(false);
          window.location.href = "/dashboard/today";
        }}
      />
    </Card>
  );
}