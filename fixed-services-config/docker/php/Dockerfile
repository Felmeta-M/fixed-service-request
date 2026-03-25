# syntax=docker/dockerfile:1.6
# BuildKit: export DOCKER_BUILDKIT=1 (default in recent Docker). Cache mounts speed repeat builds.
FROM php:8.4-fpm

# Install system packages and PHP extensions
RUN apt-get update && apt-get install -y \
    git curl unzip zip rsync \
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

WORKDIR /var/www

# Laravel dirs required before composer scripts see the tree
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views \
    storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# --- Composer: lockfiles only (cache hit when PHP deps unchanged)
COPY composer.json composer.lock ./
RUN --mount=type=cache,target=/root/.composer/cache \
    composer install --no-dev --no-interaction --prefer-dist --no-progress --no-scripts --ansi

# --- JS: manifest + lock only (cache hit when node deps unchanged — avoids full install on every PHP edit)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Application source (invalidates only layers below)
COPY . .

RUN --mount=type=cache,target=/root/.composer/cache \
    composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress --ansi

ARG VITE_APP_NAME="Fixed services provision system"
ARG VITE_API_BASE_URL=https://fixedservices.ethiotelecom.et/api/v1
ARG VITE_API_PUBLIC_URL=https://fixedservices.ethiotelecom.et/api/v1
ARG VITE_TURNSTILE_SITE_KEY=""
ENV VITE_APP_NAME="${VITE_APP_NAME}" \
    VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
    VITE_API_PUBLIC_URL="${VITE_API_PUBLIC_URL}" \
    VITE_TURNSTILE_SITE_KEY="${VITE_TURNSTILE_SITE_KEY}"

# node_modules already populated; only rebuild when app or Vite env changes
RUN VITE_APP_NAME="${VITE_APP_NAME}" \
    VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
    VITE_API_PUBLIC_URL="${VITE_API_PUBLIC_URL}" \
    VITE_TURNSTILE_SITE_KEY="${VITE_TURNSTILE_SITE_KEY}" \
    pnpm run build \
    && echo "✅ Frontend build complete: $(ls -la public/build/assets/*.css 2>/dev/null | wc -l) CSS, $(ls -la public/build/assets/*.js 2>/dev/null | wc -l) JS files"

RUN test -d /var/www/public/build/assets || (echo "❌ Frontend build failed - no assets!" && exit 1)

# No chown on node_modules/public/build: recursive chown is very slow; default root:root 0755/0644 is readable by PHP-FPM (www-data).

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/local/sbin/php-fpm", "-F"]
