#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Set correct permissions
echo "Setting directory permissions..."
chown -R $USER:www-data .

find . -type f -exec chmod 664 {} \;   
find . -type d -exec chmod 775 {} \;

echo "Make sure storage and bootstrap/cache are writable by group"
chgrp -R www-data storage bootstrap/cache;
chmod -R ug+rwx storage bootstrap/cache;

# Ensure vendor exists
if [ ! -f /var/www/vendor/autoload.php ]; then
  echo "Running composer install..."
  composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
fi

# Run Laravel migrations safely
echo "Running migrations..."
php artisan migrate --force

# Optionally run config cache (recommended for production)
echo "Caching configuration..."
php artisan optimize

echo "Blade icons manifest"
php artisan filament:optimize

echo "Laravel queue restart"
php artisan queue:restart

# Start Supervisor (last, as it runs queue workers etc.)
exec "$@"