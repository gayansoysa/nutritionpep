---
description: Repository Information Overview
alwaysApply: true
---

# NutritionPep Information

## Summary

NutritionPep is a modern nutrition tracking application built with Next.js, Supabase, and TypeScript. It allows users to track daily nutrition, set goals, and maintain a healthy lifestyle with smart food logging and progress visualization.

## Structure

- **src/**: Main application code (components, pages, utilities)
  - **app/**: Next.js App Router pages and API routes
  - **components/**: Reusable UI components
  - **lib/**: Utility functions and Supabase client
- **supabase/**: Backend configuration
  - **functions/**: Edge functions (Deno)
  - **migrations/**: Database schema and migrations
- **public/**: Static assets and icons
- **docs/**: Project documentation
- **scripts/**: Deployment and utility scripts

## Language & Runtime

**Language**: TypeScript
**Version**: TypeScript 5.x
**Framework**: Next.js 15.5.2 (App Router)
**Node Version**: 18+ (required)
**Package Manager**: npm

## Dependencies

**Main Dependencies**:

- React 19.1.0 and React DOM 19.1.0
- Next.js 15.5.2 with App Router
- Supabase JS Client (auth, database, storage)
- TanStack React Query for data fetching
- Shadcn UI components with Tailwind CSS
- React Hook Form with Zod validation
- Framer Motion for animations
- Sonner for toast notifications

**Development Dependencies**:

- ESLint 9.x for code linting
- TypeScript 5.x for type checking
- Tailwind CSS 4.x for styling

## Build & Installation

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build:production

# Start production server
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Deployment

**Platform**: Vercel
**Configuration**: vercel.json
**Deployment Commands**:

```bash
# Check deployment readiness
npm run deploy:check

# Deploy to Vercel
./scripts/deploy-vercel.sh

# Verify deployment
node scripts/test-deployment.js
```

## Testing

**Framework**: No dedicated testing framework found
**Test Commands**:

```bash
# Type checking and linting
npm run test

# Build test
npm run build
```

## Database

**Type**: PostgreSQL (via Supabase)
**Schema**: Defined in supabase/migrations/
**Key Tables**:

- users, profiles (authentication)
- foods (nutrition database)
- diary (food logging)
- user_favorites (favorite foods)
- recent_foods (recently used foods)
- biometrics, goals, targets (user data)

## API

**Backend**: Supabase PostgreSQL + Edge Functions
**Edge Functions**:

- calc-targets: Calculate nutrition targets
- delete-user-data: GDPR compliance
- export-user-data: Data export

**API Routes**:

- /api/favorites: Manage favorite foods
- /api/recent-foods: Track recently used foods
