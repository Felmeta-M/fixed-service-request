FROM php:8.4-fpm

# Install system packages and PHP extensions
RUN apt-get update && apt-get install -y \
    git curl unzip zip \
    libpq-dev libzip-dev libicu-dev libxml2-dev libonig-dev \
    supervisor \
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

# Copy only composer files first for caching
COPY composer.json composer.lock ./

RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress --ansi || true

# Copy entire source
COPY . .

# Run composer install now that all files exist
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress --ansi

# Copy entrypoint & supervisor config
COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/php/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

RUN chmod +x /usr/local/bin/entrypoint.sh

# Entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Start supervisord
CMD ["supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]
