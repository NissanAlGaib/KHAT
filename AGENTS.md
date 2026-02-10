# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-10
**Commit:** 2380005
**Branch:** Testing

## OVERVIEW

PawLink - Pet breeding matchmaking platform. React Native (Expo 54) mobile app + Laravel 12 REST API backend. Deployed on DigitalOcean App Platform (backend) and EAS (mobile builds).

## STRUCTURE

```
KHAT/
├── PawLink/          # React Native mobile app (Expo Router, NativeWind)
│   ├── app/          # File-based routing screens
│   ├── components/   # Domain-organized UI components
│   ├── services/     # API service layer (axios)
│   ├── context/      # React Context providers (Auth, Pet, Role, Notification)
│   ├── hooks/        # Custom hooks
│   ├── config/       # axiosConfig.ts, env.ts
│   ├── constants/    # colors.ts, theme.ts
│   ├── types/        # TypeScript domain models
│   └── utils/        # imageUrl.ts, formDataUtils.ts, apiError.ts
├── backend/          # Laravel 12 API server
│   ├── app/          # Controllers, Models, Services, Middleware
│   ├── config/       # matching.php, subscription.php, filesystems.php
│   ├── database/     # 39 migrations, seeders, factories
│   ├── routes/       # api.php (REST endpoints)
│   └── .do/          # DigitalOcean App Platform spec (app.yaml)
├── docs/             # Deployment guide
└── CHANGELOG.md      # Version history (current: 1.4.3)
```

## DEPLOYMENT & INFRASTRUCTURE

| Component | Service | Details |
|-----------|---------|---------|
| Backend API | DigitalOcean App Platform | Dockerized PHP 8.2 + Apache, basic-xxs instance |
| Database | DO Managed MySQL 8 | Port 25060, region sgp1 |
| File Storage | DO Spaces (S3-compatible) | Bucket: `pawlink-storage`, region: sgp1 |
| Mobile Builds | EAS (Expo Application Services) | Android APK, OTA updates via expo-updates |

- **Spaces URL**: `https://pawlink-storage.sgp1.digitaloceanspaces.com`
- **Filesystem disk**: `do_spaces` (NOT `s3` or `public`) - all uploads go to DO Spaces in production
- **App package**: `com.khat.pawlink`
- **EAS project ID**: `7e943f80-fb61-42eb-a1bb-1a8043d09381`

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| API base URL | `PawLink/config/env.ts` | Change for local dev (use machine IP) |
| Axios setup + auth token | `PawLink/config/axiosConfig.ts` | Token from SecureStore `"authToken"` |
| Image URLs from DB paths | `PawLink/utils/imageUrl.ts` | `getStorageUrl()` - prepends STORAGE_URL |
| File uploads (backend) | Various controllers | MUST use `do_spaces` disk, not `public` |
| Matching algorithm config | `backend/config/matching.php` | Tunable parameters |
| Subscription tiers | `backend/config/subscription.php` | Plan definitions |
| DO deployment spec | `backend/.do/app.yaml` | Env vars, instance config |
| Payment integration | `backend/app/Services/PayMongoService.php` | PayMongo gateway |
| Route definitions | `backend/routes/api.php` | All API endpoints |
| OTA update hook | `PawLink/hooks/useUpdateChecker.ts` | expo-updates integration |

## CONVENTIONS

- **Frontend naming**: PascalCase components/screens, camelCase services/hooks/utils
- **Backend naming**: PascalCase classes (singular), snake_case tables (plural), kebab-case URLs
- **Service pattern**: One service file per domain (e.g., `petService.ts`, `userService.ts`)
- **Context providers**: Wrap app in `_layout.tsx` - Auth, Pet, Role, Notification
- **Component organization**: Domain folders with `index.ts` barrel exports
- **Route groups**: `(auth)`, `(tabs)`, `(verification)`, `(chat)`, `(breeder)`, `(shooter)`, `(pet)`
- **Form data**: Use `formDataUtils.ts` for multipart/form-data (image uploads)
- **Auth flow**: Sanctum token-based, stored in SecureStore, attached via axios interceptor

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** use `public` disk for file storage - always `do_spaces`
- **NEVER** construct image URLs manually - use `getStorageUrl()` from `utils/imageUrl.ts`
- **NEVER** hardcode `localhost` for API URL - use `config/env.ts`
- **NEVER** add trailing slash to `API_BASE_URL` (causes double-slash bugs)
- Payment/subscription checks temporarily disabled in `MatchRequestController` for testing - re-enable before production

## COMMANDS

```bash
# Frontend (from PawLink/)
npx expo start              # Dev server
npx expo start --clear      # Clear cache + start
eas build --platform android --profile preview  # Build APK
eas update --branch preview  # Push OTA update

# Backend (from backend/)
php artisan serve            # Local dev server
php artisan migrate --force  # Run migrations
php artisan config:cache     # Cache config (production)
composer test                # Run Pest tests

# Deployment
# Backend auto-deploys on push to main via DO App Platform
# Mobile: eas build + eas update for OTA
```

## NOTES

- DO Managed MySQL uses port `25060` (not standard 3306)
- Spaces region `sgp1` (Singapore) chosen for proximity to Philippines users
- New Architecture (Fabric) enabled - be careful with animation libraries
- `react-native-reanimated` v4.2.1 required (earlier versions crash in production builds)
- Background white color must be set on all Stack/Tab navigators to prevent black screen flash
