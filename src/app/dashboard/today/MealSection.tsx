"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface DiaryItem {
  item_id: string;
  name: string;
  brand?: string;
  grams: number;
  nutrients_snapshot: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
  };
}

interface DiaryEntry {
  id: string;
  meal_type: MealType;
  items: DiaryItem[];
  totals: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
  };
}

interface MealSectionProps {
  mealType: MealType;
  entry?: DiaryEntry;
  onItemRemoved: () => void;
}

const mealLabels: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch", 
  dinner: "Dinner",
  snack: "Snacks"
};

const mealEmojis: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎"
};

const mealColors: Record<MealType, string> = {
  breakfast: "from-orange-50 to-yellow-50 border-orange-200",
  lunch: "from-blue-50 to-cyan-50 border-blue-200",
  dinner: "from-purple-50 to-indigo-50 border-purple-200",
  snack: "from-green-50 to-emerald-50 border-green-200"
};

export default function MealSection({ mealType, entry, onItemRemoved }: MealSectionProps) {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const handleRemoveItem = async (itemId: string, item: DiaryItem) => {
    if (!entry) return;
    
    setIsRemoving(itemId);
    
    try {
      const response = await fetch(`/api/diary/item/direct?entry=${entry.id}&item=${itemId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to remove item");
      }
      
      toast.success("Item removed");
      onItemRemoved();
    } catch (error: any) {
      console.error("Error removing item:", error);
      toast.error(error.message || "Failed to remove item");
    } finally {
      setIsRemoving(null);
    }
  };

  const mealTotals = entry?.totals || {
    calories_kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0
  };

  return (
    <Card className={`bg-gradient-to-r ${mealColors[mealType]} hover:shadow-md transition-all duration-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="text-2xl">{mealEmojis[mealType]}</div>
            <div>
              <div className="font-semibold">{mealLabels[mealType]}</div>
              {entry && entry.items.length > 0 && (
                <div className="text-sm text-muted-foreground font-normal">
                  {entry.items.length} item{entry.items.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {entry && entry.items.length > 0 && (
              <Badge variant="secondary" className="text-xs font-medium bg-white/80">
                {Math.round(mealTotals.calories_kcal)} kcal
              </Badge>
            )}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="bg-white/80 hover:bg-white border-white/50"
                asChild
              >
                <a href={`/dashboard/bulk-add?meal=${mealType}`} title="Bulk Add Foods">
                  <Package className="h-4 w-4" />
                </a>
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="bg-white/80 hover:bg-white border-white/50"
                asChild
              >
                <a href={`/dashboard/search?meal=${mealType}`} title="Add Single Food">
                  <PlusIcon className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!entry || entry.items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <div className="text-4xl mb-2 opacity-50">🍽️</div>
            <p className="text-sm">No items logged yet</p>
            <p className="text-xs mt-1">Tap + to add food</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entry.items.map((item) => (
              <div key={item.item_id} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/80 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  {item.brand && (
                    <div className="text-xs text-muted-foreground mt-0.5">{item.brand}</div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="font-medium">{item.grams}g</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                      {Math.round(item.nutrients_snapshot.calories_kcal)} kcal
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <div className="flex gap-2 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        {Math.round(item.nutrients_snapshot.protein_g)}g
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        {Math.round(item.nutrients_snapshot.carbs_g)}g
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        {Math.round(item.nutrients_snapshot.fat_g)}g
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10"
                    disabled={isRemoving === item.item_id}
                    onClick={() => handleRemoveItem(item.item_id, item)}
                  >
                    <TrashIcon className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            
            {entry.items.length > 1 && (
              <div className="pt-3 border-t border-white/50">
                <div className="flex justify-between items-center p-3 bg-white/40 rounded-lg">
                  <span className="font-medium text-sm">Meal Total</span>
                  <div className="text-right">
                    <div className="font-semibold">{Math.round(mealTotals.calories_kcal)} kcal</div>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      <span>P: {Math.round(mealTotals.protein_g)}g</span>
                      <span>C: {Math.round(mealTotals.carbs_g)}g</span>
                      <span>F: {Math.round(mealTotals.fat_g)}g</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}