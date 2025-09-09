'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

interface InfiniteScrollOptions<T> {
  initialData?: T[]
  pageSize?: number
  threshold?: number
  rootMargin?: string
  enabled?: boolean
}

interface InfiniteScrollResult<T> {
  data: T[]
  isLoading: boolean
  isLoadingMore: boolean
  error: Error | null
  hasNextPage: boolean
  loadMore: () => Promise<void>
  reset: () => void
  setData: (data: T[]) => void
  totalCount: number
  loadMoreRef: (node?: Element | null) => void
}

export function useInfiniteScroll<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean; total?: number }>,
  options: InfiniteScrollOptions<T> = {}
): InfiniteScrollResult<T> {
  const {
    initialData = [],
    pageSize = 20,
    threshold = 0.1,
    rootMargin = '100px',
    enabled = true
  } = options

  const [data, setData] = useState<T[]>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  const fetchInProgress = useRef(false)

  const { ref: loadMoreRef, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: false,
  })

  const loadMore = useCallback(async () => {
    if (!enabled || fetchInProgress.current || !hasNextPage) {
      return
    }

    fetchInProgress.current = true
    const isFirstLoad = currentPage === 0

    try {
      if (isFirstLoad) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      setError(null)

      const result = await fetchFunction(currentPage, pageSize)
      
      setData(prevData => {
        if (isFirstLoad) {
          return result.data
        }
        return [...prevData, ...result.data]
      })

      setHasNextPage(result.hasMore)
      setCurrentPage(prev => prev + 1)
      
      if (result.total !== undefined) {
        setTotalCount(result.total)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      fetchInProgress.current = false
    }
  }, [fetchFunction, currentPage, pageSize, hasNextPage, enabled])

  const reset = useCallback(() => {
    setData(initialData)
    setCurrentPage(0)
    setHasNextPage(true)
    setError(null)
    setIsLoading(false)
    setIsLoadingMore(false)
    setTotalCount(0)
    fetchInProgress.current = false
  }, [initialData])

  // Load more when the trigger element comes into view
  useEffect(() => {
    if (inView && enabled && hasNextPage && !fetchInProgress.current) {
      loadMore()
    }
  }, [inView, enabled, hasNextPage, loadMore])

  // Reset when fetchFunction changes (e.g., when filters change)
  const fetchFunctionRef = useRef(fetchFunction)
  useEffect(() => {
    if (fetchFunctionRef.current !== fetchFunction) {
      fetchFunctionRef.current = fetchFunction
      reset()
    }
  }, [fetchFunction, reset])

  // Load initial data
  useEffect(() => {
    if (enabled && currentPage === 0 && data.length === 0) {
      loadMore()
    }
  }, [enabled, currentPage, data.length, loadMore])

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    loadMore,
    reset,
    setData,
    totalCount,
    loadMoreRef
  }
}

// Specialized hook for search with debouncing
export function useInfiniteSearch<T>(
  searchFunction: (query: string, page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean; total?: number }>,
  options: InfiniteScrollOptions<T> & { debounceMs?: number } = {}
) {
  const { debounceMs = 300, ...infiniteOptions } = options
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Debounce the search query
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, debounceMs])

  const fetchFunction = useCallback(
    (page: number, pageSize: number) => {
      return searchFunction(debouncedQuery, page, pageSize)
    },
    [searchFunction, debouncedQuery]
  )

  const infiniteResult = useInfiniteScroll(fetchFunction, {
    ...infiniteOptions,
    enabled: infiniteOptions.enabled && debouncedQuery.length > 0
  })

  // Reset is now handled by the main useInfiniteScroll hook when fetchFunction changes

  return {
    ...infiniteResult,
    query,
    setQuery,
    debouncedQuery
  }
}