'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface RecentFood {
  id: string
  food_id: string
  name: string
  brand?: string
  barcode?: string
  image_url?: string
  last_used_at: string
  usage_count: number
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g: number
  suggestion_score?: number
}

interface RecentFoodsCarouselProps {
  type?: 'recent' | 'smart'
  mealType?: string
  limit?: number
  onAddFood?: (food: RecentFood) => void
  className?: string
}

export default function RecentFoodsCarousel({
  type = 'recent',
  mealType,
  limit = 10,
  onAddFood,
  className = ''
}: RecentFoodsCarouselProps) {
  const [foods, setFoods] = useState<RecentFood[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentFoods = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        type,
        limit: limit.toString()
      })
      
      if (mealType) params.append('meal_type', mealType)
      if (type === 'smart') {
        const currentHour = new Date().getHours()
        params.append('time_of_day', currentHour.toString())
      }

      const response = await fetch(`/api/recent-foods?${params}`)
      
      if (!response.ok) {
        // If the API fails, it might be because the database functions don't exist yet
        // In this case, we'll just show an empty state instead of an error
        if (response.status === 500) {
          console.warn('Recent foods API not available yet - database functions may need to be created')
          setFoods([])
          return
        }
        throw new Error(`Failed to fetch recent foods: ${response.status}`)
      }

      const result = await response.json()
      setFoods(result.data || [])
    } catch (error) {
      console.error('Error fetching recent foods:', error)
      // Instead of showing an error, just show empty state for now
      setFoods([])
      setError(null) // Don't show error to user
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentFoods()
  }, [type, mealType, limit])

  const handleAddFood = async (food: RecentFood) => {
    if (onAddFood) {
      onAddFood(food)
    } else {
      // Default behavior - navigate to add form
      const params = new URLSearchParams({
        food_id: food.food_id,
        name: food.name,
        ...(food.brand && { brand: food.brand })
      })
      window.location.href = `/dashboard/search?${params}`
    }
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, foods.length - 2))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, foods.length - 2)) % Math.max(1, foods.length - 2))
  }

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-64">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted animate-pulse rounded w-16" />
                      <div className="h-6 bg-muted animate-pulse rounded w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={fetchRecentFoods}>
          Try Again
        </Button>
      </div>
    )
  }

  if (foods.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">
          {type === 'smart' ? 'No smart suggestions available yet' : 'No recent foods yet'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Start logging foods to see them here
        </p>
      </div>
    )
  }

  const title = type === 'smart' ? 'Smart Suggestions' : 'Recent Foods'
  const IconComponent = type === 'smart' ? TrendingUp : Clock

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
          {type === 'smart' && mealType && (
            <Badge variant="secondary" className="text-xs">
              {mealType}
            </Badge>
          )}
        </div>
        
        {foods.length > 3 && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              disabled={currentIndex >= foods.length - 3}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <motion.div
          className="flex gap-3"
          animate={{ x: -currentIndex * 272 }} // 256px width + 16px gap
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <AnimatePresence>
            {foods.map((food, index) => (
              <motion.div
                key={food.id}
                className="flex-shrink-0 w-64"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {food.name}
                        </h4>
                        {food.brand && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {food.brand}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatLastUsed(food.last_used_at)}</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {food.usage_count}x
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {Math.round(food.calories_per_100g)} cal/100g
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddFood(food)}
                          className="h-7 px-2 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>

                      {type === 'smart' && food.suggestion_score && (
                        <div className="text-xs text-muted-foreground">
                          Match: {Math.round(food.suggestion_score * 10)}%
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}