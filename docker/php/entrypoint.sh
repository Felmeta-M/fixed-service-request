#!/bin/bash
set -e

APP_DIR="/var/www"

# Ensure dependencies are installed
if [ ! -f "$APP_DIR/vendor/autoload.php" ]; then
  echo "📦 Running composer install..."
  composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
fi

echo "🧹 Setting Laravel permissions..."

# Create log subdirectories if they don't exist
echo "📁 Ensuring log directories exist..."
mkdir -p $APP_DIR/storage/logs/{api,auth,payment,security,http,business,jobs,performance,audit,json}

chown -R www-data:www-data $APP_DIR/storage $APP_DIR/bootstrap/cache
chmod -R ug+rwx $APP_DIR/storage $APP_DIR/bootstrap/cache
find $APP_DIR/storage $APP_DIR/bootstrap/cache -type d -exec chmod g+s {} \;

echo "✅ Permissions fixed."

# Start main process (supervisord)
exec "$@"
