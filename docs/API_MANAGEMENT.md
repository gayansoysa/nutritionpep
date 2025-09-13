# API Management Guide

This guide explains how to add, configure, and manage external APIs in your nutrition app.

## Overview

Your app integrates with 5 external nutrition APIs to provide comprehensive food data:

1. **USDA FoodData Central** - Official US government nutrition database
2. **CalorieNinjas** - Quick nutrition lookup for common foods
3. **FatSecret Platform** - Comprehensive food and nutrition database
4. **Edamam Food Database** - Recipe and nutrition analysis
5. **Open Food Facts** - Open-source global food database (enabled by default)

## Current Status

- **Open Food Facts**: ✅ Enabled (no API key required)
- **All other APIs**: ❌ Disabled (require API keys)

## How to Add and Configure APIs

### Method 1: Using the Admin Dashboard (Recommended)

1. **Access Admin Panel**
   - Navigate to `/admin/external-apis`
   - Go to the "Configuration" tab

2. **Add API Credentials**
   - Click "Add Credentials" button for any API
   - Follow the setup instructions provided
   - Enter your API keys securely
   - Test the connection

3. **Enable APIs**
   - Toggle the switch to enable/disable each API
   - Configure rate limits if needed

### Method 2: Using Environment Variables (Legacy)

Add the following to your `.env.local` file:

```bash
# USDA FoodData Central API
USDA_API_KEY=your_usda_api_key_here

# CalorieNinjas API
CALORIE_NINJAS_API_KEY=your_calorie_ninjas_api_key_here

# FatSecret Platform API
FATSECRET_CLIENT_ID=your_fatsecret_client_id_here
FATSECRET_CLIENT_SECRET=your_fatsecret_client_secret_here

# Edamam Food Database API
EDAMAM_APP_ID=your_edamam_app_id_here
EDAMAM_APP_KEY=your_edamam_app_key_here

# Encryption key for API credentials (32 characters minimum)
ENCRYPTION_KEY=your-32-character-secret-key-here!
```

## Getting API Keys

### 1. USDA FoodData Central
- **Website**: https://fdc.nal.usda.gov/api-guide.html
- **Cost**: Free
- **Rate Limit**: 1,000 requests/hour
- **Setup**:
  1. Visit the USDA FoodData Central API page
  2. Sign up for a free API key
  3. Copy your API key

### 2. CalorieNinjas
- **Website**: https://calorieninjas.com/api
- **Cost**: Free tier available
- **Rate Limit**: 100,000 requests/month
- **Setup**:
  1. Visit CalorieNinjas API page
  2. Sign up for an account
  3. Get your API key from the dashboard

### 3. FatSecret Platform
- **Website**: https://platform.fatsecret.com/api/
- **Cost**: Free tier available
- **Rate Limit**: 10,000 requests/day
- **Setup**:
  1. Visit FatSecret Platform API page
  2. Create a developer account
  3. Create a new application
  4. Copy Client ID and Client Secret

### 4. Edamam Food Database
- **Website**: https://developer.edamam.com/food-database-api
- **Cost**: Free tier available
- **Rate Limit**: 10,000 requests/month
- **Setup**:
  1. Visit Edamam Developer Portal
  2. Sign up for an account
  3. Create a new Food Database application
  4. Copy Application ID and Key

### 5. Open Food Facts
- **Website**: https://world.openfoodfacts.org/
- **Cost**: Free
- **Rate Limit**: No official limit
- **Setup**: No setup required - enabled by default

## Security Features

### Encrypted Storage
- All API credentials are encrypted using AES-256-CBC encryption
- Credentials are never stored in plain text
- Encryption key is stored separately in environment variables

### Access Control
- Only admin users can manage API credentials
- Credentials are never exposed in API responses
- Secure credential masking in the UI

### Rate Limiting
- Built-in rate limiting for each API
- Automatic tracking of API usage
- Configurable rate limits per API

## API Management Features

### Dashboard Analytics
- Real-time API usage statistics
- Success/failure rates
- Response time monitoring
- Daily usage charts

### Fallback System
- Automatic fallback to other APIs if one fails
- Intelligent API selection based on availability
- Graceful degradation when APIs are unavailable

### Caching
- 24-hour response caching
- Reduces API calls and costs
- Improves response times
- Cache management tools

### Testing
- Built-in connection testing
- Validate API credentials
- Monitor API health

## Configuration Options

### Rate Limits
Configure rate limits for each API:
- **Per Hour**: Hourly request limit
- **Per Day**: Daily request limit  
- **Per Month**: Monthly request limit

### API Priority
APIs are queried in this order:
1. USDA (most comprehensive)
2. Edamam (good nutrition data)
3. FatSecret (detailed food info)
4. CalorieNinjas (quick lookup)
5. Open Food Facts (fallback)

## Troubleshooting

### Common Issues

1. **API Not Working**
   - Check if API is enabled
   - Verify credentials are correct
   - Test connection in admin panel
   - Check rate limits

2. **Rate Limit Exceeded**
   - Monitor usage in analytics
   - Adjust rate limits
   - Consider upgrading API plan
   - Enable caching

3. **Slow Response Times**
   - Check API status pages
   - Enable caching
   - Consider API priority order

### Error Messages

- **"API credentials not configured"**: Add API keys
- **"Rate limit exceeded"**: Wait or upgrade plan
- **"API connection failed"**: Check API status
- **"Invalid credentials"**: Verify API keys

## Best Practices

1. **Start with Free Tiers**
   - Test with free API tiers first
   - Monitor usage patterns
   - Upgrade as needed

2. **Enable Caching**
   - Reduces API calls
   - Improves performance
   - Saves costs

3. **Monitor Usage**
   - Check analytics regularly
   - Set up rate limit alerts
   - Plan for growth

4. **Secure Credentials**
   - Use strong encryption keys
   - Rotate API keys regularly
   - Limit admin access

## Support

For issues with:
- **App functionality**: Check the admin dashboard
- **API providers**: Contact their support directly
- **Configuration**: Review this documentation

## API Provider Support

- **USDA**: https://fdc.nal.usda.gov/help.html
- **CalorieNinjas**: https://calorieninjas.com/contact
- **FatSecret**: https://platform.fatsecret.com/support
- **Edamam**: https://developer.edamam.com/support
- **Open Food Facts**: https://world.openfoodfacts.org/contact