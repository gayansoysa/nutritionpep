"use client";

import { useState } from "react";
import { HeartIcon, HeartFilledIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { toast, toastHelpers } from "@/lib/utils/toast";
import { motion } from "framer-motion";

interface FavoriteButtonProps {
  foodId: string;
  foodName: string;
  isFavorite: boolean;
  onToggle?: (isFavorite: boolean) => void;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "default";
}

export function FavoriteButton({
  foodId,
  foodName,
  isFavorite: initialIsFavorite,
  onToggle,
  size = "sm",
  variant = "ghost"
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click events
    e.preventDefault(); // Prevent default behavior
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?food_id=${foodId}`, {
          method: "DELETE",
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to remove from favorites");
        }
        
        setIsFavorite(false);
        toastHelpers.favoriteRemoved(foodName);
        onToggle?.(false);
      } else {
        // Add to favorites
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ food_id: foodId }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 409) {
            toast.info("Food is already in favorites");
            setIsFavorite(true);
            onToggle?.(true);
            return;
          }
          if (response.status === 503) {
            toast.info("Favorites feature is being set up. Please try again later.");
            return;
          }
          throw new Error(data.error || "Failed to add to favorites");
        }
        
        setIsFavorite(true);
        toastHelpers.favoriteAdded(foodName);
        onToggle?.(true);
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toastHelpers.apiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        ${size === "sm" ? "h-9 w-9" : size === "md" ? "h-10 w-10" : "h-11 w-11"}
        ${isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}
        transition-all duration-200 hover:bg-accent/50 hover:scale-105 relative z-10 
        ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <motion.div
        animate={{ scale: isFavorite ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.2 }}
      >
        {isFavorite ? (
          <HeartFilledIcon className={`${size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"}`} />
        ) : (
          <HeartIcon className={`${size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"}`} />
        )}
      </motion.div>
    </Button>
  );
}

export function FavoriteHeart({ 
  isFavorite, 
  size = "md" 
}: { 
  isFavorite: boolean; 
  size?: "sm" | "md" | "lg"; 
}) {
  return (
    <motion.div
      animate={{ scale: isFavorite ? [1, 1.2, 1] : 1 }}
      transition={{ duration: 0.2 }}
      className={`${isFavorite ? "text-red-500" : "text-muted-foreground"}`}
    >
      {isFavorite ? (
        <HeartFilledIcon className={`${size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"}`} />
      ) : (
        <HeartIcon className={`${size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"}`} />
      )}
    </motion.div>
  );
}