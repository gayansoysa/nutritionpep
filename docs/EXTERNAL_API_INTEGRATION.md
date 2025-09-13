# External API Integration Documentation 🌐

## Overview

The External API Integration system provides comprehensive access to multiple nutrition databases through a unified interface. This system includes intelligent fallback logic, caching, analytics tracking, and admin management tools.

## 🎯 Key Features

### ✅ **Implemented Features**

1. **Multi-API Support**
   - USDA FoodData Central
   - CalorieNinjas
   - FatSecret Platform
   - Edamam Food Database
   - Open Food Facts

2. **Intelligent Search System**
   - Local database search first
   - API fallback with priority ordering
   - Result merging and deduplication
   - Smart caching to reduce API calls

3. **Performance Optimization**
   - 24-hour response caching
   - Rate limit management
   - Automatic retry mechanisms
   - Response time tracking

4. **Analytics & Monitoring**
   - Search query tracking
   - API usage statistics
   - Success rate monitoring
   - User behavior analytics

5. **Admin Management**
   - API configuration interface
   - Usage statistics dashboard
   - Connection testing tools
   - Cache management

## 🏗️ Architecture

### Database Schema

#### `api_food_cache`
Stores cached API responses to reduce external API calls:
```sql
- id: UUID (Primary Key)
- api_source: TEXT (USDA, CalorieNinjas, etc.)
- external_id: TEXT (API-specific food ID)
- search_query: TEXT (Original search query)
- food_data: JSONB (Normalized food data)
- cached_at: TIMESTAMP
- expires_at: TIMESTAMP (24-hour expiration)
```

#### `search_analytics`
Tracks all search queries and API usage:
```sql
- id: UUID (Primary Key)
- user_id: UUID (Optional - for user analytics)
- search_query: TEXT
- results_count: INTEGER
- api_used: TEXT
- response_time_ms: INTEGER
- selected_food_id: UUID (If user selected a result)
- error_message: TEXT (If search failed)
- search_timestamp: TIMESTAMP
```

#### `api_usage_stats`
Daily aggregated statistics for each API:
```sql
- id: UUID (Primary Key)
- api_name: TEXT
- date: DATE
- requests_count: INTEGER
- successful_requests: INTEGER
- failed_requests: INTEGER
- average_response_time_ms: DECIMAL
- rate_limit_hits: INTEGER
```

#### `api_configurations`
Stores API settings and credentials:
```sql
- id: UUID (Primary Key)
- api_name: TEXT
- is_enabled: BOOLEAN
- api_key_encrypted: TEXT (Encrypted credentials)
- additional_config: JSONB
- rate_limit_per_hour: INTEGER
- rate_limit_per_day: INTEGER
- rate_limit_per_month: INTEGER
```

### Service Layer

#### `ExternalAPIService` (`/lib/services/external-apis.ts`)

**Main Methods:**
- `searchFoods(query, options)` - Unified search across all APIs
- `searchAPI(apiName, query, options)` - Search specific API
- `normalizeFood(apiData, source)` - Convert API data to standard format
- `getCachedResults(query)` - Retrieve cached responses
- `cacheResults(query, results)` - Store API responses
- `trackAPIUsage(api, query)` - Record usage analytics

**API-Specific Methods:**
- `searchUSDA()` - USDA FoodData Central integration
- `searchCalorieNinjas()` - CalorieNinjas API integration
- `searchFatSecret()` - FatSecret Platform integration
- `searchEdamam()` - Edamam Food Database integration
- `searchOpenFoodFacts()` - Open Food Facts integration

## 🔧 Setup Instructions

### 1. Database Migration

Run the migration to create required tables:
```bash
# The migration file is already created at:
# supabase/migrations/20241201000000_external_api_integration.sql

# Apply the migration
supabase db push
```

### 2. Environment Variables

Copy the example file and add your API credentials:
```bash
cp .env.external-apis.example .env.local
```

Add your API keys to `.env.local`:
```env
# USDA FoodData Central
USDA_API_KEY=your_api_key_here

# CalorieNinjas
CALORIE_NINJAS_API_KEY=your_api_key_here

# FatSecret Platform
FATSECRET_CLIENT_ID=your_client_id_here
FATSECRET_CLIENT_SECRET=your_client_secret_here

# Edamam Food Database
EDAMAM_APP_ID=your_app_id_here
EDAMAM_APP_KEY=your_app_key_here

# Supabase Service Role Key (for caching)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. API Key Registration

#### USDA FoodData Central
1. Visit: https://fdc.nal.usda.gov/api-guide.html
2. Sign up for a free API key
3. Rate limit: 1,000 requests/hour

#### CalorieNinjas
1. Visit: https://calorieninjas.com/
2. Sign up for an account
3. Rate limit: 100,000 requests/month (free tier)

#### FatSecret Platform
1. Visit: https://platform.fatsecret.com/platform-api
2. Create a developer account
3. Create an application to get Client ID and Secret
4. Rate limit: 10,000 requests/day

#### Edamam Food Database
1. Visit: https://developer.edamam.com/food-database-api
2. Sign up for a developer account
3. Create an application to get App ID and Key
4. Rate limit: 10,000 requests/month (free tier)

#### Open Food Facts
- No registration required
- Free and open API
- No official rate limits

## 🚀 Usage

### Frontend Integration

#### Search External APIs
```typescript
// Search external APIs with fallback
const response = await fetch('/api/foods/search-external?q=apple&limit=20');
const data = await response.json();

console.log(data.foods); // Normalized food results
console.log(data.metadata.source); // Which API was used
console.log(data.metadata.cached); // Whether result was cached
```

#### Track Food Selection
```typescript
// Track when user selects a food from search results
await fetch('/api/foods/search-external', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    searchQuery: 'apple',
    selectedFoodId: 'usda_12345',
    apiSource: 'USDA'
  })
});
```

### Admin Dashboard

Access the admin dashboard at `/admin/external-apis` to:
- View API usage statistics
- Configure API settings
- Test API connections
- Manage cache
- Monitor search analytics

## 📊 Data Flow

### Search Process
1. **User searches** for food
2. **Check local cache** for recent results
3. **If cached**: Return cached results
4. **If not cached**: 
   - Try preferred APIs in order
   - Use fallback APIs if primary fails
   - Normalize results to standard format
   - Cache successful results
   - Track analytics

### API Priority Order
1. **USDA** (Highest quality, government data)
2. **Edamam** (Good coverage, reliable)
3. **Open Food Facts** (Free, good for branded items)
4. **CalorieNinjas** (Fast, simple)
5. **FatSecret** (Backup option)

### Data Normalization

All API responses are normalized to this format:
```typescript
interface NormalizedFood {
  id: string;                    // Prefixed with API source
  name: string;                  // Food name
  brand?: string;                // Brand name (if applicable)
  barcode?: string;              // Barcode (if available)
  category?: string;             // Food category
  serving_sizes: Array<{         // Available serving sizes
    name: string;
    grams: number;
  }>;
  nutrients_per_100g: {          // Standardized nutrients
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
    // ... additional nutrients
  };
  source: string;                // API source
  external_id: string;           // Original API ID
  verified: boolean;             // Data quality indicator
  image_url?: string;            // Food image (if available)
}
```

## 🔍 Monitoring & Analytics

### Admin Dashboard Features

#### Overview Tab
- Total API requests
- Overall success rate
- Average response time
- Active APIs count
- Daily usage charts
- API distribution pie chart

#### Configuration Tab
- Enable/disable APIs
- Set rate limits
- Test connections
- View credential status

#### Analytics Tab
- Response time trends
- Success rate by API
- Search analytics table
- User behavior metrics

#### Cache Management Tab
- Cache statistics
- Clear cache functionality
- Cache hit rates

### Key Metrics Tracked

1. **Usage Metrics**
   - Total requests per API
   - Success/failure rates
   - Response times
   - Cache hit rates

2. **User Behavior**
   - Popular search terms
   - API preference patterns
   - Food selection rates
   - Search-to-selection conversion

3. **Performance Metrics**
   - API response times
   - Cache effectiveness
   - Error rates
   - Rate limit utilization

## 🛠️ Maintenance

### Automatic Cleanup

The system includes automatic maintenance:
- **Cache expiration**: 24-hour TTL on cached results
- **Analytics retention**: 30-day rolling window
- **Cleanup function**: `cleanup_expired_cache()` removes old entries

### Manual Maintenance

#### Clear Cache
```sql
-- Clear all cached results
DELETE FROM api_food_cache;

-- Clear expired cache only
SELECT cleanup_expired_cache();
```

#### View Statistics
```sql
-- API usage overview
SELECT * FROM api_statistics 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Search analytics summary
SELECT * FROM search_analytics_summary 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

## 🔒 Security & Privacy

### Data Protection
- API credentials stored encrypted
- User search queries anonymized after 30 days
- No personal data sent to external APIs
- Rate limiting prevents abuse

### Access Control
- Admin-only access to API management
- Row Level Security (RLS) on all tables
- Service role required for caching operations

## 🚨 Error Handling

### Fallback Strategy
1. **Primary API fails** → Try next API in priority order
2. **All APIs fail** → Return empty results with error message
3. **Rate limit hit** → Use cached results or try alternative API
4. **Network error** → Retry with exponential backoff

### Error Tracking
- All API errors logged to `search_analytics`
- Error rates monitored in admin dashboard
- Automatic alerts for high error rates

## 📈 Performance Optimization

### Caching Strategy
- **24-hour cache** for API responses
- **Intelligent cache keys** based on search query
- **Cache warming** for popular searches
- **Automatic cleanup** of expired entries

### Rate Limit Management
- **Per-API rate limits** configured in database
- **Automatic throttling** when limits approached
- **Fallback APIs** when primary hits limits
- **Usage tracking** to optimize API selection

## 🔄 Future Enhancements

### Planned Features
1. **Machine Learning**
   - Search result ranking optimization
   - User preference learning
   - Automatic API selection

2. **Advanced Caching**
   - Redis integration for faster cache
   - Predictive cache warming
   - Distributed cache for scaling

3. **Additional APIs**
   - Nutritionix API
   - MyFitnessPal API
   - Custom nutrition databases

4. **Enhanced Analytics**
   - Real-time dashboards
   - Predictive analytics
   - Cost optimization insights

## 📞 Support

### Troubleshooting

#### Common Issues
1. **API key not working**: Check environment variables and API key validity
2. **Rate limit exceeded**: Check usage in admin dashboard, consider upgrading API plan
3. **Slow responses**: Check API response times in analytics, consider caching improvements
4. **No results found**: Verify API configurations and test connections

#### Debug Mode
Enable debug logging by setting:
```env
DEBUG_EXTERNAL_APIS=true
```

### Contact
For issues with the External API Integration system:
1. Check the admin dashboard for API status
2. Review error logs in search analytics
3. Test API connections using the admin tools
4. Contact system administrator if issues persist

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅