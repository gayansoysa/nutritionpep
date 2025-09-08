"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrashIcon, ResetIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

type Totals = {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};

function formatNutrient(n?: number | null, unit?: string) {
  if (n == null) return "—";
  const v = Math.round(Number(n));
  return unit ? `${v}${unit}` : String(v);
}

export default function TodayClient({ 
  target, 
  consumed, 
  entries 
}: { 
  target: Partial<Totals> | null; 
  consumed: Totals; 
  entries: Array<any> 
}) {
  const [optimistic, setOptimistic] = React.useState<Totals>(consumed);
  const [hasDelta, setHasDelta] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("np_added_item_delta");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { totals: Totals; ts: number };
      if (Date.now() - parsed.ts < 60_000) {
        const t = parsed.totals;
        setOptimistic({
          calories_kcal: consumed.calories_kcal + (t.calories_kcal || 0),
          protein_g: consumed.protein_g + (t.protein_g || 0),
          carbs_g: consumed.carbs_g + (t.carbs_g || 0),
          fat_g: consumed.fat_g + (t.fat_g || 0),
          fiber_g: consumed.fiber_g + (t.fiber_g || 0),
        });
        setHasDelta(true);
      }
      sessionStorage.removeItem("np_added_item_delta");
    } catch {}
  }, [consumed]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Recent Items</h2>
      
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            <p>No items logged today.</p>
            <Button asChild className="mt-4" variant="outline">
              <a href="/dashboard/search">Add your first food item</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                  {entry.meal_type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(entry.items || []).map((item: any, idx: number) => {
                    // Use simple index for removal if there's only one item
                    const useIndex = entry.items.length === 1;
                    
                    return (
                      <div key={item.item_id || idx} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatNutrient(item.nutrients_snapshot?.calories_kcal, " kcal")} • 
                            {formatNutrient(item.nutrients_snapshot?.protein_g, "g protein")} • 
                            {formatNutrient(item.grams, "g")}
                          </div>
                        </div>
                        <ItemRemoveButton 
                          entryId={entry.id} 
                          mealType={entry.meal_type} 
                          item={item} 
                          index={useIndex ? idx : undefined} 
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemRemoveButton({ entryId, mealType, item, index }: { 
  entryId: string; 
  mealType: string; 
  item: any;
  index?: number;
}) {
  const [busy, setBusy] = React.useState(false);
  const [removed, setRemoved] = React.useState(false);

  const onRemove = async () => {
    setBusy(true);
    
    try {
      const snap = item.nutrients_snapshot || {};
      sessionStorage.setItem(
        "np_added_item_delta",
        JSON.stringify({ totals: {
          calories_kcal: -Number(snap.calories_kcal || 0),
          protein_g: -Number(snap.protein_g || 0),
          carbs_g: -Number(snap.carbs_g || 0),
          fat_g: -Number(snap.fat_g || 0),
          fiber_g: -Number(snap.fiber_g || 0),
        }, ts: Date.now() })
      );
      
      // If we have an index and only one item, use a special endpoint
      const endpoint = index !== undefined ? 
        `/api/diary/item/direct?entry=${entryId}&index=${index}` :
        `/api/diary/item/direct?entry=${entryId}&item=${item.item_id}`;
        
      const response = await fetch(endpoint, { method: "DELETE" });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(`Error: ${result.error || 'Failed to remove item'}`);
        return;
      }
      
      setRemoved(true);
      toast.success("Item removed", {
        action: {
          label: "Undo",
          onClick: onUndo,
        },
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 4000);
    } catch (err) {
      toast.error("Failed to remove item");
    } finally {
      setBusy(false);
    }
  };

  const onUndo = async () => {
    setBusy(true);
    try {
      const snap = item.nutrients_snapshot || {};
      const today = new Date().toISOString().slice(0, 10);
      await fetch("/api/diary/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, meal: mealType, item, totals: snap }),
      });
      sessionStorage.setItem("np_added_item_delta", JSON.stringify({ totals: snap, ts: Date.now() }));
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      disabled={busy || removed} 
      onClick={onRemove}
      className="h-8 w-8"
    >
      {removed ? (
        <ResetIcon className="h-4 w-4 text-muted-foreground" />
      ) : (
        <TrashIcon className="h-4 w-4 text-destructive" />
      )}
    </Button>
  );
}