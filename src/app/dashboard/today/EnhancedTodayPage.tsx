'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, PlusIcon } from '@radix-ui/react-icons';
import ProgressRing from '@/components/charts/ProgressRing';
import MacroBreakdownChart from '@/components/charts/MacroBreakdownChart';

interface Totals {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

interface EnhancedTodayPageProps {
  target: Partial<Totals> | null;
  consumed: Totals;
  entries: Array<any>;
}

export default function EnhancedTodayPage({ target, consumed, entries }: EnhancedTodayPageProps) {
  // Default targets if none set
  const defaultTargets = {
    calories_kcal: 2000,
    protein_g: 100,
    carbs_g: 250,
    fat_g: 70,
    fiber_g: 30,
  };

  const userTargets = target || defaultTargets;

  return (
    <div className="space-y-6">
      {/* Header with Date */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold">Today</h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        <Button size="sm" asChild className="shadow-sm">
          <a href="/dashboard/search">
            <PlusIcon className="mr-1 h-4 w-4" /> Add Food
          </a>
        </Button>
      </div>

      {/* Enhanced Calories Progress Ring */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
        <CardContent className="p-6 flex justify-center">
          <ProgressRing
            value={consumed.calories_kcal}
            target={userTargets.calories_kcal || 2000}
            label="calories"
            unit="kcal"
            size={200}
            animated={true}
            showPercentage={true}
            className="mb-8"
          />
        </CardContent>
      </Card>

      {/* Macro Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traditional Progress Bars */}
        <Card>
          <CardHeader>
            <CardTitle>Macro Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Protein</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(consumed.protein_g)}g / {Math.round(userTargets.protein_g || 150)}g
                </span>
              </div>
              <Progress 
                value={(consumed.protein_g / (userTargets.protein_g || 150)) * 100} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium">Carbs</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(consumed.carbs_g)}g / {Math.round(userTargets.carbs_g || 250)}g
                </span>
              </div>
              <Progress 
                value={(consumed.carbs_g / (userTargets.carbs_g || 250)) * 100} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="font-medium">Fat</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(consumed.fat_g)}g / {Math.round(userTargets.fat_g || 65)}g
                </span>
              </div>
              <Progress 
                value={(consumed.fat_g / (userTargets.fat_g || 65)) * 100} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="font-medium">Fiber</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(consumed.fiber_g)}g / {Math.round(userTargets.fiber_g || 25)}g
                </span>
              </div>
              <Progress 
                value={(consumed.fiber_g / (userTargets.fiber_g || 25)) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Macro Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Macro Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <MacroBreakdownChart
              consumed={{
                protein: consumed.protein_g,
                carbs: consumed.carbs_g,
                fat: consumed.fat_g,
                fiber: consumed.fiber_g,
              }}
              target={{
                protein: userTargets.protein_g || 150,
                carbs: userTargets.carbs_g || 250,
                fat: userTargets.fat_g || 65,
                fiber: userTargets.fiber_g || 25,
              }}
              type="doughnut"
              showCalories={false}
              height={250}
              animated={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Items</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              <p>No items logged today.</p>
              <Button asChild className="mt-4" variant="outline">
                <a href="/dashboard/search">Add your first food item</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="font-medium text-sm uppercase text-muted-foreground mb-2">
                    {entry.meal_type}
                  </div>
                  <div className="space-y-2">
                    {(entry.items || []).map((item: any, idx: number) => (
                      <div key={item.item_id || idx} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round(item.nutrients_snapshot?.calories_kcal || 0)} kcal • 
                            {Math.round(item.nutrients_snapshot?.protein_g || 0)}g protein • 
                            {Math.round(item.grams || 0)}g
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}