"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface FavoriteButtonProps {
  foodId: string;
  quantity?: number;
  unit?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  className?: string;
  showText?: boolean;
}

export function FavoriteButton({
  foodId,
  quantity = 100,
  unit = "g",
  size = "icon",
  variant = "ghost",
  className,
  showText = false,
}: FavoriteButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, [supabase]);

  const { isFavorite, toggleFavorite, isToggling } = useFavorites(userId || undefined);
  
  const favorited = isFavorite(foodId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userId) return;
    toggleFavorite(foodId, quantity, unit);
  };

  if (!userId) return null;

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleToggle}
      disabled={isToggling}
      className={cn(
        "transition-colors",
        favorited && "text-red-500 hover:text-red-600",
        className
      )}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart 
        className={cn(
          "h-4 w-4",
          favorited && "fill-current",
          isToggling && "animate-pulse"
        )} 
      />
      {showText && (
        <span className="ml-2">
          {favorited ? "Favorited" : "Favorite"}
        </span>
      )}
    </Button>
  );
}

// Compact version for use in lists
export function FavoriteIcon({
  foodId,
  quantity,
  unit,
  className,
}: Omit<FavoriteButtonProps, "size" | "variant" | "showText">) {
  return (
    <FavoriteButton
      foodId={foodId}
      quantity={quantity}
      unit={unit}
      size="icon"
      variant="ghost"
      className={cn("h-8 w-8", className)}
    />
  );
}