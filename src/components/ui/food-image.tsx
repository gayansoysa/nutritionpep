"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FoodImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
  sizes?: string;
}

export function FoodImage({
  src,
  alt,
  width = 96,
  height = 96,
  className,
  fallbackClassName,
  priority = false,
  sizes,
}: FoodImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-md text-muted-foreground text-xs font-medium",
          fallbackClassName
        )}
        style={{ width, height }}
      >
        <span className="text-center px-2">No Image</span>
      </div>
    );
  }

  // Determine if we should use unoptimized based on the source
  const isExternalImage = src.includes('openfoodfacts.org') || 
                         src.includes('world.openfoodfacts.org') ||
                         !src.startsWith('/') && !src.includes('supabase.co');

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse rounded-md",
            className
          )}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-cover rounded-md transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        priority={priority}
        sizes={sizes}
        unoptimized={isExternalImage}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}