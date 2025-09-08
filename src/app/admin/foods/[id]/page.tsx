"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";

const servingSizeSchema = z.object({
  name: z.string().min(1, "Serving name is required"),
  grams: z.coerce.number().min(1, "Grams must be positive"),
});

const nutrientsSchema = z.object({
  calories_kcal: z.coerce.number().min(0),
  protein_g: z.coerce.number().min(0),
  carbs_g: z.coerce.number().min(0),
  fat_g: z.coerce.number().min(0),
  fiber_g: z.coerce.number().min(0).optional(),
  sugar_g: z.coerce.number().min(0).optional(),
  sodium_mg: z.coerce.number().min(0).optional(),
});

const foodFormSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  brand: z.string().optional(),
  category: z.string().optional(),
  barcode: z.string().optional(),
  source: z.enum(["curated", "usda", "openfoodfacts"]),
  verified: z.boolean(),
  serving_sizes: z.array(servingSizeSchema).min(1, "At least one serving size is required"),
  nutrients_per_100g: nutrientsSchema,
});

type FoodFormValues = z.infer<typeof foodFormSchema>;

export default function EditFoodPage() {
  const router = useRouter();
  const params = useParams();
  const foodId = params.id as string;
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<any>({
    // resolver: zodResolver(foodFormSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "serving_sizes",
  });

  useEffect(() => {
    if (foodId) {
      fetchFood();
    }
  }, [foodId]);

  const fetchFood = async () => {
    try {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .eq("id", foodId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        form.reset({
          name: data.name,
          brand: data.brand || "",
          category: data.category || "",
          barcode: data.barcode || "",
          source: data.source,
          verified: data.verified,
          serving_sizes: data.serving_sizes || [{ name: "100g", grams: 100 }],
          nutrients_per_100g: data.nutrients_per_100g || {
            calories_kcal: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            fiber_g: 0,
            sugar_g: 0,
            sodium_mg: 0,
          },
        });
      }
    } catch (error: any) {
      console.error("Error fetching food:", error);
      toast.error("Failed to load food data");
      router.push("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  async function onSubmit(data: FoodFormValues) {
    setIsSubmitting(true);
    
    try {
      // Calculate nutrients per serving for the first serving size
      const firstServing = data.serving_sizes[0];
      const nutrientsPerServing = {
        calories_kcal: (data.nutrients_per_100g.calories_kcal * firstServing.grams) / 100,
        protein_g: (data.nutrients_per_100g.protein_g * firstServing.grams) / 100,
        carbs_g: (data.nutrients_per_100g.carbs_g * firstServing.grams) / 100,
        fat_g: (data.nutrients_per_100g.fat_g * firstServing.grams) / 100,
        fiber_g: data.nutrients_per_100g.fiber_g ? (data.nutrients_per_100g.fiber_g * firstServing.grams) / 100 : undefined,
        sugar_g: data.nutrients_per_100g.sugar_g ? (data.nutrients_per_100g.sugar_g * firstServing.grams) / 100 : undefined,
        sodium_mg: data.nutrients_per_100g.sodium_mg ? (data.nutrients_per_100g.sodium_mg * firstServing.grams) / 100 : undefined,
      };

      const { error } = await supabase
        .from("foods")
        .update({
          name: data.name,
          brand: data.brand || null,
          category: data.category || null,
          barcode: data.barcode || null,
          source: data.source,
          verified: data.verified,
          serving_sizes: data.serving_sizes,
          nutrients_per_100g: data.nutrients_per_100g,
          nutrients_per_serving: nutrientsPerServing,
        })
        .eq("id", foodId);

      if (error) {
        throw error;
      }

      toast.success("Food updated successfully");
      router.push("/admin");
    } catch (error: any) {
      console.error("Error updating food:", error);
      toast.error("Failed to update food: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading food data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Food</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Food Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Chicken Breast" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tyson" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Meat & Poultry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 1234567890123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="curated">Curated</SelectItem>
                          <SelectItem value="usda">USDA</SelectItem>
                          <SelectItem value="openfoodfacts">Open Food Facts</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="verified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Verified</FormLabel>
                      <FormDescription>
                        Mark this food as verified and accurate
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nutrition Information (per 100g)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="nutrients_per_100g.calories_kcal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories (kcal) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nutrients_per_100g.protein_g"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nutrients_per_100g.carbs_g"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbs (g) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nutrients_per_100g.fat_g"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fat (g) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nutrients_per_100g.fiber_g"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiber (g)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nutrients_per_100g.sugar_g"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sugar (g)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nutrients_per_100g.sodium_mg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sodium (mg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Serving Sizes</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", grams: 0 })}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Serving
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-4">
                  <FormField
                    control={form.control}
                    name={`serving_sizes.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Serving Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1 cup, 1 piece" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`serving_sizes.${index}.grams`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel>Grams</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Food"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}