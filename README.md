# CORE FIT: Production-Ready Fitness Web App

**Tagline:** Build Strength From Within  
**Brand Identity:** Minimal, editorial, precise, premium, performance-focused  
**Palette:** White (`#FFFFFF`), Charcoal Black (`#15171A`), Signature CORE FIT Red (`#E50914`), Neutral Borders (`#D9DDE2`)  
**Target:** Mobile-first responsive web application with full desktop sidebar support and offline PWA capability.

---

## 1. Overview & Architectural Principles

CORE FIT is an engineered, production-ready fitness tracking platform built without fabricated demo metrics, synthetic AI placeholders, or purple gradient templates. 

- **Local-First & Data Sovereignty:** Biometric records, workout volume, food logs, and progress photos are stored persistently and privately inside the browser sandbox (LocalStorage + IndexedDB). Zero unsolicited surveillance sync.
- **ICMR-NIN Regional Food Database:** Comprehensive nutrition composition covering authentic South Indian staples (Idli, Sambar, Dosa, Puttu, Kadala Curry, Appam & Stew, Idiyappam, Upma, Matta Rice, Thoran, Kerala Fish Curry, Porotta), North/Wider Indian foods, and Wider Asian dishes with exact Indian household serving units (Katori, Piece, Bowl, Plate).
- **Biomechanical Exercise Education:** 11 workout disciplines with detailed anatomical cues (Stance, Grip, Valsalva Breathing, Common Biomechanical Faults) accompanied by animated vector bar paths.
- **Deterministic Targets:** Caloric and macronutrient recommendations calculated using transparent Harris-Benedict BMR and TDEE formulas based on user biometric inputs.

---

## 2. 12 Functional Modules

1. **Home Dashboard:** Daily step count with progress bar, activity calorie estimates, body weight trend, weekly workout adherence, today's meal summary, hydration progress, verified milestones, and quick action buttons.
2. **Movement & Step Tracking:** Daily steps, editable step goal, active minutes, estimated calories, distance calculation, manual cardio logs (Walking, Running, Cycling, HIIT), and integration architecture.
3. **Weight & Body Composition:** Weigh-in logging with date and time, kg/lbs conversion toggle, starting/current/target weight, period charts (7d, 30d, 90d, 180d, 365d, all), body measurements (waist, chest, hips), and private IndexedDB progress photo vault.
4. **Nutrition & Regional Food Diary:** Searchable database with regional alias lookup, cuisine filters (South Indian, Wider Indian, High Protein, Wider Asian), meal breakdown (Breakfast, Lunch, Dinner, Snacks), custom recipe/food creator, and real-time macro balance (Protein, Carbs, Fat, Fibre).
5. **Gym Workout Library & Exercise Education:** 11 disciplines (Full Body, Upper, Lower, Push, Pull, Legs, Chest & Triceps, Back & Biceps, Shoulders, Arms, Core, Cardio, Mobility) with biomechanical SVG animations, execution cues, and 1-click addition to active sessions.
6. **Active Workout Session & Stopwatch:** Live session stopwatch, sets/reps/load logging with check-off completion, progressive overload memory recalling previous session weights, and an integrated audio rest interval timer (30s, 60s, 90s, 120s, 180s).
7. **Progress & Performance Reports:** Cumulative volume load tracking (Weight × Reps), frequency audit, verified personal records (PRs) table, and adherence metrics compiled strictly from real saved workouts.
8. **Goals & Personalized Plan:** Objective selection (weight loss, muscle growth, endurance, health), transparent BMR/TDEE calculations, customizable macro splits, and customized weekly workout splits.
9. **Water & Habit Tracking:** Hydration tracking with quick buttons (+250ml, +500ml, +750ml, +1000ml) and a daily wellness protocol checklist (8h sleep, steps, protein target, stretching, creatine/supplements).
10. **Profile & Settings:** Biometrics management, unit switching (kg/lbs, cm/inches), notification toggles, complete encrypted JSON database export/import, and safe data wiping.
11. **Authentication & Guided Onboarding:** Email/password authentication, Google Sign-In support, guest offline-first mode, password reset flow, and a 7-step guided onboarding wizard featuring the official CORE FIT logo asset.
12. **Admin & Content Management:** Catalog manager for custom foods and custom exercises, sandbox storage footprint audit, and client diagnostic telemetry event logger.

---

## 3. Running & Deployment

### Quick Start
Double-click `start-server.bat` in the project root, or execute:

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Build production bundle
npm run build

# Preview production bundle
npm run preview
```

### Static Build Output
Running `npm run build` generates the optimized static bundle in the `/dist` directory, fully ready for deployment to Cloudflare Pages, Vercel, Netlify, or any static HTTP web host.
