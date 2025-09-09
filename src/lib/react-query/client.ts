/**
 * React Query client configuration with optimized settings
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for critical data
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once on network errors
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // User-related queries
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
    biometrics: (userId: string) => ['user', 'biometrics', userId] as const,
    goals: (userId: string) => ['user', 'goals', userId] as const,
    targets: (userId: string) => ['user', 'targets', userId] as const,
    favorites: (userId: string) => ['user', 'favorites', userId] as const,
    recentFoods: (userId: string) => ['user', 'recent-foods', userId] as const,
  },
  
  // Food-related queries
  foods: {
    all: ['foods'] as const,
    search: (query: string, page?: number) => ['foods', 'search', query, page] as const,
    byId: (id: string) => ['foods', 'detail', id] as const,
    barcode: (barcode: string) => ['foods', 'barcode', barcode] as const,
  },
  
  // Diary-related queries
  diary: {
    all: (userId: string) => ['diary', userId] as const,
    byDate: (userId: string, date: string) => ['diary', userId, date] as const,
    dateRange: (userId: string, startDate: string, endDate: string) => 
      ['diary', userId, 'range', startDate, endDate] as const,
  },
  
  // Analytics queries
  analytics: {
    dashboard: ['analytics', 'dashboard'] as const,
    users: (page?: number) => ['analytics', 'users', page] as const,
    foodsStats: ['analytics', 'foods'] as const,
  },
} as const;

// Cache time presets for different data types
export const cacheTime = {
  // Very short cache for real-time data
  realtime: 1000 * 30, // 30 seconds
  // Short cache for frequently changing data
  short: 1000 * 60 * 2, // 2 minutes
  // Medium cache for semi-static data
  medium: 1000 * 60 * 5, // 5 minutes
  // Long cache for static data
  long: 1000 * 60 * 30, // 30 minutes
  // Very long cache for rarely changing data
  veryLong: 1000 * 60 * 60 * 24, // 24 hours
} as const;