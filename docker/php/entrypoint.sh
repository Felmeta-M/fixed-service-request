#!/bin/bash
set -e

APP_DIR="/var/www"

# Ensure dependencies are installed
if [ ! -f "$APP_DIR/vendor/autoload.php" ]; then
  echo "📦 Running composer install..."
  composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
fi

echo "🧹 Setting Laravel permissions..."

# Create all required storage directories
echo "📁 Creating storage directories..."
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

# Ensure log files are writable
touch $APP_DIR/storage/logs/laravel.log 2>/dev/null || true
chown www-data:www-data $APP_DIR/storage/logs/laravel.log 2>/dev/null || true
chmod 664 $APP_DIR/storage/logs/laravel.log 2>/dev/null || true

echo "✅ Permissions configured."

# Start main process (supervisord)
exec "$@"
