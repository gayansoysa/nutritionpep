# Supabase Production Setup Guide

## 🚀 Production Environment Setup

### **Step 1: Create Production Project**

1. **Go to Supabase Dashboard**

   - Visit [supabase.com](https://supabase.com)
   - Sign in to your account
   - Click "New Project"

2. **Project Configuration**

   ```
   Organization: Your Organization
   Name: nutritionpep-production
   Database Password: [Generate strong password]
   Region: [Choose closest to your users]
   Pricing Plan: Pro (recommended for production)
   ```

3. **Note Important Details**
   ```bash
   Project URL: https://your-project-ref.supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### **Step 2: Database Migration**

#### **Option A: Using Supabase CLI (Recommended)**

1. **Install Supabase CLI**

   ```bash
   npm install -g supabase
   # or
   brew install supabase/tap/supabase
   ```

2. **Login and Link Project**

   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. **Run Migrations**

   ```bash
   # Deploy all migrations
   supabase db push

   # Or deploy specific migrations
   supabase migration up
   ```

#### **Option B: Manual SQL Execution**

1. **Go to SQL Editor in Supabase Dashboard**
2. **Execute migrations in order:**
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_seed_foods.sql`
   - `supabase/migrations/0003_search_rpc.sql`
   - `supabase/migrations/0004_diary_rpcs.sql`
   - `supabase/migrations/0005_fix_remove_diary_item.sql`
   - `supabase/migrations/0006_debug_diary_functions.sql`
   - `supabase/migrations/0007_fix_function_conflict.sql`
   - `supabase/migrations/0008_fix_ambiguous_id_reference.sql`

---

### **Step 3: Authentication Configuration**

#### **Google OAuth Setup**

1. **In Supabase Dashboard → Authentication → Providers**
2. **Enable Google Provider**
3. **Configure OAuth Settings:**

   ```
   Client ID: your-google-client-id
   Client Secret: your-google-client-secret
   ```

4. **Update Redirect URLs:**
   ```
   Site URL: https://your-domain.com
   Redirect URLs:
   - https://your-domain.com/auth/callback
   - https://your-domain.com/dashboard
   ```

#### **Email Authentication**

1. **Configure SMTP (Optional)**

   - Use Supabase's built-in email service
   - Or configure custom SMTP provider

2. **Email Templates**
   - Customize confirmation email
   - Customize password reset email
   - Add your branding

---

### **Step 4: Storage Configuration**

#### **Create Storage Buckets**

```sql
-- Execute in SQL Editor
INSERT INTO storage.buckets (id, name, public) VALUES
('food-images', 'food-images', true),
('user-avatars', 'user-avatars', true),
('exports', 'exports', false);
```

#### **Configure Storage Policies**

```sql
-- Food images bucket policies
CREATE POLICY "Public food images are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'food-images');

CREATE POLICY "Authenticated users can upload food images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'food-images'
  AND auth.role() = 'authenticated'
);

-- User avatars bucket policies
CREATE POLICY "Users can view their own avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Exports bucket policies (private)
CREATE POLICY "Users can access their own exports" ON storage.objects
FOR ALL USING (
  bucket_id = 'exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### **Step 5: Edge Functions Deployment**

#### **Deploy Functions**

```bash
# Deploy all functions
supabase functions deploy calc-targets
supabase functions deploy export-user-data
supabase functions deploy delete-user-data

# Set environment variables for functions
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
```

#### **Test Functions**

```bash
# Test calc-targets function
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/calc-targets' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "test-user-id"}'
```

---

### **Step 6: Performance Optimization**

#### **Database Indexes**

```sql
-- Ensure critical indexes exist
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diary_entries_user_date
ON diary_entries(user_id, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diary_entries_created_at
ON diary_entries(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_foods_search
ON foods USING gin(to_tsvector('english', name || ' ' || COALESCE(brand, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_foods_barcode
ON foods(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_targets_user_date
ON targets(user_id, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id
ON profiles(user_id);

-- Analyze tables for query optimization
ANALYZE diary_entries;
ANALYZE foods;
ANALYZE targets;
ANALYZE profiles;
```

#### **Connection Pooling**

1. **Enable Connection Pooling in Supabase Dashboard**
2. **Configure Pool Settings:**
   ```
   Pool Mode: Transaction
   Pool Size: 15
   Max Client Connections: 200
   ```

---

### **Step 7: Monitoring & Alerts**

#### **Database Monitoring**

1. **Enable Database Monitoring in Dashboard**
2. **Set up Alerts for:**
   - High CPU usage (>80%)
   - High memory usage (>80%)
   - Slow queries (>1000ms)
   - Connection pool exhaustion

#### **API Monitoring**

1. **Monitor API Usage**
2. **Set up Rate Limiting**
3. **Configure Alerts for:**
   - High error rates (>5%)
   - Unusual traffic patterns
   - Authentication failures

---

### **Step 8: Backup Configuration**

#### **Automated Backups**

1. **Enable Point-in-Time Recovery**
2. **Configure Backup Retention:**
   ```
   Daily backups: 7 days
   Weekly backups: 4 weeks
   Monthly backups: 12 months
   ```

#### **Manual Backup Script**

```bash
#!/bin/bash
# backup-database.sh

PROJECT_REF="your-project-ref"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Export schema
supabase db dump --project-ref $PROJECT_REF --schema-only > "$BACKUP_DIR/schema_$DATE.sql"

# Export data
supabase db dump --project-ref $PROJECT_REF --data-only > "$BACKUP_DIR/data_$DATE.sql"

echo "Backup completed: $BACKUP_DIR/schema_$DATE.sql and $BACKUP_DIR/data_$DATE.sql"
```

---

### **Step 9: Security Configuration**

#### **Row Level Security Verification**

```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;

-- Should return no rows if RLS is properly configured
```

#### **API Security**

1. **Configure Rate Limiting**
2. **Set up IP Allowlisting (if needed)**
3. **Enable Audit Logging**
4. **Configure CORS properly**

---

### **Step 10: Environment Variables**

#### **Production Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Optional: Analytics and Monitoring
NEXT_PUBLIC_GA_ID=your-google-analytics-id
SENTRY_DSN=your-sentry-dsn
```

---

## 🔍 Production Checklist

### **Pre-Deployment**

- [ ] Production Supabase project created
- [ ] All migrations deployed successfully
- [ ] Authentication providers configured
- [ ] Storage buckets created with proper policies
- [ ] Edge functions deployed and tested
- [ ] Performance indexes created
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented
- [ ] Security policies verified

### **Post-Deployment**

- [ ] Database connection tested
- [ ] Authentication flows tested
- [ ] File uploads tested
- [ ] Edge functions responding
- [ ] Performance metrics baseline established
- [ ] Monitoring alerts working
- [ ] Backup restoration tested

---

## 🚨 Troubleshooting

### **Common Issues**

1. **Migration Failures**

   ```bash
   # Check migration status
   supabase migration list

   # Reset and retry
   supabase db reset
   supabase db push
   ```

2. **Authentication Issues**

   - Verify redirect URLs
   - Check OAuth provider configuration
   - Ensure CORS settings are correct

3. **Performance Issues**

   - Check slow query log
   - Verify indexes are being used
   - Monitor connection pool usage

4. **Storage Issues**
   - Verify bucket policies
   - Check file size limits
   - Ensure proper CORS configuration

---

## 📞 Support

- **Supabase Documentation:** [docs.supabase.com](https://docs.supabase.com)
- **Community Support:** [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Enterprise Support:** Available with Pro/Enterprise plans

---

_Last Updated: January 2025_
_Next Review: After Production Deployment_
