# GuestFlow v0.2.0 — Airbnb Integration

Status:
Production Stable — Reconnection UI Implemented & Deployed

Record:
- Security incident resolved (leaked test URL and secret removed)
- Temporary test route `/api/internal/test-airbnb` completely removed
- Middleware bypass removed (internal APIs are secure)
- Git history sanitized via soft reset and clean re-commit
- Production secrets rotated (`DATABASE_URL`, `NEXTAUTH_SECRET`, etc.)
- Old compromised Airbnb connection disabled via SQL (URL wiped, sync paused)
- Airbnb core implementation preserved (Composite keys, Sync Logic, UI)
- Actual locking mechanism documented: Filesystem lock (`/tmp/guestflow-airbnb-sync.lock`) with stale lock DB recovery
- Actual cron verification: `*/15 * * * *` executing `npm run airbnb:sync` via PM2 successfully
- Build and tests pass cleanly
- **Implemented Reconnect UI in Admin Dashboard for safe Airbnb Calendar insertion**
- **Strict Server-Side Duplication Checks added for URL and Listing ID**
- **Client-Side Secret Leak prevented by omitting full URL from client hydration**
- Actual production release path: `/var/www/guestflow/releases/1786344120` securely deployed
- Final Git commit SHA: `7417a5d` (HEAD) + local deployment script
- Meta WhatsApp: PAUSED / external pending
