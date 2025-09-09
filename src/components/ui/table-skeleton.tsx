"use client";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  columns: string[];
  rows?: number;
  className?: string;
}

export function TableSkeleton({ 
  columns, 
  rows = 5, 
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn("border rounded-md", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <div 
                    className={cn(
                      "h-4 bg-muted rounded animate-pulse",
                      // Vary the width for more realistic shimmer
                      colIndex === 0 ? "w-32" : 
                      colIndex === columns.length - 1 ? "w-20" : 
                      "w-24"
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn("border rounded-lg p-6 space-y-4", className)}>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse w-full" />
        <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
        <div className="h-3 bg-muted rounded animate-pulse w-4/6" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 bg-muted rounded animate-pulse w-16" />
        <div className="h-6 bg-muted rounded animate-pulse w-20" />
      </div>
    </div>
  );
}

interface StatCardSkeletonProps {
  className?: string;
}

export function StatCardSkeleton({ className }: StatCardSkeletonProps) {
  return (
    <div className={cn("border rounded-lg p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded animate-pulse w-20" />
          <div className="h-8 bg-muted rounded animate-pulse w-16" />
        </div>
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
      </div>
      <div className="mt-4">
        <div className="h-2 bg-muted rounded animate-pulse w-full" />
      </div>
    </div>
  );
}