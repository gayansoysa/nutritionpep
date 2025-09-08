# Product Requirements Document (PRD)

Product: nutritionpep
Owner: You
Version: 0.1 (MVP)

## 1. Overview
nutritionpep is a mobile-first web app to track nutrition. Users log foods and ingredients, view daily/weekly totals, and get calorie/macro targets based on their body metrics, activity, and goals. Admins manage the food catalog and review analytics. Backend is Supabase (Auth, Postgres with RLS, Storage, Edge Functions). UI inspiration: Appwrite console + iOS Health.

## 2. Goals & Non-goals
- Goals (MVP)
  - Users can sign in (Google now; Apple later) and complete onboarding (biometrics, goals, activity, consent, units).
  - Users get daily calorie/macro targets and can log foods (search, servings, quantities, barcode) and see totals.
  - Admins can CRUD foods (generic/branded), upload images, import on-demand from Open Food Facts (OFF).
  - Privacy/GDPR: consent capture; data export and delete.
  - Basic analytics: sign-ups, DAU, most-logged foods.
- Non-goals (MVP)
  - Native app stores, Apple Health/Google Fit integrations.
  - Recipes authoring (post-MVP stub only).
  - Twitter/X integrations.

## 3. Personas
- End User: wants easy food logging, accurate calorie/macro tracking, and simple guidance.
- Admin: curates food database, verifies entries, monitors analytics.
- Moderator: assists with catalog moderation (subset of admin capabilities).

## 4. User Stories (MVP)
- As a user, I can sign in with Google and set units (metric/imperial), accept privacy policy.
- As a user, I can enter body metrics (weight, height, optional body fat), activity level, and goals (lose/maintain/gain).
- As a user, I see daily calorie and macro targets.
- As a user, I search foods by name/brand, select a serving, input quantity, and add to my diary.
- As a user, I can scan a barcode to quickly log branded foods.
- As a user, I can view daily totals and see progress to targets; view basic history.
- As a user, I can export my data and delete my account/data.
- As an admin, I can add/edit foods, set images, verify entries, and import by barcode from OFF.
- As an admin, I can view basic usage analytics.

## 5. Functional Requirements
- Authentication
  - Providers: Google (now), Apple (later). Email/password optional.
  - Redirects for localhost; production to be added.
- Onboarding
  - Collect units, locale, timezone, consent acceptance (timestamp + terms version).
  - Collect biometrics (weight_kg, height_cm, body_fat_pct optional), activity level, goal type, pace.
- Targets Calculation
  - BMR: Mifflin–St Jeor by default; Katch–McArdle if body fat available.
  - TDEE: activity multiplier; goal calorie adjustment (loss: -10–25%, maintain: ±0–10%, gain: +5–15%).
  - Macros: protein and fat in g/kg (user-tunable defaults), carbs as remainder; fiber target 14 g/1000 kcal.
- Food Catalog
  - Generic and branded foods with nutrients per 100 g, serving sizes, optional barcode, image.
  - Public read; admin write; search by name/brand.
- Diary & Logging
  - Add items with serving and quantity; compute grams; snapshot per-item nutrients; maintain per-day totals.
  - Meals: breakfast/lunch/dinner/snack; notes optional.
- Barcode Scanning (Web PWA)
  - Camera-based scanning using @zxing/browser; fallback to manual barcode entry.
  - Lookup order: local foods by barcode → OFF fetch/normalize→ insert into catalog.
- Dashboards
  - Today view: targets vs consumed (kcal, protein, carbs, fat; show fiber and core micros when present).
  - History view: recent days; basic charts.
- Admin Dashboard
  - Foods CRUD, image upload, verify flag; on-demand OFF importer by barcode.
  - Analytics: signups, DAU, most searched/logged foods.
- Privacy & GDPR
  - Consent capture before non-essential analytics.
  - Export and delete data endpoints and UI.
  - RLS enforced; minimal PII.

## 6. Non-functional Requirements
- Mobile-first responsive; PWA installable later.
- Accessibility AA; keyboard nav and reduced motion.
- Performance: sub-150ms local interactions; search under 300ms on typical datasets.
- Security: RLS on all tables; service role secret server-only; HTTPS in prod.

## 7. Data Model (Supabase)
- profiles(id, full_name, avatar_url, role[user|moderator|admin], units, locale, timezone, accepted_privacy_at, accepted_terms_version)
- biometrics(id, user_id, ts, weight_kg, height_cm, body_fat_pct, measurements)
- goals(id, user_id, activity_level, goal_type, pace, protein_strategy, protein_g_per_kg, fat_g_per_kg, carb_strategy, carb_g)
- targets(id, user_id, date, calories_kcal, protein_g, carbs_g, fat_g, fiber_g, method, meta)
- foods(id, name, brand, category, barcode, image_path, serving_sizes[], nutrients_per_100g, nutrients_per_serving, source[curated|usda|openfoodfacts], verified)
- recipes(post-MVP)
- diary_entries(id, user_id, date, meal_type, items[], totals, notes)
- analytics_events(id, user_id?, name, props, ts)

RLS overview
- profiles: user can read/update own; admins can read/update all.
- biometrics/goals/targets/diary: owner full access; admins read.
- foods: public read; admin write.
- analytics_events: write via service role; admins read.

## 8. Key Flows
- Login: /login → Google OAuth → /auth/callback → /
- Onboarding: collect profile, biometrics, goals → call calc-targets → show today targets.
- Logging: search → choose serving/quantity → add item → diary totals update → show progress.
- Barcode: scan → match local or import via OFF → add item.
- Privacy: settings → export data (signed URL) or delete account (re-auth + purge).

## 9. Integrations
- Google OAuth (ready). Apple Sign In (later).
- Open Food Facts for barcode-based import.

## 10. Success Metrics (MVP)
- Activation: % users completing onboarding and logging ≥1 item day 1.
- Retention: D7 retention; average logging days per week.
- Time-to-log: median seconds from search to add.
- Data rights: export/download success rate; deletion completion time.

## 11. Risks & Mitigations
- Barcode coverage gaps: add manual entry; allow admin quick-add; cache imports.
- Nutrient variance: standardize per-100g; show data source; prefer verified items.
- Privacy compliance: collect consent; provide DSR endpoints; document processors.
- Performance: create indexes (fts on foods name/brand; compound user_id+date on diary/targets).

## 12. Release Plan
- M0: Auth + project setup + schema/RLS + storage.
- M1: Onboarding + calc-targets function + today view.
- M2: Food search + logging + daily totals + barcode importer.
- M3: Admin foods CRUD + images + basic analytics.
- M4: GDPR export/delete UI and functions + polish.
- Post-MVP: recipes, deeper analytics, Apple Sign In, native integrations.

## 13. Current Implementation Status (running log)
- Auth: Google OAuth and email/password flows wired via Supabase; callback route implemented.
- App shell: Global header shows auth state; sign-out button available.
- Dashboard: Layout with tabs for `Today` and `History`; `/dashboard` redirects to `/dashboard/today`. Mobile bottom tabs added: Today, History, Scan, Search, Settings.
- Today: Summary cards pull from `targets` and consumed totals; client-side optimistic update after adding an item.
- History: Placeholder section with empty state.
- Admin: Stub page at `/admin`; role checks to be added once `profiles` table exists.
- Database: Core schema (profiles, biometrics, goals, targets, foods, diary_entries, analytics_events) and RLS policies created; indexes and FTS added.
- Admin access: `/admin` gated via `profiles.role` (admin/moderator) server-side.
- Onboarding: Pages for Profile/Consent, Biometrics, and Goals wired to Supabase; targets calculation function pending.
- Search: Full-text via RPC with ranking; barcode fallback; Add Item form with serving/quantity, nutrient preview, and inserts into diary; `/api/barcode/lookup` OFF stub added.
- Today: Recent items list with item-level remove and optimistic totals; diary entries support multiple items per meal; `add_diary_item`/`remove_diary_item` RPCs manage totals.