# Submission image for the fixed-service-request Laravel app.
# git is installed because the task harness resets the working tree to a base
# commit at runtime. The test suite uses in-memory SQLite (see phpunit.xml).
FROM php:8.4-cli-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git unzip libzip-dev libicu-dev libonig-dev libpq-dev libsqlite3-dev \
    && docker-php-ext-install -j"$(nproc)" \
        pdo pdo_sqlite pdo_pgsql zip bcmath intl mbstring \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

# Install PHP dependencies from the committed lockfile (no scripts: the app is
# not yet configured at this layer).
RUN composer install --no-interaction --prefer-dist --no-progress --no-scripts --optimize-autoloader

# Minimal testing environment so the app can boot and `php artisan test` runs.
RUN printf 'APP_NAME=fixed-service-request\nAPP_ENV=testing\nAPP_KEY=\nAPP_DEBUG=true\nLOG_CHANNEL=stderr\nDB_CONNECTION=sqlite\nDB_DATABASE=:memory:\n' > .env \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && php artisan key:generate --force
