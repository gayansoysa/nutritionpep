/**
 * Database Connection Pool and Query Optimization Utilities
 * Provides optimized database connections and query helpers
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Connection pool configuration
interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

const defaultConfig: ConnectionPoolConfig = {
  maxConnections: 10,
  idleTimeout: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// Connection pool class
class DatabaseConnectionPool {
  private connections: Map<string, SupabaseClient> = new Map();
  private connectionCount = 0;
  private config: ConnectionPoolConfig;

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Get or create a connection
  getConnection(key: string = 'default'): SupabaseClient {
    if (this.connections.has(key)) {
      return this.connections.get(key)!;
    }

    if (this.connectionCount >= this.config.maxConnections) {
      // Return existing connection if pool is full
      const firstConnection = this.connections.values().next().value;
      return firstConnection || this.createConnection(key);
    }

    return this.createConnection(key);
  }

  // Create a new connection
  private createConnection(key: string): SupabaseClient {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false, // Don't persist sessions in server-side connections
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-connection-pool': 'true',
          },
        },
      }
    );

    this.connections.set(key, client);
    this.connectionCount++;

    // Set up idle timeout
    setTimeout(() => {
      this.releaseConnection(key);
    }, this.config.idleTimeout);

    return client;
  }

  // Release a connection
  releaseConnection(key: string): void {
    if (this.connections.has(key)) {
      this.connections.delete(key);
      this.connectionCount--;
    }
  }

  // Close all connections
  closeAll(): void {
    this.connections.clear();
    this.connectionCount = 0;
  }

  // Get pool statistics
  getStats() {
    return {
      activeConnections: this.connectionCount,
      maxConnections: this.config.maxConnections,
      connectionKeys: Array.from(this.connections.keys()),
    };
  }
}

// Global connection pool instance
export const connectionPool = new DatabaseConnectionPool();

// Query optimization utilities
export class QueryOptimizer {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // Execute query with caching
  static async executeWithCache<T>(
    client: SupabaseClient,
    queryFn: () => Promise<{ data: T | null; error: any }>,
    cacheKey: string,
    ttl: number = 300000 // 5 minutes default
  ): Promise<{ data: T | null; error: any; fromCache: boolean }> {
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return { data: cached.data, error: null, fromCache: true };
    }

    // Execute query
    const result = await queryFn();

    // Cache successful results
    if (!result.error && result.data) {
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
        ttl,
      });
    }

    return { ...result, fromCache: false };
  }

  // Execute query with retry logic
  static async executeWithRetry<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<{ data: T | null; error: any; attempts: number }> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await queryFn();
        
        if (!result.error) {
          return { ...result, attempts: attempt };
        }
        
        lastError = result.error;
        
        // Don't retry on client errors (4xx)
        if (result.error?.status >= 400 && result.error?.status < 500) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
        }
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
        }
      }
    }

    return { data: null, error: lastError, attempts: maxRetries };
  }

  // Batch execute multiple queries
  static async executeBatch<T>(
    client: SupabaseClient,
    queries: Array<() => Promise<{ data: T | null; error: any }>>,
    options: { 
      parallel?: boolean; 
      failFast?: boolean;
      maxConcurrency?: number;
    } = {}
  ): Promise<Array<{ data: T | null; error: any; index: number }>> {
    const { parallel = true, failFast = false, maxConcurrency = 5 } = options;

    if (!parallel) {
      // Execute sequentially
      const results: Array<{ data: T | null; error: any; index: number }> = [];
      
      for (let i = 0; i < queries.length; i++) {
        const result = await queries[i]();
        results.push({ ...result, index: i });
        
        if (failFast && result.error) {
          break;
        }
      }
      
      return results;
    }

    // Execute in parallel with concurrency limit
    const results: Array<{ data: T | null; error: any; index: number }> = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < queries.length; i++) {
      const promise = queries[i]().then(result => {
        results[i] = { ...result, index: i };
        
        if (failFast && result.error) {
          throw new Error(`Query ${i} failed: ${result.error.message}`);
        }
      });

      executing.push(promise);

      // Limit concurrency
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    // Wait for remaining queries
    await Promise.allSettled(executing);

    return results.filter(Boolean); // Remove undefined entries
  }

  // Clear cache
  static clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  static getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp < entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      totalSizeBytes: totalSize,
    };
  }
}

// Specialized query helpers
export class DatabaseHelpers {
  // Optimized food search
  static async searchFoods(
    client: SupabaseClient,
    query: string,
    options: {
      category?: string;
      verifiedOnly?: boolean;
      limit?: number;
      offset?: number;
      useCache?: boolean;
    } = {}
  ) {
    const { category, verifiedOnly = false, limit = 20, offset = 0, useCache = true } = options;
    
    const cacheKey = `foods:search:${query}:${category}:${verifiedOnly}:${limit}:${offset}`;
    
    const queryFn = async () => client.rpc('search_foods_optimized', {
      search_query: query,
      category_filter: category || null,
      verified_only: verifiedOnly,
      limit_count: limit,
      offset_count: offset,
    });

    if (useCache) {
      return QueryOptimizer.executeWithCache(client, queryFn, cacheKey, 300000); // 5 minutes
    }

    return queryFn();
  }

  // Get user nutrition analytics
  static async getUserNutritionAnalytics(
    client: SupabaseClient,
    userId: string,
    startDate?: string,
    endDate?: string,
    useCache: boolean = true
  ) {
    const cacheKey = `nutrition:analytics:${userId}:${startDate}:${endDate}`;
    
    const queryFn = async () => client.rpc('get_user_nutrition_analytics', {
      user_uuid: userId,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });

    if (useCache) {
      return QueryOptimizer.executeWithCache(client, queryFn, cacheKey, 600000); // 10 minutes
    }

    return queryFn();
  }

  // Get user favorites with caching
  static async getUserFavorites(
    client: SupabaseClient,
    userId: string,
    useCache: boolean = true
  ) {
    const cacheKey = `favorites:${userId}`;
    
    const queryFn = async () => client.rpc('get_user_favorites', {
      user_uuid: userId,
    });

    if (useCache) {
      return QueryOptimizer.executeWithCache(client, queryFn, cacheKey, 300000); // 5 minutes
    }

    return queryFn();
  }

  // Get recent foods with caching
  static async getRecentFoods(
    client: SupabaseClient,
    userId: string,
    limit: number = 20,
    useCache: boolean = true
  ) {
    const cacheKey = `recent:${userId}:${limit}`;
    
    const queryFn = async () => client.rpc('get_user_recent_foods', {
      user_uuid: userId,
      limit_count: limit,
    });

    if (useCache) {
      return QueryOptimizer.executeWithCache(client, queryFn, cacheKey, 120000); // 2 minutes
    }

    return queryFn();
  }

  // Batch get food details
  static async getFoodsBatch(
    client: SupabaseClient,
    foodIds: string[],
    useCache: boolean = true
  ) {
    const queries = foodIds.map(id => () => {
      const cacheKey = `food:${id}`;
      
      const queryFn = async () => client
        .from('foods')
        .select('*')
        .eq('id', id)
        .single();

      if (useCache) {
        return QueryOptimizer.executeWithCache(client, queryFn, cacheKey, 1800000); // 30 minutes
      }

      return queryFn();
    });

    return QueryOptimizer.executeBatch(client, queries, {
      parallel: true,
      maxConcurrency: 10,
    });
  }
}

// Export default connection pool
export default connectionPool;