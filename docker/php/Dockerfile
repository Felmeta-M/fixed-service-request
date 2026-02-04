FROM php:8.4-fpm

# Install system packages and PHP extensions
RUN apt-get update && apt-get install -y \
    git curl unzip zip \
    libpq-dev libzip-dev libicu-dev libxml2-dev libonig-dev \
    && docker-php-ext-install \
    pdo pdo_pgsql zip bcmath intl mbstring xml \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && docker-php-source delete

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Node.js 20 + PNPM
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Working directory
WORKDIR /var/www

# Create Laravel storage directories required for artisan commands during composer install
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views \
    storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Copy only composer files first for caching
COPY composer.json composer.lock ./

RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress --ansi || true

# Copy entire source
COPY . .

# Run composer install now that all files exist
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress --ansi

# Build frontend assets (Vite + React)
RUN pnpm install --frozen-lockfile && pnpm run build

# Copy entrypoint & PHP-FPM config
COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

RUN chmod +x /usr/local/bin/entrypoint.sh

# Entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Run PHP-FPM in foreground (app service); queue/scheduler override CMD in compose
CMD ["/usr/local/sbin/php-fpm", "-F"]
