"use client";

import { useState, useEffect } from "react";
import { Calendar, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FoodImage } from "@/components/ui/food-image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/lib/utils/toast";
import { cn } from "@/lib/utils";

interface DiaryEntry {
  id: string;
  date: string;
  meal_type: string;
  items: any[];
  totals: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
}

interface CopyMealDialogProps {
  targetMeal: string;
  targetDate?: string;
  onMealCopied?: () => void;
  children?: React.ReactNode;
}

export function CopyMealDialog({ 
  targetMeal, 
  targetDate = new Date().toISOString().split('T')[0],
  onMealCopied,
  children 
}: CopyMealDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableMeals, setAvailableMeals] = useState<DiaryEntry[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<DiaryEntry | null>(null);

  const supabase = createSupabaseBrowserClient();

  // Load available dates when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableDates();
    }
  }, [isOpen]);

  // Load meals for selected date
  useEffect(() => {
    if (selectedDate) {
      loadMealsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailableDates = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get last 30 days with diary entries
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('diary_entries')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .lt('date', targetDate) // Don't include today
        .order('date', { ascending: false });

      if (error) throw error;

      // Get unique dates
      const uniqueDates = [...new Set(data.map(entry => entry.date))];
      setAvailableDates(uniqueDates);

      // Auto-select most recent date
      if (uniqueDates.length > 0) {
        setSelectedDate(uniqueDates[0]);
      }
    } catch (error: any) {
      console.error("Error loading dates:", error);
      toast.error("Failed to load available dates");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMealsForDate = async (date: string) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('meal_type');

      if (error) throw error;

      setAvailableMeals(data || []);
      setSelectedMeal(null);
    } catch (error: any) {
      console.error("Error loading meals:", error);
      toast.error("Failed to load meals for selected date");
    } finally {
      setIsLoading(false);
    }
  };

  const copyMeal = async () => {
    if (!selectedMeal) {
      toast.error("Please select a meal to copy");
      return;
    }

    setIsCopying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Copy each item from the selected meal
      for (const item of selectedMeal.items) {
        const { error } = await supabase.rpc("add_diary_item", {
          p_date: targetDate,
          p_meal: targetMeal,
          p_item: item,
          p_totals: {
            calories_kcal: item.nutrients_snapshot?.calories_kcal || 0,
            protein_g: item.nutrients_snapshot?.protein_g || 0,
            carbs_g: item.nutrients_snapshot?.carbs_g || 0,
            fat_g: item.nutrients_snapshot?.fat_g || 0,
            fiber_g: item.nutrients_snapshot?.fiber_g || 0,
          }
        });

        if (error) throw error;
      }

      toast.success(`Copied ${selectedMeal.items.length} items from ${selectedMeal.meal_type} to ${targetMeal}`);
      setIsOpen(false);
      onMealCopied?.();
      
    } catch (error: any) {
      console.error("Error copying meal:", error);
      toast.error("Failed to copy meal");
    } finally {
      setIsCopying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return "Today";
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getMealTypeLabel = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copy from Previous Day
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Copy Meal from Previous Day</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Date</label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a date..." />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {formatDate(date)} ({date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meals for Selected Date */}
          {selectedDate && (
            <div>
              <label className="text-sm font-medium mb-2 block">Available Meals</label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : availableMeals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No meals found for this date
                </p>
              ) : (
                <div className="space-y-2">
                  {availableMeals.map((meal) => (
                    <Card 
                      key={meal.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedMeal?.id === meal.id 
                          ? "ring-2 ring-primary bg-primary/5" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => setSelectedMeal(meal)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {getMealTypeLabel(meal.meal_type)}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {meal.items.length} item{meal.items.length !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(meal.totals?.calories_kcal || 0)} kcal
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1">
                          {meal.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <FoodImage
                                src={item.image_url}
                                alt={item.name}
                                width={20}
                                height={20}
                                className="rounded"
                              />
                              <span className="truncate">
                                {item.name} {item.brand && `(${item.brand})`}
                              </span>
                              <span className="text-muted-foreground">
                                {item.quantity}g
                              </span>
                            </div>
                          ))}
                          {meal.items.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{meal.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={copyMeal}
              disabled={!selectedMeal || isCopying}
            >
              {isCopying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to {getMealTypeLabel(targetMeal)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}