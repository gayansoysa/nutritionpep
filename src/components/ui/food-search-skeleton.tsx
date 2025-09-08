import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FoodSearchSkeleton() {
  return (
    <Card className="animate-bounce-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="p-4 border border-border/50 rounded-xl"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="text-right ml-4">
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-6" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-6" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FoodItemSkeleton() {
  return (
    <div className="p-4 border border-border/50 rounded-xl">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="text-right ml-4">
          <Skeleton className="h-6 w-12 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-6" />
        </div>
      </div>
    </div>
  );
}