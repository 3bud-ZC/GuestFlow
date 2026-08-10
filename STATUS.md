# GuestFlow v0.3.0 — UX Simplification, Performance, Arabic Localization & Airbnb Discoverability

Status:
Production Stable — Live on Production VPS

Record:
- Arabic + English bilingual i18n architecture with RTL support and persistent language toggle (`gf-locale` cookie)
- Server-side pagination & PostgreSQL filtering on all list services (Reservations, Guests, Tasks, Messages)
- Navigation simplified: Properties and Calendar moved to primary navigation for all roles
- Quick Add action dropdown added to Topbar (Reservation, Guest, Property, Connect Airbnb)
- Direct Airbnb Connection Wizard introduced at `/properties/connect-airbnb`
- Loading skeletons added for all main routes to eliminate visual layout shifts
- Calendar service refactored to query date ranges on demand
- `getCurrentUser` request-scoped memoization via React `cache()`
- Performance indexes added for Reservation, Task, Message, and AvailabilityBlock
- Production QA data cleaned (130 records removed, zero orphan records remaining)
- Security cleanup completed (removed legacy script files containing credentials)
- Actual production DB backup created: `/var/www/guestflow/backups/guestflow_backup_20260810_075458.sql`
- Meta WhatsApp: PAUSED / external pending
- actual production release path: /var/www/guestflow/releases/1786349273
- final Git HEAD SHA: 92fd19162fc9e94ddfb9a9f54dd2bc0e50cd9868
