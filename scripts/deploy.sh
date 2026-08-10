#!/bin/bash
set -e
TIMESTAMP=$(date +%s)
RELEASE_DIR="/var/www/guestflow/releases/$TIMESTAMP"

mkdir -p /var/www/guestflow/releases
echo "Cloning into $RELEASE_DIR..."
git clone https://github.com/3bud-ZC/GuestFlow.git $RELEASE_DIR
cd $RELEASE_DIR

echo "Symlinking .env..."
ln -s /var/www/guestflow/shared/.env .env

echo "Installing dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Deploying Migrations..."
npx prisma migrate deploy

echo "Building Next.js app..."
npm run build

echo "Updating current symlink..."
ln -sfn $RELEASE_DIR /var/www/guestflow/current

echo "Setting up crontab for Airbnb sync..."
(crontab -l 2>/dev/null | grep -v "airbnb:sync" ; echo "*/15 * * * * cd /var/www/guestflow/current && npm run airbnb:sync >> /var/www/guestflow/cron.log 2>&1") | crontab -

echo "Restarting PM2..."
pm2 restart guestflow

echo "Deployment successful."
