"use client";

import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

// Lazy load the QuickAddFavorites component
const QuickAddFavorites = lazy(() => 
  import('./quick-add-favorites').then(module => ({ 
    default: module.QuickAddFavorites 
  }))
);

interface LazyQuickAddProps {
  mealType?: "breakfast" | "lunch" | "dinner" | "snacks";
  className?: string;
  maxItems?: number;
}

// Loading skeleton component
function QuickAddSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Quick Add
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-2" />
              <div className="h-4 bg-muted rounded w-3/4 mb-1" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function LazyQuickAdd({ mealType, className, maxItems }: LazyQuickAddProps) {
  return (
    <Suspense fallback={<QuickAddSkeleton />}>
      <QuickAddFavorites 
        mealType={mealType} 
        className={className} 
        maxItems={maxItems} 
      />
    </Suspense>
  );
}