FROM php:8.4-fpm

# Install system packages and PHP extensions
RUN apt-get update && apt-get install -y \
    git curl unzip zip \
    libpq-dev libzip-dev libicu-dev libxml2-dev libonig-dev \
    supervisor \
    && docker-php-ext-install \
        pdo pdo_pgsql pdo_mysql zip bcmath intl mbstring xml exif \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Redis extension from Git (PECL has no PHP 8.4 support yet)
RUN git clone https://github.com/phpredis/phpredis.git /usr/src/php/ext/redis \
    && docker-php-ext-install redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Supervisor config & entrypoint
COPY docker/php/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]