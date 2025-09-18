# NutritionPep - Production Deployment Guide

## 🚀 **Pre-Deployment Checklist**

### **1. Environment Setup**

#### **Supabase Production Instance**

```bash
# 1. Create production Supabase project
# 2. Apply database migrations
supabase db push --db-url "your-production-db-url"

# 3. Set up Row Level Security policies
# 4. Configure storage buckets
# 5. Set up authentication providers
```

#### **Environment Variables**

Create `.env.production` with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=NutritionPep

# External APIs
NEXT_PUBLIC_OPEN_FOOD_FACTS_API=https://world.openfoodfacts.org/api/v0

# Optional: Analytics & Monitoring
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id
SENTRY_DSN=your-sentry-dsn
```

### **2. Domain & SSL Setup**

#### **Domain Configuration**

1. Purchase domain (e.g., nutritionpep.com)
2. Configure DNS records
3. Set up SSL certificate (automatic with Vercel/Netlify)

#### **Subdomain Structure**

- `app.nutritionpep.com` - Main application
- `admin.nutritionpep.com` - Admin dashboard (optional)
- `api.nutritionpep.com` - API endpoints (optional)

### **3. Build & Deployment**

#### **Vercel Deployment (Recommended)**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod

# 4. Configure environment variables in Vercel dashboard
# 5. Set up custom domain
```

#### **Alternative: Netlify Deployment**

```bash
# 1. Build the application
npm run build

# 2. Deploy to Netlify
# Upload dist folder or connect GitHub repo

# 3. Configure environment variables
# 4. Set up custom domain and SSL
```

#### **Docker Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔧 **Post-Deployment Configuration**

### **1. Database Setup**

#### **Apply Missing Functions**

```sql
-- Run the migration scripts
\i supabase/migrations/20241201000003_create_user_favorites_functions.sql
\i scripts/apply-missing-functions.sql

-- Verify functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_schema = 'public';
```

#### **Create Admin User**

```sql
-- Create admin user in auth.users table
-- Then add admin role
INSERT INTO user_profiles (id, role, email, full_name)
VALUES ('admin-user-id', 'admin', 'admin@nutritionpep.com', 'Admin User');
```

### **2. Content & Assets**

#### **App Icons Checklist**

Create and upload these icon sizes:

- `favicon.ico` (16x16, 32x32, 48x48)
- `apple-touch-icon.png` (180x180)
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `mstile-150x150.png`

#### **Open Graph Images**

- `og-image.png` (1200x630)
- `twitter-card.png` (1200x600)
- App screenshots for app stores

### **3. Monitoring & Analytics**

#### **Error Tracking (Sentry)**

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // Your Next.js config
}, {
  // Sentry webpack plugin options
});
```

#### **Analytics (Google Analytics)**

```typescript
// lib/gtag.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const pageview = (url: string) => {
  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  });
};
```

#### **Uptime Monitoring**

Set up monitoring with:

- UptimeRobot
- Pingdom
- StatusPage.io

### **4. Performance Optimization**

#### **CDN Configuration**

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ["images.openfoodfacts.org", "your-supabase-project.supabase.co"],
    formats: ["image/webp", "image/avif"],
  },
  // Enable compression
  compress: true,
  // Configure headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};
```

---

## 🔒 **Security Configuration**

### **1. Supabase Security**

#### **Row Level Security Policies**

```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Enable RLS if not already enabled
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

#### **API Security**

```sql
-- Limit API access
CREATE POLICY "API access control" ON table_name
FOR ALL USING (
  auth.role() = 'authenticated' OR
  auth.role() = 'service_role'
);
```

### **2. Application Security**

#### **Environment Variables**

- Never commit `.env` files
- Use secure environment variable management
- Rotate keys regularly

#### **HTTPS Enforcement**

```javascript
// middleware.ts
import { NextResponse } from "next/server";

export function middleware(request) {
  if (request.headers.get("x-forwarded-proto") !== "https") {
    return NextResponse.redirect(
      `https://${request.headers.get("host")}${request.nextUrl.pathname}`
    );
  }
}
```

---

## 📊 **Launch Validation**

### **1. Automated Checks**

#### **Health Check Endpoint**

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from("user_profiles")
      .select("count")
      .limit(1);

    if (error) throw error;

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

#### **Pre-Launch Test Script**

```bash
#!/bin/bash
# test-deployment.sh

echo "🚀 Testing NutritionPep Deployment..."

# Test health endpoint
curl -f https://your-domain.com/api/health || exit 1

# Test main pages
curl -f https://your-domain.com/ || exit 1
curl -f https://your-domain.com/dashboard || exit 1
curl -f https://your-domain.com/admin || exit 1

# Test API endpoints
curl -f https://your-domain.com/api/foods/search?q=apple || exit 1

echo "✅ All tests passed!"
```

### **2. Manual Validation**

#### **User Journey Testing**

1. **Registration Flow**

   - [ ] Sign up with email
   - [ ] Email verification
   - [ ] Onboarding completion
   - [ ] Profile setup

2. **Core Features**

   - [ ] Food search and logging
   - [ ] Barcode scanning
   - [ ] Meal creation
   - [ ] Analytics viewing
   - [ ] Recipe management

3. **Admin Features**
   - [ ] Admin login
   - [ ] User management
   - [ ] Analytics dashboard
   - [ ] Pre-launch tools

#### **Cross-Browser Testing**

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

#### **Performance Testing**

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing
- [ ] Load time < 3 seconds
- [ ] Image optimization working

---

## 🎯 **Go-Live Checklist**

### **Final Pre-Launch Steps**

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate active
- [ ] Domain pointing to application
- [ ] Monitoring and analytics configured
- [ ] Error tracking active
- [ ] Backup procedures tested
- [ ] Admin access verified
- [ ] Legal pages accessible
- [ ] App icons and branding complete

### **Launch Day Tasks**

1. **Deploy to Production**

   ```bash
   # Final deployment
   vercel --prod

   # Verify deployment
   curl -f https://your-domain.com/api/health
   ```

2. **Monitor Launch**

   - Watch error tracking dashboard
   - Monitor performance metrics
   - Check user registration flow
   - Verify all features working

3. **Communication**
   - Announce launch to stakeholders
   - Update status pages
   - Prepare support channels

### **Post-Launch Monitoring**

- [ ] Monitor error rates (< 1%)
- [ ] Check performance metrics
- [ ] Verify user registrations
- [ ] Monitor database performance
- [ ] Check API response times
- [ ] Validate backup procedures

---

## 🆘 **Troubleshooting Guide**

### **Common Issues**

#### **Database Connection Issues**

```bash
# Check Supabase status
curl https://status.supabase.com/

# Verify connection string
psql "your-connection-string" -c "SELECT 1;"
```

#### **Build Failures**

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

#### **Performance Issues**

```bash
# Analyze bundle size
npm run analyze

# Check image optimization
# Verify CDN configuration
# Monitor database query performance
```

### **Emergency Procedures**

#### **Rollback Process**

```bash
# Vercel rollback
vercel rollback

# Database rollback (if needed)
# Restore from backup
```

#### **Incident Response**

1. Identify issue scope
2. Implement immediate fix
3. Communicate with users
4. Document incident
5. Implement prevention measures

---

## 📞 **Support & Maintenance**

### **Regular Maintenance Tasks**

- **Weekly**: Monitor performance metrics
- **Monthly**: Review error logs and user feedback
- **Quarterly**: Security audit and dependency updates
- **Annually**: Comprehensive system review

### **Backup Strategy**

- **Database**: Daily automated backups
- **Code**: Git repository with tags
- **Assets**: CDN and storage backups
- **Configuration**: Environment variable backups

### **Update Procedures**

1. Test in staging environment
2. Create deployment checklist
3. Schedule maintenance window
4. Deploy with rollback plan
5. Monitor post-deployment

---

**🎉 Your NutritionPep application is now ready for production deployment!**

Follow this guide step-by-step to ensure a smooth and successful launch. Remember to test thoroughly and monitor closely during the initial launch period.
