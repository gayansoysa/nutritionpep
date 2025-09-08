# Tasks, Backlog, and Milestones

## Milestones
- M0: Project + Auth + Schema/RLS + Storage
- M1: Onboarding + Targets Calculation + Today View
- M2: Food Search + Logging + Barcode Importer
- M3: Admin Foods CRUD + Images + Analytics
- M4: GDPR Export/Delete + Polish
- Post-MVP: Recipes, Apple Sign In, Deeper Analytics, PWA installability

## Tracks & Tasks

### Platform / Setup
- Create Supabase project config (Site URL, Redirect URLs) [done]
- Enable Google OAuth; Apple later [in progress]
- Create `.env.local` and run dev [done]
- Add shadcn/ui and base theme [todo]
- Add ESLint rules and CI [todo]

### Database (Supabase SQL + RLS)
- Create tables: profiles, biometrics, goals, targets, foods, diary_entries, analytics_events [done]
- Create indexes: foods fts; user_id+date composites [done]
- RLS policies: owner access; admin/moderator roles; public foods read [done]
- Seed initial foods (top 500) [in progress] (seeded initial 5 items)

### Edge Functions
- calc-targets: compute BMR/TDEE/macros, write targets [todo]
- aggregate-analytics: nightly rollups [todo]
- import-food-off: fetch by barcode; normalize; insert foods [todo]
- export-user-data: dump user data; signed URL [todo]
- delete-user-data: purge data; revoke sessions [todo]

### Auth & Onboarding
- Login page (Google) [done]
- OAuth callback handler [done]
- Profile create/update (units, locale, timezone, consent) [done]
- Biometrics form (weight, height, body fat) [done]
- Goals form (activity, goal type, pace, macro prefs) [done]
- Trigger calc-targets and navigate to Today [todo]

### Logging & Diary
- Food search (fts on name/brand) [done] (FTS RPC + barcode fallback)
- Food item sheet (serving selector, quantity, add) [done]
- Diary day view (items list, quick edit/remove) [done] (basic list + remove + undo placeholder)
- Totals compute and display vs targets [done] (with optimistic updates)
 - RPCs: add_diary_item/remove_diary_item [done]
 - Optimistic Today update after add [done]
 - Nutrient per-serving preview in add form [done]

### Barcode (Web PWA)
- Camera scanner with @zxing/browser [todo]
- Manual barcode input fallback [todo]
- Lookup chain: local → OFF importer [in progress] (stub endpoint)

### Dashboards
- Dashboard layout with tabs (Today/History) [done]
- Redirect `/dashboard` to `/dashboard/today` [done]
- Today view: wired to `targets` + aggregated consumed totals [in progress]
- History view: shows recent targets per day [in progress]

### Admin
- Foods list with search and filters [todo]
- Food editor (image upload, nutrients per 100 g, servings) [todo]
- Verify flag and source attribution [todo]
- Analytics: basic metrics dashboard [todo]
- Gate `/admin` by role (profiles.role) [done]

### Privacy & GDPR
- Consent flow (store timestamp/version) [todo]
- Settings: export data (function call) [todo]
- Settings: delete account/data (re-auth + function call) [todo]

### UX/Design
- Implement design system (Appwrite/Health inspired) [todo]
- Mobile-first navigation (tabs) [done]
- Accessibility passes (contrast, keyboard, reduced motion) [todo]

### QA/Perf
- Unit/integration tests for critical flows [todo]
- Performance budgets on search and diary interactions [todo]
- Error monitoring and basic logging [todo]

## Acceptance Criteria (MVP)
- User can sign in, complete onboarding, see targets.
- User can log foods (search/serving/quantity/barcode) and see daily totals vs targets.
- Admin can CRUD foods and view basic analytics.
- Users can export and delete their data.