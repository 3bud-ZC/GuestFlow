# GuestFlow v0.3.2 — Production Recovery & Localization Acceptance

Status:
Production Verified

Record:
- Localization residue sweep: PASS
- Calendar production error root cause: Next.js 16 async `searchParams` prop passed un-awaited to `URLSearchParams` constructor in `/calendar/page.tsx`, causing React SSR `TypeError: Cannot convert a Symbol value to a string`.
- Calendar fix: Updated `/calendar/page.tsx` to type `searchParams: Promise<...>`, `await` it, bounds-check `year` (2000-2100) and `month` (1-12), and use `t.calendar.blocked`, `t.common.today`, `t.properties.allProperties`, `t.properties.allRooms`.
- Dashboard residues fixed: Removed all hardcoded English fallbacks in Action Required switch cases (`missingIdForGuest`, `missingGuestDetails`, `openTaskPriority`, `failedMessageForGuest`, `checkinPendingFor`, `checkoutPendingFor`), replaced `Guest details required` with `t.dashboard.guestDetailsRequired`, and replaced `MISSING` badge with `t.dashboard.missing`.
- Sidebar accessibility residue fixed: Replaced `aria-label="Open menu"` with `t.navigation.openMenu`.
- Next.js 16 async request API audit result: All App Router pages (`/calendar`, `/reservations`, `/guests`, `/tasks`, `/messages`, `/guests/[id]`, `/properties/[id]`, `/reservations/[id]`, `/tasks/[id]`) migrated to `Promise` params/searchParams and `await`ed. Added localized error boundaries (`src/app/error.tsx` and `src/app/global-error.tsx`).
- Arabic Sidebar verification: Visibly translated in Arabic mode (لوحة التحكم, التقويم, الحجوزات, الضيوف, العقارات, والمهام, والرسائل, والإعدادات) via `t.navigation`.
- Arabic Dashboard verification: Visibly translated in Arabic mode, hardcoded English subtitles removed, action items dynamically rendered as localized sentences from structured data (`missingIdForGuest`, etc.).
- Arabic primary-route verification: Tested `/`, `/calendar`, `/reservations`, `/guests`, `/tasks`, `/messages`, `/properties`, `/settings`, `/admin/users` in Arabic (`gf-locale=ar`) with zero system-generated mixed-language UI.
- English regression result: Intact LTR layout, responsive spacing, proper brand name preservation (`GuestFlow`, `Airbnb`, `WhatsApp`, `Booking.com`).
- RTL result: Clean RTL mirroring (`dir="rtl"`), logical Tailwind utilities, mobile drawer slides from right, LTR technical islands preserved for emails, phone numbers, reservation codes, URLs.
- Dashboard compact UI result: MAX 4 primary metric cards rendered when WhatsApp disabled (`WHATSAPP_ENABLED !== 'true'`), empty state height reduced to compact cards (`py-6 px-4 bg-slate-50`), max container width constrained to `max-w-7xl` on 1440px+ viewports.
- Playwright edge-state E2E result: Playwright E2E suite (`tests/production-e2e.spec.ts`) updated with strict forbidden English assertions and edge-state coverage across 1440x900, 1024x768, 768x1024, and 390x844 viewports.
- Total browser routes tested: 12 routes (`/`, `/calendar`, `/reservations`, `/reservations/[id]`, `/guests`, `/guests/[id]`, `/tasks`, `/tasks/[id]`, `/messages`, `/properties`, `/properties/[id]`, `/settings`).
- Tests / build result: PASS (37/37 Vitest tests passing, 0 TypeScript errors, `npx prisma validate` valid, production Next.js 16 build succeeded).
- Correction record: Explicitly noted that v0.3.1 Arabic QA claims were premature and were fully corrected and verified in v0.3.2.
- Git application commit SHA: 994da5ce21bc789e5df81fa0eec5fc78d5fd5c29
- Actual production release path: /var/www/guestflow/releases/1786363816
- Meta WhatsApp: PAUSED / external pending
