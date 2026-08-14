FROM php:8.3-fpm-alpine

# Install official PHP extension installer helper
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

# Install essential system dependencies
RUN apk add --no-cache git curl zip unzip supervisor

# Install required PHP extensions (including Redis & PostgreSQL) seamlessly
RUN install-php-extensions pdo_pgsql pgsql mbstring xml bcmath pcntl redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . .

# Set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache 2>/dev/null || true

EXPOSE 9000

CMD ["php-fpm"]
