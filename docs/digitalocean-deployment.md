# DigitalOcean App Platform Deployment Guide

This guide covers deploying the PawLink Laravel backend (including admin pages) to DigitalOcean App Platform with Managed MySQL and Spaces for file storage.

## Architecture Overview

| Component | DigitalOcean Service | Purpose |
|-----------|---------------------|---------|
| Laravel Backend + Admin | App Platform | API + Blade admin pages |
| Database | Managed MySQL | Production database |
| File Storage | Spaces | Pet images, documents (S3-compatible) |

## Estimated Monthly Cost

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| App Platform | Basic | $12 |
| Managed MySQL | Basic | $15 |
| Spaces | 250GB included | $5 |
| **Total** | | **~$32/mo** |

---

## Step 1: Create DigitalOcean Spaces (File Storage)

1. Go to **DigitalOcean Console** → **Spaces Object Storage** → **Create Space**
2. Choose region: `sgp1` (Singapore - closest to Philippines)
3. **CDN**: Optional - skip for dev, enable for production
4. **Name**: `pawlink-storage`
5. **Settings**: File Listing → Restricted

After creation, note down:
- **Space name**: `pawlink-storage`
- **Region**: `sgp1`
- **Endpoint**: `sgp1.digitaloceanspaces.com`
- **URL**: `https://pawlink-storage.sgp1.digitaloceanspaces.com`

### Generate Spaces Access Keys

1. Go to **API** → **Spaces Keys** → **Generate New Key**
2. Name it: `pawlink-app`
3. Save securely:
   - **Access Key**: (save this)
   - **Secret Key**: (save this - shown only once!)

---

## Step 2: Create Managed MySQL Database

1. Go to **Databases** → **Create Database Cluster**
2. Configuration:
   - **Engine**: MySQL 8
   - **Plan**: Basic ($15/mo)
   - **Region**: `sgp1` (same as Spaces)
   - **Name**: `pawlink-db`

3. After creation (takes ~5 minutes), go to **Connection Details** and note:
   - **Host**: `xxx.db.ondigitalocean.com`
   - **Port**: `25060`
   - **Username**: `doadmin`
   - **Password**: (shown once, save it!)
   - **Database**: `defaultdb` (or create `pawlink`)

### Create Application Database

1. Go to **Users & Databases** tab
2. Create new database: `pawlink`

### Configure Trusted Sources (Security)

1. Go to **Settings** → **Trusted Sources**
2. Add your App Platform app (after creating it)

---

## Step 3: Prepare Laravel Application

### 3.1 Create Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    nodejs \
    npm

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader
RUN npm install && npm run build

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Configure Apache document root
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

EXPOSE 80

CMD ["apache2-foreground"]
```

### 3.2 Create App Platform Spec

Create `backend/.do/app.yaml`:

```yaml
name: pawlink-backend
services:
  - name: api
    dockerfile_path: Dockerfile
    source_dir: /
    http_port: 80
    instance_size_slug: basic-xxs
    instance_count: 1
    routes:
      - path: /
    envs:
      - key: APP_NAME
        value: PawLink
      - key: APP_ENV
        value: production
      - key: APP_DEBUG
        value: "false"
      - key: APP_KEY
        type: SECRET
      - key: APP_URL
        value: ${APP_URL}
      - key: DB_CONNECTION
        value: mysql
      - key: DB_HOST
        type: SECRET
      - key: DB_PORT
        value: "25060"
      - key: DB_DATABASE
        type: SECRET
      - key: DB_USERNAME
        type: SECRET
      - key: DB_PASSWORD
        type: SECRET
      - key: SESSION_DRIVER
        value: database
      - key: CACHE_STORE
        value: database
      - key: QUEUE_CONNECTION
        value: database
      - key: FILESYSTEM_DISK
        value: s3
      - key: AWS_ACCESS_KEY_ID
        type: SECRET
      - key: AWS_SECRET_ACCESS_KEY
        type: SECRET
      - key: AWS_DEFAULT_REGION
        value: sgp1
      - key: AWS_BUCKET
        value: pawlink-storage
      - key: AWS_ENDPOINT
        value: https://sgp1.digitaloceanspaces.com
      - key: AWS_URL
        value: https://pawlink-storage.sgp1.digitaloceanspaces.com
      - key: PAYMONGO_PUBLIC_KEY
        type: SECRET
      - key: PAYMONGO_SECRET_KEY
        type: SECRET
      - key: PAYMONGO_WEBHOOK_SECRET
        type: SECRET
      - key: PAYMONGO_VERIFY_SSL
        value: "true"
```

### 3.3 Update Filesystems Config (Optional)

If you want a dedicated disk config, add to `backend/config/filesystems.php` in the `disks` array:

```php
'do_spaces' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION'),
    'bucket' => env('AWS_BUCKET'),
    'url' => env('AWS_URL'),
    'endpoint' => env('AWS_ENDPOINT'),
    'use_path_style_endpoint' => false,
    'visibility' => 'public',
    'throw' => false,
],
```

> **Note**: The existing `s3` disk config already works with DigitalOcean Spaces since it's S3-compatible.

### 3.4 Create .dockerignore

Create `backend/.dockerignore`:

```
.git
.gitignore
.env
.env.example
node_modules
vendor
storage/logs/*
storage/framework/cache/*
storage/framework/sessions/*
storage/framework/views/*
tests
phpunit.xml
.editorconfig
README.md
```

---

## Step 4: Deploy to App Platform

### 4.1 Push Changes to GitHub

```bash
cd backend
git add .
git commit -m "Add DigitalOcean App Platform deployment config"
git push origin main
```

### 4.2 Create App in DigitalOcean

1. Go to **App Platform** → **Create App**
2. Connect your **GitHub** account
3. Select your repository
4. **Source Directory**: `/backend`
5. It will auto-detect the Dockerfile
6. Click **Edit Plan** → Select **Basic** ($12/mo)

### 4.3 Configure Environment Variables

Add these environment variables in the App Platform settings:

| Variable | Value | Type |
|----------|-------|------|
| `APP_KEY` | (generate with `php artisan key:generate --show`) | Secret |
| `APP_URL` | `https://your-app.ondigitalocean.app` | Plain |
| `DB_HOST` | (from Managed MySQL connection details) | Secret |
| `DB_DATABASE` | `pawlink` | Secret |
| `DB_USERNAME` | `doadmin` | Secret |
| `DB_PASSWORD` | (from Managed MySQL) | Secret |
| `AWS_ACCESS_KEY_ID` | (from Spaces Keys) | Secret |
| `AWS_SECRET_ACCESS_KEY` | (from Spaces Keys) | Secret |
| `PAYMONGO_PUBLIC_KEY` | `pk_live_...` (your live key) | Secret |
| `PAYMONGO_SECRET_KEY` | `sk_live_...` (your live key) | Secret |
| `PAYMONGO_WEBHOOK_SECRET` | (from PayMongo dashboard) | Secret |

### 4.4 Deploy

Click **Create Resources** and wait for deployment (~5-10 minutes).

---

## Step 5: Post-Deployment Setup

### 5.1 Run Migrations

1. Go to your app in App Platform
2. Click **Console** tab
3. Run:

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 5.2 Add Database Trusted Source

1. Go to **Databases** → your database → **Settings**
2. Under **Trusted Sources**, add your App Platform app

### 5.3 Configure Custom Domain (Optional)

1. Go to **App Platform** → your app → **Settings** → **Domains**
2. Add your custom domain (e.g., `api.pawlink.com`)
3. Update DNS records as instructed
4. SSL is automatically provisioned

---

## Step 6: Update Mobile App

Update the API base URL in your React Native app to point to your new production URL:

```typescript
// Change from localhost to production URL
const API_URL = 'https://your-app.ondigitalocean.app';
// or with custom domain
const API_URL = 'https://api.pawlink.com';
```

---

## Maintenance Commands

### View Logs

```bash
# In App Platform Console
php artisan pail
# or check Logs tab in App Platform
```

### Clear Caches

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Run Queue Worker

For background jobs, add a **Worker** component in App Platform:

1. Go to app settings → **Add Component** → **Worker**
2. Run command: `php artisan queue:work --tries=3`

---

## Troubleshooting

### Database Connection Failed

- Verify database credentials in environment variables
- Check if App Platform is in Trusted Sources for the database
- Ensure `DB_PORT` is `25060` (DigitalOcean managed MySQL port)

### File Upload Not Working

- Verify Spaces credentials (Access Key, Secret Key)
- Check `FILESYSTEM_DISK=s3` is set
- Ensure `AWS_ENDPOINT` includes `https://`

### 502 Bad Gateway

- Check app logs for PHP errors
- Verify `APP_KEY` is set correctly
- Run `php artisan config:cache` in console

### Admin Login Not Working

- Run `php artisan migrate --force` to ensure sessions table exists
- Check `SESSION_DRIVER=database` is set

---

## Security Checklist

- [ ] `APP_DEBUG=false` in production
- [ ] `PAYMONGO_VERIFY_SSL=true` in production
- [ ] Use live PayMongo keys (not test keys)
- [ ] Database has Trusted Sources configured
- [ ] Spaces bucket is not publicly listable
- [ ] All secrets use `type: SECRET` in app.yaml
