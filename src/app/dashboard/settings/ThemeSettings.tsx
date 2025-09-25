"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon, DesktopIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const themes = [
    {
      name: "Light",
      value: "light",
      icon: <SunIcon className="h-4 w-4" />,
      description: "Light theme for daytime use"
    },
    {
      name: "Dark", 
      value: "dark",
      icon: <MoonIcon className="h-4 w-4" />,
      description: "Dark theme for low-light environments"
    },
    {
      name: "System",
      value: "system", 
      icon: <DesktopIcon className="h-4 w-4" />,
      description: "Automatically match your system preference"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose how NutritionPep looks to you. Select a single theme, or sync with your system and automatically switch between day and night themes.
          </p>
          
          <div className="grid gap-3">
            {themes.map((themeOption) => (
              <Button
                key={themeOption.value}
                variant={theme === themeOption.value ? "default" : "outline"}
                className={`justify-start h-auto p-4 ${
                  theme === themeOption.value 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
                onClick={() => setTheme(themeOption.value)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${
                    theme === themeOption.value 
                      ? "bg-primary-foreground/20" 
                      : "bg-muted"
                  }`}>
                    {themeOption.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{themeOption.name}</div>
                    <div className={`text-xs ${
                      theme === themeOption.value 
                        ? "text-primary-foreground/70" 
                        : "text-muted-foreground"
                    }`}>
                      {themeOption.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}