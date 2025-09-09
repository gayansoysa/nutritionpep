'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInfiniteSearch } from '@/lib/hooks/useInfiniteScroll'
import { apiClient } from '@/lib/utils/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MagnifyingGlassIcon, PlusIcon, MixerHorizontalIcon, ChevronUpIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import { FavoriteButton } from '@/components/ui/favorite-button'
import { toast } from 'sonner'

interface Food {
  id: string
  name: string
  brand?: string
  category?: string
  barcode?: string
  image_url?: string
  serving_sizes: Array<{ name: string; grams: number }>
  nutrients_per_100g: {
    calories_kcal: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g?: number
  }
}

interface InfiniteFoodSearchProps {
  onSelectFood: (food: Food) => void
  userFavorites?: Set<string>
  onToggleFavorite?: (foodId: string, isFavorite: boolean) => void
  className?: string
}

export default function InfiniteFoodSearch({
  onSelectFood,
  userFavorites = new Set(),
  onToggleFavorite,
  className = ''
}: InfiniteFoodSearchProps) {
  const [category, setCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('relevance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showFilters, setShowFilters] = useState(false)

  const searchFunction = useCallback(async (query: string, page: number, pageSize: number) => {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder
    })

    if (category && category !== 'all') {
      params.append('category', category)
    }

    const response = await apiClient.get(`/api/foods/search?${params}`)
    
    return {
      data: response.data || [],
      hasMore: response.hasMore || false,
      total: response.total || 0
    }
  }, [category, sortBy, sortOrder])

  const {
    data: foods,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    query,
    setQuery,
    debouncedQuery,
    totalCount,
    loadMoreRef
  } = useInfiniteSearch<Food>(searchFunction, {
    pageSize: 20,
    debounceMs: 300
  })

  const categories = [
    'Fruits',
    'Vegetables',
    'Grains',
    'Proteins',
    'Dairy',
    'Beverages',
    'Snacks',
    'Condiments'
  ]

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const clearFilters = () => {
    setCategory('all')
    setSortBy('relevance')
    setSortOrder('asc')
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (category && category !== 'all') count++
    if (sortBy !== 'relevance') count++
    return count
  }, [category, sortBy])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search foods by name, brand, or barcode..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 text-lg border-2 focus:border-primary/50 transition-colors"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
        >
          <MixerHorizontalIcon className="h-4 w-4 mr-1" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort by</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="calories">Calories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Order</label>
                    <Button
                      variant="outline"
                      onClick={handleSortToggle}
                      className="w-full justify-start"
                    >
                      {sortOrder === 'asc' ? (
                        <ChevronUpIcon className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 mr-2" />
                      )}
                      {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </Button>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      {debouncedQuery && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                'Searching...'
              ) : (
                `${totalCount} results for "${debouncedQuery}"`
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="h-8 w-16 bg-muted rounded" />
                        <div className="h-8 w-8 bg-muted rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-4 text-center">
                <p className="text-destructive mb-2">Failed to search foods</p>
                <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results List */}
          {!isLoading && !error && foods.length > 0 && (
            <div className="space-y-3">
              {foods.map((food, index) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => onSelectFood(food)}
                        >
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {food.name}
                          </h3>
                          {food.brand && (
                            <p className="text-sm text-muted-foreground mt-1">{food.brand}</p>
                          )}
                          {food.category && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {food.category}
                            </Badge>
                          )}
                          
                          <div className="flex gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span className="text-muted-foreground">Cal:</span>
                              <span className="font-medium">{Math.round(food.nutrients_per_100g.calories_kcal)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-muted-foreground">Protein:</span>
                              <span className="font-medium">{Math.round(food.nutrients_per_100g.protein_g)}g</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-muted-foreground">Carbs:</span>
                              <span className="font-medium">{Math.round(food.nutrients_per_100g.carbs_g)}g</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span className="text-muted-foreground">Fat:</span>
                              <span className="font-medium">{Math.round(food.nutrients_per_100g.fat_g)}g</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => onSelectFood(food)}
                            className="h-8 px-3"
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                          
                          <FavoriteButton
                            foodId={food.id}
                            size="sm"
                            variant="ghost"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Load More Trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="py-8">
                  {isLoadingMore && (
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Loading more foods...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {!isLoading && !error && foods.length === 0 && debouncedQuery && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-2">No foods found for "{debouncedQuery}"</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!debouncedQuery && (
        <Card>
          <CardContent className="p-8 text-center">
            <MagnifyingGlassIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Start typing to search for foods</p>
            <p className="text-sm text-muted-foreground">Search by name, brand, or barcode</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}