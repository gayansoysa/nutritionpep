/**
 * External API Integration Service
 * 
 * This service provides a unified interface for multiple nutrition APIs
 * with fallback logic, caching, and error handling.
 */

import { createClient } from '@supabase/supabase-js';

// API Configuration
const API_CONFIGS = {
  USDA: {
    baseUrl: 'https://api.nal.usda.gov/fdc/v1',
    apiKey: process.env.USDA_API_KEY,
    rateLimit: 1000, // requests per hour
    enabled: !!process.env.USDA_API_KEY
  },
  CALORIE_NINJAS: {
    baseUrl: 'https://api.calorieninjas.com/v1',
    apiKey: process.env.CALORIE_NINJAS_API_KEY,
    rateLimit: 100000, // requests per month
    enabled: !!process.env.CALORIE_NINJAS_API_KEY
  },
  FATSECRET: {
    baseUrl: 'https://platform.fatsecret.com/rest/server.api',
    clientId: process.env.FATSECRET_CLIENT_ID,
    clientSecret: process.env.FATSECRET_CLIENT_SECRET,
    rateLimit: 10000, // requests per day
    enabled: !!(process.env.FATSECRET_CLIENT_ID && process.env.FATSECRET_CLIENT_SECRET)
  },
  EDAMAM: {
    baseUrl: 'https://api.edamam.com/api/food-database/v2',
    appId: process.env.EDAMAM_APP_ID,
    appKey: process.env.EDAMAM_APP_KEY,
    rateLimit: 10000, // requests per month
    enabled: !!(process.env.EDAMAM_APP_ID && process.env.EDAMAM_APP_KEY)
  },
  OPEN_FOOD_FACTS: {
    baseUrl: 'https://world.openfoodfacts.org/api/v0',
    apiKey: null, // No API key required
    rateLimit: null, // No official rate limit
    enabled: true
  }
};

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

export interface APIUsageStats {
  api: string;
  requests_today: number;
  requests_this_month: number;
  last_request: Date;
  rate_limit_remaining?: number;
}

class ExternalAPIService {
  private supabase;
  private usageStats: Map<string, APIUsageStats> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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

    // First check cache
    const cachedResults = await this.getCachedResults(query, limit, offset);
    if (cachedResults.foods.length > 0) {
      return cachedResults;
    }

    // Determine API order (preferred APIs first, then by reliability)
    const apiOrder = this.getAPIOrder(preferredAPIs);
    
    for (const apiName of apiOrder) {
      try {
        const result = await this.searchAPI(apiName, query, { limit, offset, includeBarcode });
        if (result.foods.length > 0) {
          // Cache successful results
          await this.cacheResults(query, result);
          await this.trackAPIUsage(apiName, query);
          return result;
        }
      } catch (error) {
        console.warn(`API ${apiName} failed:`, error);
        await this.trackAPIError(apiName, query, error);
        continue; // Try next API
      }
    }

    return { foods: [], source: 'none' };
  }

  /**
   * Search a specific API
   */
  private async searchAPI(apiName: string, query: string, options: any): Promise<APISearchResult> {
    switch (apiName) {
      case 'USDA':
        return this.searchUSDA(query, options);
      case 'CALORIE_NINJAS':
        return this.searchCalorieNinjas(query, options);
      case 'FATSECRET':
        return this.searchFatSecret(query, options);
      case 'EDAMAM':
        return this.searchEdamam(query, options);
      case 'OPEN_FOOD_FACTS':
        return this.searchOpenFoodFacts(query, options);
      default:
        throw new Error(`Unknown API: ${apiName}`);
    }
  }

  /**
   * USDA FoodData Central API Integration
   */
  private async searchUSDA(query: string, options: any): Promise<APISearchResult> {
    if (!API_CONFIGS.USDA.enabled) {
      throw new Error('USDA API not configured');
    }

    const url = `${API_CONFIGS.USDA.baseUrl}/foods/search`;
    const params = new URLSearchParams({
      api_key: API_CONFIGS.USDA.apiKey!,
      query: query,
      pageSize: options.limit.toString(),
      pageNumber: (Math.floor(options.offset / options.limit) + 1).toString(),
      dataType: 'Foundation,SR Legacy,Survey (FNDDS)' // High-quality data types
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
   * CalorieNinjas API Integration
   */
  private async searchCalorieNinjas(query: string, options: any): Promise<APISearchResult> {
    if (!API_CONFIGS.CALORIE_NINJAS.enabled) {
      throw new Error('CalorieNinjas API not configured');
    }

    const url = `${API_CONFIGS.CALORIE_NINJAS.baseUrl}/nutrition`;
    const response = await fetch(`${url}?query=${encodeURIComponent(query)}`, {
      headers: {
        'X-Api-Key': API_CONFIGS.CALORIE_NINJAS.apiKey!
      }
    });

    if (!response.ok) {
      throw new Error(`CalorieNinjas API error: ${response.status}`);
    }

    const data = await response.json();
    const foods: NormalizedFood[] = data.items?.map((item: any) => this.normalizeCalorieNinjasFood(item, query)) || [];

    return {
      foods,
      source: 'CalorieNinjas',
      totalResults: foods.length,
      hasMore: false
    };
  }

  /**
   * FatSecret Platform API Integration
   */
  private async searchFatSecret(query: string, options: any): Promise<APISearchResult> {
    if (!API_CONFIGS.FATSECRET.enabled) {
      throw new Error('FatSecret API not configured');
    }

    // FatSecret uses OAuth 1.0, requires more complex authentication
    const accessToken = await this.getFatSecretAccessToken();
    
    const url = `${API_CONFIGS.FATSECRET.baseUrl}`;
    const params = new URLSearchParams({
      method: 'foods.search',
      search_expression: query,
      page_number: Math.floor(options.offset / options.limit).toString(),
      max_results: options.limit.toString(),
      format: 'json'
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`FatSecret API error: ${response.status}`);
    }

    const data = await response.json();
    const foods: NormalizedFood[] = data.foods?.food?.map((food: any) => this.normalizeFatSecretFood(food)) || [];

    return {
      foods,
      source: 'FatSecret',
      totalResults: data.foods?.total_results,
      hasMore: data.foods?.page_number < data.foods?.total_pages
    };
  }

  /**
   * Edamam Food Database API Integration
   */
  private async searchEdamam(query: string, options: any): Promise<APISearchResult> {
    if (!API_CONFIGS.EDAMAM.enabled) {
      throw new Error('Edamam API not configured');
    }

    const url = `${API_CONFIGS.EDAMAM.baseUrl}/parser`;
    const params = new URLSearchParams({
      app_id: API_CONFIGS.EDAMAM.appId!,
      app_key: API_CONFIGS.EDAMAM.appKey!,
      ingr: query,
      nutrition_type: 'cooking'
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status}`);
    }

    const data = await response.json();
    const foods: NormalizedFood[] = data.hints?.map((hint: any) => this.normalizeEdamamFood(hint.food)) || [];

    return {
      foods,
      source: 'Edamam',
      totalResults: foods.length,
      hasMore: false
    };
  }

  /**
   * Enhanced Open Food Facts API Integration
   */
  private async searchOpenFoodFacts(query: string, options: any): Promise<APISearchResult> {
    const url = `${API_CONFIGS.OPEN_FOOD_FACTS.baseUrl}/cgi/search.pl`;
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
   * Food normalization methods
   */
  private normalizeUSDAFood(food: any): NormalizedFood {
    const nutrients = food.foodNutrients?.reduce((acc: any, nutrient: any) => {
      const nutrientId = nutrient.nutrientId;
      const value = nutrient.value || 0;
      
      // Map USDA nutrient IDs to our format
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
      verified: true // USDA data is highly reliable
    };
  }

  private normalizeCalorieNinjasFood(item: any, originalQuery: string): NormalizedFood {
    return {
      id: `cn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || originalQuery,
      serving_sizes: [
        { name: '100g', grams: 100 },
        { name: `Serving (${item.serving_size_g}g)`, grams: item.serving_size_g || 100 }
      ],
      nutrients_per_100g: {
        calories_kcal: (item.calories / (item.serving_size_g || 100)) * 100,
        protein_g: (item.protein_g / (item.serving_size_g || 100)) * 100,
        carbs_g: (item.carbohydrates_total_g / (item.serving_size_g || 100)) * 100,
        fat_g: (item.fat_total_g / (item.serving_size_g || 100)) * 100,
        fiber_g: item.fiber_g ? (item.fiber_g / (item.serving_size_g || 100)) * 100 : undefined,
        sugar_g: item.sugar_g ? (item.sugar_g / (item.serving_size_g || 100)) * 100 : undefined,
        sodium_mg: item.sodium_mg ? (item.sodium_mg / (item.serving_size_g || 100)) * 100 : undefined,
        saturated_fat_g: item.fat_saturated_g ? (item.fat_saturated_g / (item.serving_size_g || 100)) * 100 : undefined,
        cholesterol_mg: item.cholesterol_mg ? (item.cholesterol_mg / (item.serving_size_g || 100)) * 100 : undefined
      },
      source: 'CalorieNinjas',
      external_id: `${originalQuery}_${Date.now()}`,
      verified: false
    };
  }

  private normalizeFatSecretFood(food: any): NormalizedFood {
    return {
      id: `fs_${food.food_id}`,
      name: food.food_name || 'Unknown Food',
      brand: food.brand_name || undefined,
      serving_sizes: [
        { name: '100g', grams: 100 }
      ],
      nutrients_per_100g: {
        calories_kcal: parseFloat(food.food_description?.match(/Calories: (\d+)/)?.[1] || '0'),
        protein_g: parseFloat(food.food_description?.match(/Protein: ([\d.]+)g/)?.[1] || '0'),
        carbs_g: parseFloat(food.food_description?.match(/Carbs: ([\d.]+)g/)?.[1] || '0'),
        fat_g: parseFloat(food.food_description?.match(/Fat: ([\d.]+)g/)?.[1] || '0')
      },
      source: 'FatSecret',
      external_id: food.food_id.toString(),
      verified: false
    };
  }

  private normalizeEdamamFood(food: any): NormalizedFood {
    return {
      id: `edamam_${food.foodId}`,
      name: food.label || 'Unknown Food',
      brand: food.brand || undefined,
      category: food.category || undefined,
      serving_sizes: [
        { name: '100g', grams: 100 }
      ],
      nutrients_per_100g: {
        calories_kcal: food.nutrients?.ENERC_KCAL || 0,
        protein_g: food.nutrients?.PROCNT || 0,
        carbs_g: food.nutrients?.CHOCDF || 0,
        fat_g: food.nutrients?.FAT || 0,
        fiber_g: food.nutrients?.FIBTG,
        sugar_g: food.nutrients?.SUGAR,
        sodium_mg: food.nutrients?.NA,
        saturated_fat_g: food.nutrients?.FASAT,
        cholesterol_mg: food.nutrients?.CHOLE,
        calcium_mg: food.nutrients?.CA,
        iron_mg: food.nutrients?.FE,
        vitamin_c_mg: food.nutrients?.VITC
      },
      source: 'Edamam',
      external_id: food.foodId,
      verified: false,
      image_url: food.image
    };
  }

  private normalizeOpenFoodFactsFood(product: any): NormalizedFood {
    return {
      id: `off_${product.code || Date.now()}`,
      name: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands || undefined,
      barcode: product.code || undefined,
      category: product.categories_tags?.[0]?.replace('en:', '') || undefined,
      serving_sizes: [
        { name: '100g', grams: 100 },
        ...(product.serving_size ? [{ name: `Serving (${product.serving_size})`, grams: parseFloat(product.serving_size) || 100 }] : [])
      ],
      nutrients_per_100g: {
        calories_kcal: parseFloat(product.nutriments?.['energy-kcal_100g']) || 0,
        protein_g: parseFloat(product.nutriments?.['proteins_100g']) || 0,
        carbs_g: parseFloat(product.nutriments?.['carbohydrates_100g']) || 0,
        fat_g: parseFloat(product.nutriments?.['fat_100g']) || 0,
        fiber_g: parseFloat(product.nutriments?.['fiber_100g']) || undefined,
        sugar_g: parseFloat(product.nutriments?.['sugars_100g']) || undefined,
        sodium_mg: parseFloat(product.nutriments?.['sodium_100g']) ? parseFloat(product.nutriments['sodium_100g']) * 1000 : undefined,
        saturated_fat_g: parseFloat(product.nutriments?.['saturated-fat_100g']) || undefined,
        cholesterol_mg: parseFloat(product.nutriments?.['cholesterol_100g']) || undefined
      },
      source: 'OpenFoodFacts',
      external_id: product.code || `off_${Date.now()}`,
      verified: false,
      image_url: product.image_url
    };
  }

  /**
   * Caching and utility methods
   */
  private async getCachedResults(query: string, limit: number, offset: number): Promise<APISearchResult> {
    const { data, error } = await this.supabase
      .from('api_food_cache')
      .select('*')
      .eq('search_query', query.toLowerCase())
      .gte('expires_at', new Date().toISOString())
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error || !data || data.length === 0) {
      return { foods: [], source: 'cache' };
    }

    const foods = data.map(item => ({
      ...item.food_data,
      cached: true
    }));

    return {
      foods,
      source: 'cache',
      totalResults: foods.length,
      hasMore: false
    };
  }

  private async cacheResults(query: string, result: APISearchResult): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

    const cacheEntries = result.foods.map(food => ({
      api_source: result.source,
      external_id: food.external_id,
      search_query: query.toLowerCase(),
      food_data: food,
      expires_at: expiresAt.toISOString()
    }));

    await this.supabase
      .from('api_food_cache')
      .upsert(cacheEntries, { onConflict: 'api_source,external_id' });
  }

  private async trackAPIUsage(apiName: string, query: string): Promise<void> {
    await this.supabase
      .from('search_analytics')
      .insert({
        search_query: query,
        api_used: apiName,
        results_count: 1,
        search_timestamp: new Date().toISOString()
      });
  }

  private async trackAPIError(apiName: string, query: string, error: any): Promise<void> {
    await this.supabase
      .from('search_analytics')
      .insert({
        search_query: query,
        api_used: apiName,
        results_count: 0,
        error_message: error.message,
        search_timestamp: new Date().toISOString()
      });
  }

  private getAPIOrder(preferredAPIs?: string[]): string[] {
    const allAPIs = Object.keys(API_CONFIGS).filter(api => API_CONFIGS[api as keyof typeof API_CONFIGS].enabled);
    
    if (preferredAPIs) {
      const validPreferred = preferredAPIs.filter(api => allAPIs.includes(api));
      const remaining = allAPIs.filter(api => !validPreferred.includes(api));
      return [...validPreferred, ...remaining];
    }

    // Default order by reliability and data quality
    return ['USDA', 'EDAMAM', 'OPEN_FOOD_FACTS', 'CALORIE_NINJAS', 'FATSECRET'];
  }

  private async getFatSecretAccessToken(): Promise<string> {
    // Implement OAuth 1.0 flow for FatSecret
    // This is a simplified version - you'll need to implement proper OAuth
    const credentials = Buffer.from(`${API_CONFIGS.FATSECRET.clientId}:${API_CONFIGS.FATSECRET.clientSecret}`).toString('base64');
    
    const response = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=basic'
    });

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Get API usage statistics
   */
  async getAPIUsageStats(): Promise<APIUsageStats[]> {
    const { data, error } = await this.supabase
      .from('search_analytics')
      .select('api_used, search_timestamp')
      .gte('search_timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (error || !data) return [];

    const stats: { [key: string]: APIUsageStats } = {};
    const today = new Date().toDateString();

    data.forEach(record => {
      const api = record.api_used;
      const recordDate = new Date(record.search_timestamp).toDateString();
      
      if (!stats[api]) {
        stats[api] = {
          api,
          requests_today: 0,
          requests_this_month: 0,
          last_request: new Date(record.search_timestamp)
        };
      }

      stats[api].requests_this_month++;
      if (recordDate === today) {
        stats[api].requests_today++;
      }

      if (new Date(record.search_timestamp) > stats[api].last_request) {
        stats[api].last_request = new Date(record.search_timestamp);
      }
    });

    return Object.values(stats);
  }
}

export const externalAPIService = new ExternalAPIService();
export default ExternalAPIService;