"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SetupPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const createFavoritesTable = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/setup-favorites", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create favorites table");
      }

      setIsCreated(true);
      toast.success("Favorites table created successfully!");
    } catch (error: any) {
      console.error("Error creating table:", error);
      toast.error(error.message || "Failed to create favorites table");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Setup Favorites Feature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Click the button below to set up the favorites feature for NutritionPep.
            This will create the necessary database table and permissions.
          </p>
          
          {!isCreated ? (
            <Button 
              onClick={createFavoritesTable} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Favorites Table"}
            </Button>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-semibold">
                ✅ Favorites table created successfully!
              </div>
              <Button asChild>
                <a href="/dashboard/search">
                  Go to Food Search
                </a>
              </Button>
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Alternative Setup Method:</h3>
            <p className="text-sm text-muted-foreground mb-2">
              If the button above doesn't work, you can manually run this SQL in your Supabase dashboard:
            </p>
            <div className="bg-background p-3 rounded border text-xs font-mono overflow-x-auto">
              <pre>{`-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, food_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites" ON user_favorites
  USING (auth.uid() = user_id);`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}