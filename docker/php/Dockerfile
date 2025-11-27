###############################################
# Stage 1 — Build PHP Dependencies + Vite Build
###############################################
FROM php:8.4-fpm AS build

# System dependencies
RUN apt-get update && apt-get install -y \
    git curl unzip zip \
    libpq-dev libzip-dev libicu-dev libxml2-dev libonig-dev \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install \
    pdo pdo_pgsql pdo_mysql zip bcmath intl mbstring xml exif

# Install Redis extension
RUN git clone https://github.com/phpredis/phpredis.git /usr/src/php/ext/redis \
    && docker-php-ext-install redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Node.js 20 LTS + pnpm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

WORKDIR /var/www

# Copy full app
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --no-interaction --optimize-autoloader --prefer-dist

# Install JS dependencies with pnpm & build Vite assets
RUN pnpm install --frozen-lockfile
RUN pnpm run build

##########################################
# Stage 2 — Clean final production image
##########################################
FROM php:8.4-fpm AS production

WORKDIR /var/www

# Install minimal system dependencies for runtime
RUN apt-get update && apt-get install -y \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Copy built application from Stage 1
COPY --from=build /var/www /var/www

# Copy Supervisor, entrypoint, and custom PHP config
COPY docker/php/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/php/custom.ini /usr/local/etc/php/conf.d/custom.ini
RUN chmod +x /usr/local/bin/entrypoint.sh

# Enable OPcache (best performance for Laravel)
RUN docker-php-ext-enable opcache

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
