# NutritionPep - Deployment Guide

## 🚀 Production Deployment Checklist

### **Pre-Deployment Requirements**

#### **1. Environment Setup**

- [ ] Production Supabase project created
- [ ] Environment variables configured
- [ ] Domain name registered and configured
- [ ] SSL certificate setup
- [ ] CDN configuration (optional)

#### **2. Database Migration**

- [ ] Run all database migrations
- [ ] Seed initial food data
- [ ] Set up RLS policies
- [ ] Create database indexes
- [ ] Configure backup strategy

#### **3. Authentication Configuration**

- [ ] Google OAuth production credentials
- [ ] Redirect URLs updated for production
- [ ] Email templates configured
- [ ] Rate limiting configured

#### **4. Storage Configuration**

- [ ] Supabase Storage buckets created
- [ ] File upload policies configured
- [ ] Image optimization settings
- [ ] CDN integration for media

---

## 🔧 Environment Configuration

### **Required Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id
SENTRY_DSN=your-sentry-dsn
```

### **Supabase Production Setup**

1. **Create Production Project**

   ```bash
   # Create new project in Supabase dashboard
   # Note down the project URL and keys
   ```

2. **Database Setup**

   ```sql
   -- Run the complete schema from supabase/migrations/
   -- Ensure all tables, RLS policies, and functions are created
   ```

3. **Storage Buckets**

   ```sql
   -- Create storage buckets
   INSERT INTO storage.buckets (id, name, public) VALUES
   ('food-images', 'food-images', true),
   ('user-avatars', 'user-avatars', true),
   ('exports', 'exports', false);
   ```

4. **Edge Functions Deployment**
   ```bash
   supabase functions deploy calc-targets
   supabase functions deploy export-user-data
   supabase functions deploy delete-user-data
   ```

---

## 🌐 Deployment Options

### **Option 1: Vercel (Recommended)**

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

2. **Environment Variables**

   - Add all environment variables in Vercel dashboard
   - Ensure `NEXT_PUBLIC_` variables are properly set

3. **Domain Configuration**
   - Add custom domain in Vercel dashboard
   - Update Supabase auth settings with new domain

### **Option 2: Netlify**

1. **Build Configuration**

   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Environment Variables**
   - Set in Netlify dashboard under Site Settings > Environment Variables

### **Option 3: Docker Deployment**

1. **Dockerfile**

   ```dockerfile
   FROM node:18-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY . .
   COPY --from=deps /app/node_modules ./node_modules
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production

   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next ./.next
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./package.json

   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Docker Compose**
   ```yaml
   version: "3.8"
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
         - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
         - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
   ```

---

## 📱 PWA Configuration

### **App Icons**

Replace placeholder icons with proper app icons:

```bash
# Generate icons for different sizes
# Place in public/ directory:
# - icon-192.png (192x192)
# - icon-512.png (512x512)
# - apple-touch-icon.png (180x180)
# - favicon.ico
```

### **Service Worker (Optional)**

For offline functionality:

```javascript
// public/sw.js
const CACHE_NAME = "nutritionpep-v1";
const urlsToCache = [
  "/",
  "/dashboard",
  "/dashboard/today",
  "/dashboard/search",
  "/dashboard/scan",
  "/static/js/bundle.js",
  "/static/css/main.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});
```

---

## 🔍 Monitoring & Analytics

### **Error Monitoring**

1. **Sentry Setup**

   ```bash
   npm install @sentry/nextjs
   ```

   ```javascript
   // sentry.client.config.js
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     tracesSampleRate: 1.0,
   });
   ```

2. **Custom Error Boundary**

   ```typescript
   // components/ErrorBoundary.tsx
   import { ErrorBoundary } from "@sentry/nextjs";

   export default function CustomErrorBoundary({ children }) {
     return (
       <ErrorBoundary fallback={ErrorFallback} showDialog>
         {children}
       </ErrorBoundary>
     );
   }
   ```

### **Analytics Setup**

1. **Google Analytics 4**

   ```typescript
   // lib/gtag.ts
   export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

   export const pageview = (url: string) => {
     window.gtag("config", GA_TRACKING_ID, {
       page_path: url,
     });
   };
   ```

2. **Custom Analytics Events**
   ```typescript
   // Track user actions
   const trackEvent = (action: string, category: string, label?: string) => {
     window.gtag("event", action, {
       event_category: category,
       event_label: label,
     });
   };
   ```

### **Performance Monitoring**

1. **Web Vitals**

   ```typescript
   // pages/_app.tsx
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

   function sendToAnalytics(metric) {
     window.gtag("event", metric.name, {
       value: Math.round(
         metric.name === "CLS" ? metric.value * 1000 : metric.value
       ),
       event_category: "Web Vitals",
       non_interaction: true,
     });
   }

   getCLS(sendToAnalytics);
   getFID(sendToAnalytics);
   getFCP(sendToAnalytics);
   getLCP(sendToAnalytics);
   getTTFB(sendToAnalytics);
   ```

---

## 🔒 Security Checklist

### **Application Security**

- [ ] All API routes protected with authentication
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using Supabase RLS)
- [ ] XSS protection (React's built-in protection)
- [ ] CSRF protection for state-changing operations
- [ ] Rate limiting on API endpoints
- [ ] Secure headers configuration

### **Data Security**

- [ ] All sensitive data encrypted at rest
- [ ] PII data minimization
- [ ] Secure session management
- [ ] Regular security audits
- [ ] GDPR compliance verification
- [ ] Data backup and recovery procedures

### **Infrastructure Security**

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Regular dependency updates
- [ ] Vulnerability scanning
- [ ] Access logging and monitoring

---

## 📊 Performance Optimization

### **Build Optimization**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["your-supabase-project.supabase.co"],
    formats: ["image/webp", "image/avif"],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
};

module.exports = nextConfig;
```

### **Database Optimization**

```sql
-- Ensure proper indexes exist
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diary_entries_user_date
ON diary_entries(user_id, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_foods_search
ON foods USING gin(to_tsvector('english', name || ' ' || COALESCE(brand, '')));

-- Analyze query performance
ANALYZE;
```

### **Caching Strategy**

- Static assets cached at CDN level
- API responses cached where appropriate
- Database query result caching
- Image optimization and caching

---

## 🧪 Testing Strategy

### **Pre-Production Testing**

```bash
# Run all tests
npm run test

# E2E testing
npm run test:e2e

# Performance testing
npm run lighthouse

# Security scanning
npm audit
```

### **Staging Environment**

- Deploy to staging environment first
- Run full test suite
- Manual testing of critical paths
- Performance testing under load
- Security penetration testing

---

## 🚀 Go-Live Process

### **Deployment Steps**

1. **Final Code Review**

   - Security review
   - Performance review
   - Accessibility review

2. **Database Migration**

   - Backup current data
   - Run migrations
   - Verify data integrity

3. **Application Deployment**

   - Deploy to production
   - Verify all services running
   - Test critical user flows

4. **DNS and SSL**

   - Update DNS records
   - Verify SSL certificate
   - Test from multiple locations

5. **Monitoring Setup**
   - Verify error tracking
   - Set up alerts
   - Monitor performance metrics

### **Post-Deployment**

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify user registration flow
- [ ] Test payment processing (if applicable)
- [ ] Monitor database performance
- [ ] Check third-party integrations

---

## 📞 Support & Maintenance

### **Monitoring Alerts**

Set up alerts for:

- High error rates (>1%)
- Slow response times (>2s)
- Database connection issues
- High memory/CPU usage
- Failed authentication attempts

### **Backup Strategy**

- Daily database backups
- Weekly full system backups
- Test restore procedures monthly
- Offsite backup storage

### **Update Procedures**

- Regular dependency updates
- Security patch deployment
- Feature rollout strategy
- Rollback procedures

---

## 📋 Launch Checklist

### **Technical Readiness**

- [ ] All environment variables set
- [ ] Database migrations completed
- [ ] SSL certificate active
- [ ] CDN configured
- [ ] Monitoring active
- [ ] Backup systems operational

### **Content Readiness**

- [ ] Food database seeded
- [ ] Help documentation complete
- [ ] Privacy policy updated
- [ ] Terms of service finalized
- [ ] App store listings prepared (if applicable)

### **Marketing Readiness**

- [ ] Landing page optimized
- [ ] Social media accounts created
- [ ] Press kit prepared
- [ ] Beta user feedback incorporated
- [ ] Launch announcement ready

The application is now ready for production deployment! 🎉
