/**
 * Enhanced External API Integration Service
 * 
 * This service provides a unified interface for multiple nutrition APIs
 * with database-stored credentials, fallback logic, caching, and error handling.
 */

import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/crypto';

// Normalized food interface
export interface NormalizedFood {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category?: string;
  serving_sizes: Array<{
    name: string;
    grams: number;
  }>;
  nutrients_per_100g: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
    saturated_fat_g?: number;
    cholesterol_mg?: number;
    calcium_mg?: number;
    iron_mg?: number;
    vitamin_c_mg?: number;
  };
  source: string;
  external_id: string;
  verified: boolean;
  image_url?: string;
}

export interface APISearchResult {
  foods: NormalizedFood[];
  source: string;
  totalResults?: number;
  hasMore?: boolean;
}

export interface APIConfig {
  api_name: string;
  is_enabled: boolean;
  api_key_encrypted?: string;
  additional_config?: any;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  rate_limit_per_month?: number;
}

class EnhancedExternalAPIService {
  private supabase;
  private apiConfigs: Map<string, APIConfig> = new Map();
  private lastConfigLoad = 0;
  private configCacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Load API configurations from database
   */
  private async loadAPIConfigs(): Promise<void> {
    const now = Date.now();
    if (now - this.lastConfigLoad < this.configCacheDuration) {
      return; // Use cached configs
    }

    try {
      const { data: configs, error } = await this.supabase
        .from('api_configurations')
        .select('*')
        .eq('is_enabled', true);

      if (error) throw error;

      this.apiConfigs.clear();
      configs?.forEach(config => {
        this.apiConfigs.set(config.api_name, config);
      });

      this.lastConfigLoad = now;
    } catch (error) {
      console.error('Failed to load API configurations:', error);
    }
  }

  /**
   * Get decrypted credentials for an API
   */
  private getAPICredentials(apiName: string): any {
    const config = this.apiConfigs.get(apiName);
    if (!config) return null;

    const credentials: any = {};

    if (config.api_key_encrypted) {
      credentials.api_key = decrypt(config.api_key_encrypted);
    }

    if (config.additional_config) {
      if (config.additional_config.client_id) {
        credentials.client_id = decrypt(config.additional_config.client_id);
      }
      if (config.additional_config.client_secret) {
        credentials.client_secret = decrypt(config.additional_config.client_secret);
      }
      if (config.additional_config.app_id) {
        credentials.app_id = decrypt(config.additional_config.app_id);
      }
      if (config.additional_config.app_key) {
        credentials.app_key = decrypt(config.additional_config.app_key);
      }
    }

    return credentials;
  }

  /**
   * Search for foods across all available APIs with fallback logic
   */
  async searchFoods(query: string, options: {
    limit?: number;
    offset?: number;
    preferredAPIs?: string[];
    includeBarcode?: boolean;
  } = {}): Promise<APISearchResult> {
    const { limit = 20, offset = 0, preferredAPIs, includeBarcode = false } = options;

    // Load current API configurations
    await this.loadAPIConfigs();

    // First check cache
    const cachedResults = await this.getCachedResults(query, limit, offset);
    if (cachedResults.foods.length > 0) {
      return cachedResults;
    }

    // Determine API order (preferred APIs first, then by reliability)
    const apiOrder = this.getAPIOrder(preferredAPIs);
    
    for (const apiName of apiOrder) {
      if (!this.apiConfigs.has(apiName)) continue;

      try {
        const result = await this.searchAPI(apiName, query, { limit, offset, includeBarcode });
        if (result.foods.length > 0) {
          // Cache successful results
          await this.cacheResults(query, result);
          await this.trackAPIUsage(apiName, query, true);
          return result;
        }
      } catch (error) {
        console.warn(`API ${apiName} failed:`, error);
        await this.trackAPIUsage(apiName, query, false, error);
        continue; // Try next API
      }
    }

    return { foods: [], source: 'none' };
  }

  /**
   * Get API order based on preferences and availability
   */
  private getAPIOrder(preferredAPIs?: string[]): string[] {
    const availableAPIs = Array.from(this.apiConfigs.keys());
    const defaultOrder = ['USDA', 'Edamam', 'FatSecret', 'CalorieNinjas', 'OpenFoodFacts'];
    
    if (preferredAPIs) {
      const preferred = preferredAPIs.filter(api => availableAPIs.includes(api));
      const remaining = availableAPIs.filter(api => !preferredAPIs.includes(api));
      return [...preferred, ...remaining];
    }

    return defaultOrder.filter(api => availableAPIs.includes(api));
  }

  /**
   * Search a specific API
   */
  private async searchAPI(apiName: string, query: string, options: any): Promise<APISearchResult> {
    const credentials = this.getAPICredentials(apiName);
    
    switch (apiName) {
      case 'USDA':
        return this.searchUSDA(query, options, credentials);
      case 'FatSecret':
        // FatSecret requires OAuth implementation - not yet implemented
        throw new Error('FatSecret API integration not yet implemented');
      case 'OpenFoodFacts':
        return this.searchOpenFoodFacts(query, options);
      default:
        throw new Error(`Unknown API: ${apiName}`);
    }
  }

  /**
   * USDA FoodData Central API Integration
   */
  private async searchUSDA(query: string, options: any, credentials: any): Promise<APISearchResult> {
    if (!credentials?.api_key) {
      throw new Error('USDA API key not configured');
    }

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search`;
    const params = new URLSearchParams({
      api_key: credentials.api_key,
      query: query,
      pageSize: options.limit.toString(),
      pageNumber: (Math.floor(options.offset / options.limit) + 1).toString(),
      dataType: 'Foundation,SR Legacy,Survey (FNDDS)'
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`);
    }

    const data = await response.json();
    const foods: NormalizedFood[] = data.foods?.map((food: any) => this.normalizeUSDAFood(food)) || [];

    return {
      foods,
      source: 'USDA',
      totalResults: data.totalHits,
      hasMore: data.totalPages > data.currentPage
    };
  }





  /**
   * Open Food Facts API Integration
   */
  private async searchOpenFoodFacts(query: string, options: any): Promise<APISearchResult> {
    const url = `https://world.openfoodfacts.org/api/v0/cgi/search.pl`;
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: options.limit.toString(),
      page: (Math.floor(options.offset / options.limit) + 1).toString()
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`);
    }

    const data = await response.json();
    const foods: NormalizedFood[] = data.products?.map((product: any) => this.normalizeOpenFoodFactsFood(product)) || [];

    return {
      foods,
      source: 'OpenFoodFacts',
      totalResults: data.count,
      hasMore: data.page < data.page_count
    };
  }

  /**
   * Cache management methods
   */
  private async getCachedResults(query: string, limit: number, offset: number): Promise<APISearchResult> {
    try {
      const { data, error } = await this.supabase
        .from('api_food_cache')
        .select('*')
        .eq('search_query', query.toLowerCase())
        .gt('expires_at', new Date().toISOString())
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error || !data || data.length === 0) {
        return { foods: [], source: 'cache' };
      }

      const foods: NormalizedFood[] = data.map(item => JSON.parse(item.food_data));
      return {
        foods,
        source: 'cache',
        totalResults: foods.length,
        hasMore: false
      };
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      return { foods: [], source: 'cache' };
    }
  }

  private async cacheResults(query: string, result: APISearchResult): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour cache

      const cacheEntries = result.foods.map(food => ({
        search_query: query.toLowerCase(),
        external_id: food.external_id,
        api_source: result.source,
        food_data: JSON.stringify(food),
        expires_at: expiresAt.toISOString()
      }));

      await this.supabase
        .from('api_food_cache')
        .upsert(cacheEntries, { onConflict: 'search_query,external_id' });
    } catch (error) {
      console.error('Cache storage failed:', error);
    }
  }

  /**
   * Usage tracking methods
   */
  private async trackAPIUsage(apiName: string, query: string, success: boolean, error?: any): Promise<void> {
    try {
      // Track in search analytics
      await this.supabase
        .from('search_analytics')
        .insert({
          search_query: query,
          api_used: apiName,
          success: success,
          response_time_ms: 0, // Would need to track this
          results_count: success ? 1 : 0,
          error_message: error?.message || null
        });

      // Update daily usage stats
      const today = new Date().toISOString().split('T')[0];
      await this.supabase.rpc('update_api_usage_stats', {
        p_api_name: apiName,
        p_date: today,
        p_requests_count: 1,
        p_successful_requests: success ? 1 : 0,
        p_failed_requests: success ? 0 : 1,
        p_average_response_time_ms: 0
      });
    } catch (error) {
      console.error('Usage tracking failed:', error);
    }
  }

  /**
   * Food normalization methods
   */
  private normalizeUSDAFood(food: any): NormalizedFood {
    const nutrients = food.foodNutrients?.reduce((acc: any, nutrient: any) => {
      const nutrientId = nutrient.nutrientId;
      const value = nutrient.value || 0;
      
      switch (nutrientId) {
        case 1008: acc.calories_kcal = value; break;
        case 1003: acc.protein_g = value; break;
        case 1005: acc.carbs_g = value; break;
        case 1004: acc.fat_g = value; break;
        case 1079: acc.fiber_g = value; break;
        case 2000: acc.sugar_g = value; break;
        case 1093: acc.sodium_mg = value; break;
        case 1258: acc.saturated_fat_g = value; break;
        case 1253: acc.cholesterol_mg = value; break;
        case 1087: acc.calcium_mg = value; break;
        case 1089: acc.iron_mg = value; break;
        case 1162: acc.vitamin_c_mg = value; break;
      }
      return acc;
    }, {});

    return {
      id: `usda_${food.fdcId}`,
      name: food.description || 'Unknown Food',
      brand: food.brandOwner || undefined,
      category: food.foodCategory || undefined,
      serving_sizes: [
        { name: '100g', grams: 100 },
        ...(food.servingSize ? [{ name: `Serving (${food.servingSizeUnit})`, grams: food.servingSize }] : [])
      ],
      nutrients_per_100g: {
        calories_kcal: nutrients.calories_kcal || 0,
        protein_g: nutrients.protein_g || 0,
        carbs_g: nutrients.carbs_g || 0,
        fat_g: nutrients.fat_g || 0,
        fiber_g: nutrients.fiber_g,
        sugar_g: nutrients.sugar_g,
        sodium_mg: nutrients.sodium_mg,
        saturated_fat_g: nutrients.saturated_fat_g,
        cholesterol_mg: nutrients.cholesterol_mg,
        calcium_mg: nutrients.calcium_mg,
        iron_mg: nutrients.iron_mg,
        vitamin_c_mg: nutrients.vitamin_c_mg
      },
      source: 'USDA',
      external_id: food.fdcId.toString(),
      verified: true
    };
  }





  private normalizeOpenFoodFactsFood(product: any): NormalizedFood {
    const nutrients = product.nutriments || {};
    
    return {
      id: `off_${product.code || product._id}`,
      name: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands || undefined,
      barcode: product.code || undefined,
      category: product.categories || undefined,
      serving_sizes: [
        { name: '100g', grams: 100 },
        ...(product.serving_size ? [{ name: `Serving (${product.serving_size})`, grams: parseFloat(product.serving_size) || 100 }] : [])
      ],
      nutrients_per_100g: {
        calories_kcal: nutrients['energy-kcal_100g'] || nutrients.energy_100g / 4.184 || 0,
        protein_g: nutrients.proteins_100g || 0,
        carbs_g: nutrients.carbohydrates_100g || 0,
        fat_g: nutrients.fat_100g || 0,
        fiber_g: nutrients.fiber_100g,
        sugar_g: nutrients.sugars_100g,
        sodium_mg: nutrients.sodium_100g ? nutrients.sodium_100g * 1000 : undefined,
        saturated_fat_g: nutrients['saturated-fat_100g'],
        cholesterol_mg: nutrients.cholesterol_100g,
        calcium_mg: nutrients.calcium_100g,
        iron_mg: nutrients.iron_100g,
        vitamin_c_mg: nutrients['vitamin-c_100g']
      },
      source: 'OpenFoodFacts',
      external_id: product.code || product._id,
      verified: false,
      image_url: product.image_url
    };
  }
}

// Export singleton instance
export const enhancedExternalAPIService = new EnhancedExternalAPIService();