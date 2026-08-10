# GuestFlow v0.3.3 — Runtime Stability & Real-World Performance Pass

Status:
Production Verified

Record:
- Properties Route Crash Root Cause & Fix: Next.js 16 App Router Server Component serialization crash caused by passing `onClick={(e) => e.stopPropagation()}` to `<Link>` inside Server Component (`src/app/properties/page.tsx`) and nesting `<Link>` elements inside outer `<Link href="/properties/${id}">`. Refactored `PropertiesPage` to use clean card hierarchy and removed server-side `onClick` event handlers.
- Monolingual Error Boundary Fix: Refactored `src/app/error.tsx` and `src/app/global-error.tsx` client components to compute initial locale lazily from `document.cookie` / `document.documentElement.lang`, guaranteeing strictly single-language UI (English-only in EN, Arabic-only in AR) with zero bilingual bleeding.
- Server Waterfall Parallelization: Applied `Promise.all` across all App Router routes (`/properties`, `/calendar`, `/reservations`, `/guests`, `/tasks`, `/messages`, `/settings`, `/admin/users`, `/properties/[id]`, `/guests/[id]`, `/reservations/[id]`) to fetch database records, session auth, and cookies concurrently.
- Client-Side Transition Optimization: Replaced hard browser reloads (`<a>` wrapper in `RoomRow.tsx` and `window.location.href` in `AirbnbWizard.tsx`) with Next.js `useRouter().push()` and `router.refresh()`.
- Database Query Optimization: Lightened `propertyService.getProperties()` query shape to avoid fetching full Room objects for connected counts; created `getPropertiesForSelector()` for dropdowns and Calendar page.
- Release Retention Policy: Updated `deploy_remote.sh` to retain current release + 4 previous timestamped releases (`/var/www/guestflow/releases/*`) and automatically prune older releases.
- VPS Nginx Optimization: Updated `/etc/nginx/sites-available/guestflow` on VPS `167.99.157.6` to enable HTTP/2 (`listen 443 ssl http2`), immutable static caching for `/_next/static/` (`Cache-Control "public, max-age=31536000, immutable"`), and proxy headers (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`).
- Real-World Navigation Benchmark Results (Playwright on live HTTPS production `https://guestflow.abud.fun`):
  - Dashboard -> Calendar: Visible median 49ms (p95 56ms), Settled median 50ms (p95 57ms), 1.0 request
  - Calendar -> Reservations: Visible median 49ms (p95 50ms), Settled median 49ms (p95 51ms), 1.0 request
  - Reservations -> Guests: Visible median 48ms (p95 49ms), Settled median 49ms (p95 50ms), 1.0 request
  - Guests -> Properties: Visible median 49ms (p95 51ms), Settled median 49ms (p95 52ms), 1.0 request
  - Properties -> Tasks: Visible median 49ms (p95 62ms), Settled median 49ms (p95 63ms), 1.2 requests
  - Tasks -> Messages: Visible median 49ms (p95 50ms), Settled median 50ms (p95 51ms), 1.2 requests
  - Messages -> Settings: Visible median 49ms (p95 49ms), Settled median 50ms (p95 52ms), 1.2 requests
  - Settings -> Dashboard: Visible median 49ms (p95 65ms), Settled median 50ms (p95 66ms), 1.4 requests
- Full E2E & Unit Test Pass: 37/37 Vitest tests passing, ESLint passing with 0 errors, TypeScript compiling with 0 errors, Next.js build succeeding in 17.6s, 14/14 Playwright E2E & performance tests passing on production.
- Git application commit SHA: 032c577 (plus STATUS update commit)
- Actual production release path: /var/www/guestflow/releases/1786387967
- Maintenance Procedures:
  - Release retention: Automatically handled during `deploy_remote.sh` (keeps current + 4 latest timestamped directories in `/var/www/guestflow/releases`).
  - PM2 logs inspection: Run `ssh root@167.99.157.6 "pm2 logs guestflow --lines 50 --nostream"` to view current runtime logs or `pm2 flush guestflow` to clear old logs.
