"use client";

import { useRouter } from "next/navigation";
import MealSection from "./MealSection";

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

interface MealSectionsProps {
  entries?: DiaryEntry[];
}

export default function MealSections({ entries }: MealSectionsProps) {
  const router = useRouter();

  const handleItemRemoved = () => {
    router.refresh();
  };

  const totalMealCalories = entries?.reduce((sum, entry) => sum + entry.totals.calories_kcal, 0) || 0;
  const totalMealItems = entries?.reduce((sum, entry) => sum + entry.items.length, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            🍽️ Today's Meals
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalMealItems} items • {Math.round(totalMealCalories)} calories logged
          </p>
        </div>
      </div>
      
      <div className="grid gap-4">
        {["breakfast", "lunch", "dinner", "snack"].map((mealType, index) => (
          <div 
            key={mealType}
            className="animate-bounce-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <MealSection 
              mealType={mealType as any}
              entry={entries?.find(e => e.meal_type === mealType)}
              onItemRemoved={handleItemRemoved}
            />
          </div>
        ))}
      </div>
    </div>
  );
}