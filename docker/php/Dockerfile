FROM php:8.3-fpm

# Install system packages and PHP extensions
RUN apt-get update && apt-get install -y \
    git curl unzip zip \
    libpq-dev libzip-dev libicu-dev libxml2-dev libonig-dev \
    supervisor \
    && docker-php-ext-install \
    pdo pdo_pgsql pdo_mysql zip bcmath intl mbstring xml exif \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && docker-php-source delete

RUN pecl install redis && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Step 1: Set working directory
WORKDIR /var/www

# Step 2: Copy only composer files first (for caching)
COPY composer.json composer.lock ./

# Step 3: Run composer install (safe fallback with || true)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress --ansi || true

# Step 4: Copy the entire app source code (artisan, config, etc.)
COPY . .

# Step 5: Re-run composer install properly now that artisan exists
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress --ansi

# Copy the entrypoint script
COPY docker/php/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

