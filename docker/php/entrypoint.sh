#!/bin/bash
set -e

APP_DIR="/var/www"

# Ensure dependencies are installed
if [ ! -f "$APP_DIR/vendor/autoload.php" ]; then
  echo "📦 Running composer install..."
  composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
fi

# Immutable: sync public from image to public_volume (shared with nginx)
# This ensures build assets are available to nginx after image rebuild
if [ -d "$APP_DIR/public_volume" ]; then
  echo "📤 Syncing public assets to public_volume..."
  # Use rsync if available (faster for incremental), fallback to cp
  if command -v rsync &> /dev/null; then
    rsync -a --delete "$APP_DIR/public/" "$APP_DIR/public_volume/"
  else
    cp -a "$APP_DIR/public/." "$APP_DIR/public_volume/"
  fi
  echo "✅ Public assets synced (including /build)"
fi

echo "🧹 Setting Laravel permissions..."

# Create all required storage directories (volumes mount over storage/app and storage/logs)
echo "📁 Creating storage directories..."
# Ensure keys is a directory (Telebirr/RSA); fix if volume has a file named keys from prior state
if [ -e "$APP_DIR/storage/app/keys" ] && [ ! -d "$APP_DIR/storage/app/keys" ]; then
  rm -f "$APP_DIR/storage/app/keys"
fi
mkdir -p $APP_DIR/storage/app/keys
mkdir -p $APP_DIR/storage/app/public
mkdir -p $APP_DIR/storage/framework/{cache,sessions,views,testing}
mkdir -p $APP_DIR/storage/logs/{api,auth,payment,security,http,business,jobs,performance,audit,json}
mkdir -p $APP_DIR/bootstrap/cache

# Fix permissions (works for both bind mounts and volumes)
echo "🔐 Fixing ownership and permissions..."
chown -R www-data:www-data $APP_DIR/storage $APP_DIR/bootstrap/cache 2>/dev/null || true
chmod -R 775 $APP_DIR/storage $APP_DIR/bootstrap/cache 2>/dev/null || true
find $APP_DIR/storage $APP_DIR/bootstrap/cache -type d -exec chmod 775 {} \; 2>/dev/null || true
find $APP_DIR/storage $APP_DIR/bootstrap/cache -type f -exec chmod 664 {} \; 2>/dev/null || true

# Ensure log files are writable (including API and other channels)
echo "📝 Ensuring log files are writable..."

# Main Laravel log
touch $APP_DIR/storage/logs/laravel.log 2>/dev/null || true
chown www-data:www-data $APP_DIR/storage/logs/laravel.log 2>/dev/null || true
chmod 664 $APP_DIR/storage/logs/laravel.log 2>/dev/null || true

# Channel-based logs (api, auth, payment, etc.)
CURRENT_DATE=$(date +%F)
for channel in api auth payment security http business jobs performance audit json; do
  CHANNEL_DIR="$APP_DIR/storage/logs/$channel"
  CHANNEL_FILE="$CHANNEL_DIR/${channel}-${CURRENT_DATE}.log"

  mkdir -p "$CHANNEL_DIR" 2>/dev/null || true
  touch "$CHANNEL_FILE" 2>/dev/null || true
  chown -R www-data:www-data "$CHANNEL_DIR" 2>/dev/null || true
  chmod -R 775 "$CHANNEL_DIR" 2>/dev/null || true
  find "$CHANNEL_DIR" -type f -exec chmod 664 {} \; 2>/dev/null || true
done

# Clear Laravel caches so no stale paths from host/previous runs (avoids 500 after immutable switch)
if [ -f "$APP_DIR/artisan" ]; then
  php "$APP_DIR/artisan" config:clear 2>/dev/null || true
  php "$APP_DIR/artisan" cache:clear 2>/dev/null || true
  php "$APP_DIR/artisan" view:clear 2>/dev/null || true
fi

echo "✅ Permissions configured."

# Start main process
exec "$@"
