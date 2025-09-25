/**
 * React Query client configuration with optimized settings
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 15 minutes by default (increased for better performance)
      staleTime: 1000 * 60 * 15,
      // Keep data in cache for 30 minutes (increased)
      gcTime: 1000 * 60 * 30,
      // Retry failed requests 2 times with exponential backoff (reduced)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 10000), // Faster retries
      // Refetch on window focus for critical data
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: false, // Changed to false for better performance
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

// Cache time presets for different data types (optimized for performance)
export const cacheTime = {
  // Very short cache for real-time data
  realtime: 1000 * 60, // 1 minute (increased)
  // Short cache for frequently changing data
  short: 1000 * 60 * 5, // 5 minutes (increased)
  // Medium cache for semi-static data
  medium: 1000 * 60 * 15, // 15 minutes (increased)
  // Long cache for static data
  long: 1000 * 60 * 60, // 1 hour (increased)
  // Very long cache for rarely changing data
  veryLong: 1000 * 60 * 60 * 24, // 24 hours
} as const;