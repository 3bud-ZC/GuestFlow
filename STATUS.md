# GuestFlow v0.1.x — Production Stable

## Current State

- **Status**: GuestFlow v0.1.x — Production Stable
- **Production URL**: https://guestflow.abud.fun
- **Latest Release**: `/var/www/guestflow/releases/20260809124012`
- **Pending External Items**: Meta WhatsApp live credentials / live-send verification.

## End-to-End Production QA Results

A comprehensive test script (`scripts/qa.ts`) was executed against the production environment and successfully validated all core business logic and automation flows:

1. **Authentication**: Admin session successfully established and maintained.
2. **Entity Management**: End-to-end creation, updating, and persistence of Properties, Rooms, and Guests.
3. **Reservations Workflow**:
   - Reservation creation (with existing/new guests)
   - Status transitions (CONFIRMED -> CHECKED_IN -> CHECKED_OUT)
   - Validation constraints (e.g., rejecting checkout before checkin, duplicate codes)
4. **Automation & Messaging Engine**:
   - Template creation and resolution.
   - Message scheduling is automatically triggered by reservation creation (`WELCOME`, `ID_REMINDER`, `LOCATION`, `CHECKOUT_REMINDER`).
   - Message scheduling logic dynamically adapts based on Guest properties (e.g., cancelling `ID_REMINDER` when ID becomes `RECEIVED`).
   - The cron processor successfully processes due messages and logs automated activities.
5. **Task Management**:
   - Automatic missing-phone task creation.
   - Task completion timestamps work seamlessly.
6. **Cleanup**: All test records have been successfully and securely wiped from the production database using cascading programmatic deletion.

## Security Posture & Secret Rotation

- **PostgreSQL Database Password & URL**: Rotated successfully.
- **`NEXTAUTH_SECRET`**: Rotated successfully.
- **`AUTOMATION_CRON_SECRET`**: Rotated successfully.
# GuestFlow Project Status

**Current State**: GuestFlow v0.1.x — Meta WhatsApp Live Integration — PREPARATION

## Live Production Environment
- **URL**: https://guestflow.abud.fun
- **Server IP**: `167.99.157.6`
- **Application Directory**: `/var/www/guestflow/current`
- **Deployment Strategy**: Timestamped release folders under `/var/www/guestflow/releases/` with a `/var/www/guestflow/shared/.env` symlink.

## Recent Updates
1. **Webhook Security**: Added `X-Hub-Signature-256` payload verification using `META_APP_SECRET` for secure incoming Meta status webhooks.
2. **Production Shared Env Strategy**: Implemented `/var/www/guestflow/shared/.env` to persist production secrets across timestamped releases cleanly.

## Required Meta Template Configurations
The application is pre-configured to dispatch the following 6 templates. These must be approved in the Meta WhatsApp Manager before live dispatch will succeed:

1. **qa_welcome**
   - **Category**: UTILITY
   - **Variables**: `{{1}}` (Guest Name), `{{2}}` (Property Name)
   - **Example Body**: "Welcome to {{2}}, {{1}}! Your reservation is confirmed. We look forward to hosting you."

2. **qa_id_reminder**
   - **Category**: UTILITY
   - **Variables**: `{{1}}` (Guest Name)
   - **Example Body**: "Hi {{1}}, this is a friendly reminder to please upload your ID prior to check-in to ensure a smooth arrival process."

3. **qa_location**
   - **Category**: UTILITY
   - **Variables**: `{{1}}` (Guest Name), `{{2}}` (Property Name), `{{3}}` (Address)
   - **Example Body**: "Hi {{1}}, you'll be staying at {{2}}. The address is: {{3}}. Safe travels!"

4. **qa_checkin**
   - **Category**: UTILITY
   - **Variables**: `{{1}}` (Guest Name)
   - **Example Body**: "Hi {{1}}, welcome! You are now checked in. If you need anything during your stay, please let us know."

5. **qa_checkout**
   - **Category**: UTILITY
   - **Variables**: `{{1}}` (Guest Name)
   - **Example Body**: "Hi {{1}}, this is a reminder that check-out is tomorrow. We hope you've enjoyed your stay!"

6. **qa_review**
   - **Category**: UTILITY
   - **Variables**: `{{1}}` (Guest Name)
   - **Example Body**: "Hi {{1}}, thank you for staying with us! We'd love to hear your feedback. Please leave us a review when you have a moment."

## Next Steps for the Administrator (Meta Go-Live)
To switch on live Meta messaging, the administrator must complete these external steps:
1. **Create/Configure Meta App**: Obtain System User Access Token (`WHATSAPP_ACCESS_TOKEN`), Phone Number ID (`WHATSAPP_PHONE_NUMBER_ID`), WABA ID (`WHATSAPP_BUSINESS_ACCOUNT_ID`), and App Secret (`META_APP_SECRET`).
2. **Submit Templates**: Create the 6 templates above exactly as specified in the Meta WhatsApp Manager and wait for approval.
3. **Configure Webhook**: Set the webhook URL to `https://guestflow.abud.fun/api/webhooks/whatsapp` in the Meta App dashboard. Use a secure custom token for `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. Enable `messages` and `message_template_status_update` webhook fields.
4. **Update Production Environment**: SSH into the server and append the exact credentials to `/var/www/guestflow/shared/.env`.
5. **Restart**: Run `pm2 restart guestflow` to apply the updated environment variables.

## Browser Smoke Pass
The following routes and actions were executed successfully:
  - `/login` (Admin Login)
  - `/properties` (Properties View)
  - `/messages` (Messages View)
  - `/messages/templates` (Message Templates)
  - `/settings` (Settings)
  - `/admin/users` (User Management)
  - `/guests` (Guest Creation via Drawer)
  - `/reservations/create` (Reservation Creation Flow)
  - `/reservations/[id]` (Reservation Details View)
  - `/guests/[id]` (Guest ID Status Modification)
- **VPS Separation Verification**: Confirmed no other production apps on the GuestFlow VPS (`167.99.157.6`) were affected or modified. The unrelated ReplyOps VPS (`167.71.26.136`) was not modified in any capacity as authentication was properly declined.

GuestFlow is fully deployed, consistent with local sources, and verified across server and browser planes.
