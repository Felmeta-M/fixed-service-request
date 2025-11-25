#!/bin/bash

set -e

APP_DIR="/var/www"

echo "🧹 Setting Laravel permissions in $APP_DIR..."

# Fix ownership so Laravel (www-data) can write where needed
chown -R www-data:www-data $APP_DIR/storage $APP_DIR/bootstrap/cache $APP_DIR/public/build

# Set appropriate permissions
find $APP_DIR -type f -exec chmod 664 {} \;
find $APP_DIR -type d -exec chmod 775 {} \;

# Ensure group write + setgid bit (so new files inherit group)
chmod -R ug+rwx $APP_DIR/storage $APP_DIR/bootstrap/cache
find $APP_DIR/storage $APP_DIR/bootstrap/cache -type d -exec chmod g+s {} \;

echo "✅ Permissions fixed."

# Ensure dependencies are installed
if [ ! -f "$APP_DIR/vendor/autoload.php" ]; then
  echo "📦 Running composer install..."
  composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
fi

# Run database migrations (safe for prod)
echo "🧱 Running migrations..."
php artisan migrate --force

# Optimize config, routes, views, etc.
echo "⚙️ Optimizing Laravel..."
php artisan optimize

# Generate Blade Icons Manifest (if using Filament)
if php artisan | grep -q 'filament:optimize'; then
  echo "🎨 Generating Blade icon manifest..."
  php artisan filament:optimize
fi

# Restart queues safely
echo "🔄 Restarting Laravel queue..."
php artisan queue:restart

# Start main process (like php-fpm or supervisord)
echo "🚀 Starting container process..."
exec "$@"
