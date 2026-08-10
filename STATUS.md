# GuestFlow v0.2.0 — Airbnb Integration

Status:
Production Stable — Awaiting Airbnb Feed Reconnection

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
- Actual production release path: `/var/www/guestflow/releases/<new_timestamp>` securely deployed
- Final Git commit SHA will be generated shortly
- Meta WhatsApp: PAUSED / external pending
