"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklyChartProps {
  data: Array<{
    day: string;
    calories: number;
    target: number;
  }>;
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxCalories = Math.max(...data.map(d => Math.max(d.calories, d.target)));
  
  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Weekly Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-32">
          {data.map((day, index) => {
            const height = (day.calories / maxCalories) * 100;
            const targetHeight = (day.target / maxCalories) * 100;
            const isToday = index === data.length - 1;
            
            return (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex flex-col items-center">
                  {/* Target line */}
                  <div 
                    className="absolute w-full border-t-2 border-dashed border-muted-foreground/30"
                    style={{ bottom: `${targetHeight}%` }}
                  />
                  
                  {/* Actual bar */}
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday 
                        ? 'bg-gradient-to-t from-primary to-primary/70' 
                        : day.calories >= day.target
                        ? 'bg-gradient-to-t from-green-500 to-green-400'
                        : 'bg-gradient-to-t from-orange-500 to-orange-400'
                    }`}
                    style={{ 
                      height: `${height}%`,
                      minHeight: '4px'
                    }}
                  />
                </div>
                
                <div className="text-center">
                  <div className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {day.day}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(day.calories)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/70 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-400 rounded"></div>
            <span>Goal Met</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-400 rounded"></div>
            <span>Under Goal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}