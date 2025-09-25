'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
    }, 300000) // Update every 5 minutes instead of every minute for better performance

    return () => clearInterval(timer)
  }, [])

  // Memoize helper functions to prevent recreation on every render
  const getMealTypeFromTime = useCallback((hour: number): string => {
    if (hour >= 5 && hour < 11) return 'breakfast'
    if (hour >= 11 && hour < 16) return 'lunch'
    if (hour >= 16 && hour < 21) return 'dinner'
    return 'snacks'
  }, [])

  const getMealEmoji = useCallback((meal: string): string => {
    switch (meal.toLowerCase()) {
      case 'breakfast': return '🌅'
      case 'lunch': return '☀️'
      case 'dinner': return '🌙'
      case 'snacks': return '🍎'
      default: return '🍽️'
    }
  }, [])

  // Memoize expensive calculations
  const { currentHour, suggestedMeal, timeBasedMessage } = useMemo(() => {
    const hour = currentTime.getHours()
    const meal = currentMeal || getMealTypeFromTime(hour)
    const message = getTimeBasedMessage(hour)
    
    return {
      currentHour: hour,
      suggestedMeal: meal,
      timeBasedMessage: message
    }
  }, [currentTime, currentMeal, getMealTypeFromTime])

  return (
    <div className={`space-y-6 ${className}`}>
      

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