# KHAT - PawLink

![Version](https://img.shields.io/badge/version-1.4.4-blue)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey)
![Framework](https://img.shields.io/badge/framework-React%20Native%20%7C%20Laravel-green)

**Current Version: 1.4.4** | [View Changelog](./CHANGELOG.md)

A pet breeding matchmaking platform built with React Native (Expo) and Laravel.

## Project Structure

```
KHAT/
├── PawLink/          # React Native mobile app (Expo)
└── backend/          # Laravel API server
```

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org/) |
| npm | v9+ | Comes with Node.js |
| PHP | v8.2+ | [php.net](https://www.php.net/downloads) |
| Composer | v2+ | [getcomposer.org](https://getcomposer.org/download/) |
| MySQL | v8+ | [mysql.com](https://dev.mysql.com/downloads/) |

### Mobile Development

| Tool | Purpose | Download |
|------|---------|----------|
| Expo Go | Run app on physical device | [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) / [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) |
| Android Studio | Android emulator (optional) | [developer.android.com](https://developer.android.com/studio) |
| Xcode | iOS simulator (macOS only) | Mac App Store |

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd KHAT
```

---

### 2. Backend Setup (Laravel)

#### 2.1 Install PHP Dependencies

```bash
cd backend
composer install
```

#### 2.2 Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

#### 2.3 Configure Database

1. Create a MySQL database:

```sql
CREATE DATABASE backend;
```

2. Update `.env` with your database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=backend
DB_USERNAME=root
DB_PASSWORD=your_password
```

#### 2.4 Run Migrations

```bash
php artisan migrate
```

#### 2.5 Start the Backend Server

```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

> **Note for Mobile Testing**: If testing on a physical device, you'll need to use your computer's local IP address instead of `localhost`. Find your IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

---

### 3. Mobile App Setup (Expo/React Native)

#### 3.1 Install Node Dependencies

```bash
cd PawLink
npm install
```

#### 3.2 Start the Development Server

```bash
npx expo start
```

This will display a QR code in your terminal.

#### 3.3 Run on Device/Emulator

**Option A: Physical Device (Recommended)**
1. Install **Expo Go** on your mobile device
2. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

**Option B: Android Emulator**
1. Open Android Studio
2. Start an Android Virtual Device (AVD)
3. Press `a` in the Expo terminal

**Option C: iOS Simulator (macOS only)**
1. Install Xcode from the Mac App Store
2. Press `i` in the Expo terminal

---

## NPM Scripts (Mobile App)

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run in web browser |
| `npm run lint` | Run ESLint |

---

## Composer Scripts (Backend)

| Command | Description |
|---------|-------------|
| `composer setup` | Full setup (install, migrate, build) |
| `composer dev` | Start dev server with queue and Vite |
| `composer test` | Run tests |

---

## Key Dependencies

### Mobile App (PawLink)

| Package | Purpose |
|---------|---------|
| `expo` ~54.0 | Development framework |
| `expo-router` | File-based routing |
| `react-native` 0.81 | Mobile UI framework |
| `nativewind` | Tailwind CSS for React Native |
| `axios` | HTTP client for API calls |
| `expo-secure-store` | Secure storage for tokens |
| `expo-image-picker` | Image selection |
| `react-native-reanimated` | Animations |
| `lucide-react-native` | Icons |

### Backend

| Package | Purpose |
|---------|---------|
| `laravel/framework` ^12.0 | PHP framework |
| `laravel/sanctum` ^4.0 | API authentication |
| `laravel/breeze` | Auth scaffolding (dev) |

---

## Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_KEY` | Application encryption key | Auto-generated |
| `DB_DATABASE` | Database name | `backend` |
| `DB_USERNAME` | Database user | `root` |
| `DB_PASSWORD` | Database password | `your_password` |
| `PAYMONGO_PUBLIC_KEY` | PayMongo public key | `pk_test_...` |
| `PAYMONGO_SECRET_KEY` | PayMongo secret key | `sk_test_...` |

---

## Connecting Mobile App to Backend

By default, the mobile app expects the backend at `http://localhost:8000`. For physical device testing:

1. Find your computer's local IP address:
   - Windows: `ipconfig` → Look for IPv4 Address
   - Mac/Linux: `ifconfig` or `ip addr`

2. Update the API base URL in the mobile app configuration to use your IP (e.g., `http://192.168.1.100:8000`)

3. Ensure your phone and computer are on the same WiFi network

---

## Troubleshooting

### Expo Go Connection Issues

- Ensure your phone and computer are on the same network
- Try switching from LAN to Tunnel mode: `npx expo start --tunnel`
- Disable VPN if active

### Backend CORS Issues

- Verify CORS configuration in `backend/config/cors.php`
- Add your mobile device's IP to allowed origins

### Database Connection Failed

- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists

### Metro Bundler Errors

```bash
# Clear cache and restart
npx expo start --clear
```

---

## Development Workflow

1. Start the backend server: `cd backend && php artisan serve`
2. Start the mobile app: `cd PawLink && npx expo start`
3. Open Expo Go on your device and scan the QR code
4. Make changes - the app will hot reload automatically

---

## Team

**KHAT Development Team**

---

## License

This project is proprietary software.
