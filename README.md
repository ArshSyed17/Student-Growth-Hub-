# Student Growth Hub

An interactive growth-campaign prototype for a free workshop, **"Build Your First AI Project in 60 Minutes"**.
Target: **500 final-year engineering student registrations in 7 days on a ₹2,000 budget.**

> **Independent internship assignment prototype.** It is not an official NxtWave product, uses no NxtWave logos,
> and does **not** register anyone for a real NxtWave event.

## What's inside

| Area | Route | Notes |
| --- | --- | --- |
| Public workshop page + registration form | `/register` (also `/`) | Validation, normalised-email duplicate check, `?ref=` referral capture, success/error/loading states |
| Overview dashboard | `/admin` | 8 KPI cards, progress bar, daily trend, source chart, leaderboard, recent activity, channel table |
| Registrations | `/admin/registrations` | Search, source/record-type filters, date sort, CSV export, empty states |
| Referral Leaderboard | `/admin/referrals` | Add ambassadors, unique codes, copy link, WhatsApp share, derived counts and ranks |
| Campaign Experiments | `/admin/experiments` | 3 experiments, editable status + notes, nothing pre-filled |
| Settings | `/admin/settings` | Planned vs actual budget, cost per registration, demo data controls, security notes |

Stack: React 18, TypeScript, Vite, Tailwind CSS 3, Recharts, Lucide React, React Router. No backend, paid service
or environment variable is required. Supabase is **not** included (see "Path to production").

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm test           # 23 unit tests for validation, dedupe, attribution, analytics, CSV, URLs
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

Try it: open `http://localhost:5173/register?ref=ARSH01`, submit the form, then open `/admin`. The new
registration appears as **Actual**, ARSH01's count goes up, and the charts recalculate.

## Demo mode and data

- First visit seeds **27 synthetic registrations**, **5 ambassadors** and sample spend, under the banner
  **"DEMO MODE — SAMPLE DATA"**. Emails use `example.com` and colleges are fictional.
- Seeding happens **only** when localStorage is empty (or unreadable). Reloading never overwrites your data.
- Every record carries `origin: "sample" | "actual"` and is badged **Sample** / **Actual** in tables. The Overview
  can filter to sample-only or actual-only records.
- Settings offers: **Reset Demo Data**, **Remove sample data only** (keeps your entries), and **Use empty dataset**.
  Experiment statuses and notes are kept by these actions.

## How the rules work

- **Email normalisation:** trim, lowercase, strip `+tag`, remove dots for Gmail, `googlemail.com` → `gmail.com`.
  Duplicates are rejected on the normalised value.
- **Attribution:** a known referral code (case-insensitive) → `Referral`; none → `Direct/Organic`. Unknown codes and
  self-referrals (same email or same name as the ambassador) are still registered, but as Direct/Organic, with a note.
- **Referral counts are derived** from registrations on every render; they are never stored or user-editable.
- **Referral URLs** are built from `window.location.origin`, e.g. `https://your-app.vercel.app/register?ref=ARSH01`.
- **CSV export** exports the currently filtered rows and neutralises spreadsheet formula injection.
- **Experiments** start as *Planned*. The app never generates results.
- **Budget:** ₹1,200 rewards + ₹300 materials + ₹500 contingency = ₹2,000 **planned**. Actual spend is entered
  separately; cost per valid registration = actual spend ÷ registrations (N/A when there are none).

## Project structure

```
src/
  main.tsx, App.tsx, index.css
  types.ts                 TypeScript interfaces
  lib/
    constants.ts           campaign, budget plan, experiment definitions
    utils.ts               email, dates, INR, URLs, clipboard, CSV
    logic.ts               pure functions: validation, registration, ambassadors, analytics
    seed.ts                synthetic demo dataset + empty state
    storage.ts             localStorage load/save with validation
  store/AppStore.tsx       React context wrapping the data layer
  components/              Toast, StatCard, CopyButton, DemoBanner, ui primitives, layouts
  pages/                   Register, Overview, Registrations, Referrals, Experiments, Settings
tests/logic.test.ts
```

## Security and privacy (read this)

- Data is stored in **this browser's localStorage** only. It is not shared across visitors or devices and is erased if
  site data is cleared. **Not suitable for collecting real public registrations at scale.**
- The `/admin` screens have **no real access control**; all code ships to the browser. Do not treat them as secured.
- No secrets or credentials are stored in the frontend. Only name, email and college are collected, with consent.
- Client-side validation is a convenience, not a security boundary.

## Path to production

1. **Database:** e.g. Supabase/Postgres `registrations` table with a unique index on `normalized_email`, plus
   `ambassadors` and `experiments` tables.
2. **Server-side logic:** an edge function/API that validates input, normalises the email, resolves the referral code,
   blocks self-referrals and inserts the record. Add rate limiting and bot protection.
3. **Auth:** real authentication for the admin dashboard and row-level security. Keep service keys server-side only.
4. **Operations:** confirmation emails, consent records, data-deletion handling and aggregated analytics queries.
5. Replace `src/lib/storage.ts` and `src/store/AppStore.tsx` with an async data client; the pure functions in
   `logic.ts` can be reused for shared rules and tests.

## Deploy to GitHub and Vercel

```bash
git init
git add .
git commit -m "Student Growth Hub prototype"
git branch -M main
# create an empty repo on github.com, then:
git remote add origin https://github.com/<your-username>/student-growth-hub.git
git push -u origin main
```

Then on [vercel.com](https://vercel.com): **Add New → Project → Import** the GitHub repo. Vercel auto-detects Vite
(build command `npm run build`, output directory `dist`). Click **Deploy**. `vercel.json` rewrites all paths to
`index.html` so `/register?ref=ARSH01` and `/admin` work on refresh. Share `https://<project>.vercel.app/register`
for the public demo. Remember every visitor gets their own private localStorage data.

## Manual QA checklist

- [ ] Submit empty form → field errors; invalid email → email error; consent unchecked → consent error
- [ ] Register twice with `A@x.com` and ` a+1@x.com ` → second is rejected as duplicate
- [ ] Open `/register?ref=ARSH01` → code prefilled; after submit the registration is credited to ARSH01
- [ ] Register using an ambassador's own name/email as referrer → recorded as Direct/Organic with a note
- [ ] `/admin` totals, charts and leaderboard update after each registration
- [ ] Registrations: search, filters, sort toggle, Export CSV downloads a file
- [ ] Referrals: add ambassador, Copy link, WhatsApp opens `wa.me` with the prefilled message
- [ ] Refresh the page → data persists; Reset Demo Data / Use empty dataset behave as described
