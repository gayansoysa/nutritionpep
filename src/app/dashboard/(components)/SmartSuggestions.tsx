'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Clock, TrendingUp, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import RecentFoodsCarousel from './RecentFoodsCarousel'

interface SmartSuggestionsProps {
  currentMeal?: string
  onAddFood?: (food: any) => void
  className?: string
}

export default function SmartSuggestions({
  currentMeal,
  onAddFood,
  className = ''
}: SmartSuggestionsProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const getMealTypeFromTime = (hour: number): string => {
    if (hour >= 5 && hour < 11) return 'breakfast'
    if (hour >= 11 && hour < 16) return 'lunch'
    if (hour >= 16 && hour < 21) return 'dinner'
    return 'snacks'
  }

  const getMealEmoji = (meal: string): string => {
    switch (meal.toLowerCase()) {
      case 'breakfast': return '🌅'
      case 'lunch': return '☀️'
      case 'dinner': return '🌙'
      case 'snacks': return '🍎'
      default: return '🍽️'
    }
  }

  const currentHour = currentTime.getHours()
  const suggestedMeal = currentMeal || getMealTypeFromTime(currentHour)
  const timeBasedMessage = getTimeBasedMessage(currentHour)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Time-based suggestion header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <span className="font-medium text-primary">Smart Suggestions</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {timeBasedMessage} {getMealEmoji(suggestedMeal)}
            </p>
            <Badge variant="secondary" className="mt-2">
              {suggestedMeal.charAt(0).toUpperCase() + suggestedMeal.slice(1)} Time
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Smart suggestions carousel */}
      <RecentFoodsCarousel
        type="smart"
        mealType={suggestedMeal}
        limit={8}
        onAddFood={onAddFood}
      />

      {/* Recent foods fallback */}
      <div className="border-t pt-6">
        <RecentFoodsCarousel
          type="recent"
          limit={6}
          onAddFood={onAddFood}
        />
      </div>
    </div>
  )
}

function getTimeBasedMessage(hour: number): string {
  if (hour >= 5 && hour < 8) {
    return "Good morning! Here are some breakfast ideas based on your history."
  } else if (hour >= 8 && hour < 11) {
    return "Morning fuel time! These breakfast options worked well for you before."
  } else if (hour >= 11 && hour < 13) {
    return "Lunch time! Here are your go-to midday meals."
  } else if (hour >= 13 && hour < 16) {
    return "Afternoon energy boost! These lunch options are popular for you."
  } else if (hour >= 16 && hour < 18) {
    return "Dinner prep time! Here are your favorite evening meals."
  } else if (hour >= 18 && hour < 21) {
    return "Dinner time! These options align with your usual preferences."
  } else if (hour >= 21 && hour < 24) {
    return "Evening snack? Here are some lighter options you've enjoyed."
  } else {
    return "Late night fuel? Here are some options based on your history."
  }
}