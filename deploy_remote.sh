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
npm install

# 5. Database generation & migration
npx prisma generate
npx prisma migrate deploy

# 6. Build application
npm run build

# 7. Atomic switch
ln -sfn "$NEW_RELEASE_PATH" "$CURRENT_DIR"
echo "Switched /current to $NEW_RELEASE_PATH"

# 8. Restart guestflow with PM2
# PM2 restarts guestflow and preserves the rest of the ecosystem
cd "$CURRENT_DIR"
pm2 restart guestflow || pm2 start npm --name "guestflow" -- run start

# pm2 save to persist
pm2 save

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
