# Admin Access Setup Instructions 🔐

## Quick Setup for emailziggi@gmail.com

### Step 1: Promote Your User to Admin

You need to run this SQL command in your **Supabase SQL Editor**:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this SQL command**:

```sql
-- Promote emailziggi@gmail.com to admin
UPDATE public.profiles 
SET role = 'admin'::public.user_role,
    updated_at = NOW()
WHERE id = (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = 'emailziggi@gmail.com'
);

-- Verify the update worked
SELECT 
    au.email,
    p.id,
    p.full_name,
    p.role,
    p.updated_at
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'emailziggi@gmail.com';
```

### Step 2: Access the Admin Dashboard

Once you've promoted your user to admin:

1. **Login to your app** with `emailziggi@gmail.com`
2. **Navigate to**: `http://localhost:3000/admin`
3. **You should see the Admin Panel** with navigation for:
   - Dashboard Overview
   - Foods Management
   - **External APIs** ← This is your new feature!
   - Import Tools

### Step 3: Access External APIs Dashboard

1. **Click on "External APIs"** in the admin navigation
2. **Or go directly to**: `http://localhost:3000/admin/external-apis`

## What You'll See in the External APIs Dashboard

### 📊 **Overview Tab**
- Total API requests across all services
- Success rates and response times
- Daily usage charts
- API distribution pie charts
- Real-time statistics

### ⚙️ **Configuration Tab**
- Enable/disable each API
- Set rate limits
- Test API connections
- View credential status

### 📈 **Analytics Tab**
- Response time trends
- Success rates by API
- Search analytics
- User behavior metrics

### 🗄️ **Cache Management Tab**
- Cache statistics
- Clear cache functionality
- Performance metrics

## Setting Up API Keys (Optional)

To use the external APIs, you'll need to add API keys to your `.env.local` file:

```env
# USDA FoodData Central (Free - 1,000 requests/hour)
USDA_API_KEY=your_api_key_here

# CalorieNinjas (Free - 100,000 requests/month)
CALORIE_NINJAS_API_KEY=your_api_key_here

# FatSecret Platform (Free - 10,000 requests/day)
FATSECRET_CLIENT_ID=your_client_id_here
FATSECRET_CLIENT_SECRET=your_client_secret_here

# Edamam Food Database (Free - 10,000 requests/month)
EDAMAM_APP_ID=your_app_id_here
EDAMAM_APP_KEY=your_app_key_here

# Open Food Facts (No API key needed - Free)
# This one works out of the box!
```

## Testing the System

### Without API Keys
- **Open Food Facts** will work immediately (no API key required)
- You can test the search functionality
- Cache and analytics will work

### With API Keys
- All 5 APIs will be available
- Smart fallback between APIs
- Full analytics and monitoring
- Rate limit management

## Troubleshooting

### Can't Access Admin Panel?
1. **Check your role**: Run the SQL query above to verify you're an admin
2. **Clear browser cache** and try again
3. **Check console** for any JavaScript errors

### External APIs Not Working?
1. **Check API keys** in your `.env.local` file
2. **Test connections** using the built-in test tools in the admin dashboard
3. **Check the analytics** tab for error messages

### Database Migration Issues?
If you haven't run the External API migration yet:

```bash
# Apply the migration
supabase db push
```

## Next Steps

1. **✅ Set up admin access** (run the SQL above)
2. **✅ Access the admin dashboard** at `/admin`
3. **✅ Explore the External APIs dashboard** at `/admin/external-apis`
4. **🔧 Add API keys** to `.env.local` (optional but recommended)
5. **🧪 Test the system** using the built-in testing tools

---

**🎉 You now have access to a comprehensive External API Integration system with:**
- 5 external nutrition APIs
- Intelligent caching and fallback
- Real-time monitoring and analytics
- Admin management tools
- Production-ready performance optimization

**Need help?** Check the full documentation in `docs/EXTERNAL_API_INTEGRATION.md`