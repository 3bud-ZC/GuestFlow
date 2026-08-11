#!/bin/bash
set -e

# Configuration
REPO_URL="https://github.com/3bud-ZC/GuestFlow.git"
BRANCH="master"
RELEASE_DIR="/var/www/guestflow/releases"
CURRENT_DIR="/var/www/guestflow/current"
SHARED_ENV="/var/www/guestflow/shared/.env"
TIMESTAMP=$(date +%s)
NEW_RELEASE_PATH="${RELEASE_DIR}/${TIMESTAMP}"

echo "Starting atomic deployment to ${NEW_RELEASE_PATH}..."

# 1. Ensure directories exist
mkdir -p "$RELEASE_DIR"

# 2. Clone fresh release
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$NEW_RELEASE_PATH"
cd "$NEW_RELEASE_PATH"

# 3. Link shared .env
if [ -f "$SHARED_ENV" ]; then
  ln -s "$SHARED_ENV" .env
  echo "Linked shared .env"
else
  echo "WARNING: Shared .env not found at $SHARED_ENV"
fi

# 4. Install dependencies deterministically
npm ci

# 5. Database generation & migration
npx prisma generate
npx prisma migrate deploy

# 6. Build application
npm run build

# 7. Atomic switch
ln -sfn "$NEW_RELEASE_PATH" "$CURRENT_DIR"
echo "Switched /current to $NEW_RELEASE_PATH"

# 8. Restart guestflow with PM2 via a persistent ecosystem file
# (guestflow must bind PORT=3232 to match the nginx proxy_pass target;
# the ecosystem file bakes that in so restarts can't silently drift to
# the Next.js default port. Written each deploy so a fresh server needs
# no manual PM2 setup.)
cat > /var/www/guestflow/ecosystem.config.js <<'ECOSYSTEM'
module.exports = {
  apps: [{
    name: 'guestflow',
    cwd: '/var/www/guestflow/current',
    script: 'npm',
    args: 'run start',
    env: { PORT: '3232', NODE_ENV: 'production' },
    autorestart: true,
    max_restarts: 10,
  }]
}
ECOSYSTEM

cd "$CURRENT_DIR"
pm2 startOrRestart /var/www/guestflow/ecosystem.config.js

# pm2 save to persist across reboots
pm2 save

# 8b. Health check: verify the app actually bound port 3232 before declaring success
sleep 3
if ! curl -sf -o /dev/null "http://127.0.0.1:3232/"; then
  echo "ERROR: guestflow did not respond on port 3232 after restart. Check: pm2 logs guestflow"
  exit 1
fi
echo "Health check passed: guestflow responding on port 3232"

# 9. Release retention: Keep current release and previous 4 timestamped releases
echo "Cleaning up old releases in ${RELEASE_DIR}..."
cd "$RELEASE_DIR"
ls -1t | grep -E '^[0-9]+$' | tail -n +6 | while read -r old_release; do
  if [ -n "$old_release" ] && [ -d "$RELEASE_DIR/$old_release" ]; then
    echo "Removing old release: $old_release"
    rm -rf "$RELEASE_DIR/$old_release"
  fi
done

echo "Deployed to $NEW_RELEASE_PATH"
