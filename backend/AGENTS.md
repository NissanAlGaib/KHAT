# PAWLINK BACKEND

Laravel 12 REST API with Sanctum auth, MySQL, DigitalOcean Spaces (S3-compatible).

## STRUCTURE

```
backend/
├── app/
│   ├── Http/Controllers/       # 22 controllers (REST + Admin)
│   │   ├── Admin/              # AdminController (Blade views)
│   │   └── Auth/               # LoginController, RegisterController, etc.
│   ├── Http/Middleware/        # CheckShooterRole (custom role guard)
│   ├── Http/Requests/Auth/     # Form request validation
│   ├── Models/                 # 22 Eloquent models
│   ├── Services/               # PayMongoService (payment gateway)
│   ├── Console/Commands/       # SyncShooterToConversations
│   └── Providers/              # AppServiceProvider
├── config/
│   ├── matching.php            # Matchmaking algorithm parameters
│   ├── subscription.php        # Plan tiers and limits
│   └── filesystems.php         # do_spaces disk config
├── database/migrations/        # 39 migration files
├── routes/
│   ├── api.php                 # All REST endpoints (auth:sanctum guarded)
│   └── auth.php                # Auth routes
├── .do/app.yaml                # DigitalOcean App Platform deploy spec
└── Dockerfile                  # PHP 8.2 + Apache container
```

## KEY MODELS & RELATIONSHIPS

| Model | Key Relations |
|-------|---------------|
| `User` | hasMany: Pet, MatchRequest, Conversation; hasOne: UserAuth |
| `Pet` | belongsTo: User; hasMany: PetPhoto, VaccinationCard, HealthRecord |
| `MatchRequest` | belongsTo: Pet (requester + target) |
| `BreedingContract` | belongsTo: MatchRequest; hasMany: DailyReport |
| `Litter` | belongsTo: BreedingContract; hasMany: LitterOffspring |
| `VaccinationCard` | belongsTo: Pet; hasMany: VaccinationShot |
| `Conversation` | belongsTo: MatchRequest; hasMany: Message |

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `routes/api.php` + new/existing controller | Group under `auth:sanctum` |
| Add database table | `database/migrations/` | `php artisan make:migration` |
| File upload logic | Controller using `Storage::disk('do_spaces')` | MUST use `do_spaces` disk |
| Match algorithm | `MatchController` + `config/matching.php` | Config-driven parameters |
| Payment flow | `PaymentController` + `PayMongoService` | PayMongo gateway |
| Admin panel | `Admin/AdminController` + `resources/views/admin/` | Blade templates |
| User verification | `VerificationController` | ID, breeder license, shooter cert |
| Safety features | `SafetyController` | Block/report users |

## CONVENTIONS

- Controllers are resource-style where possible
- Auth middleware: `auth:sanctum` for all protected routes
- Role checks: `CheckShooterRole` middleware for shooter-only endpoints
- File storage: ALWAYS `Storage::disk('do_spaces')->put(...)` for uploads
- URL generation: `Storage::disk('do_spaces')->url($path)` for serving files
- Validation: Inline in controllers (no separate FormRequest for most endpoints)
- Tests: Pest PHP framework (`tests/Feature/`, `tests/Unit/`)

## ANTI-PATTERNS

- **NEVER** use `Storage::disk('public')` for production uploads - always `do_spaces`
- **NEVER** store absolute URLs in database - store relative paths, construct URL at serve time
- Payment/subscription requirement is TEMPORARILY DISABLED in `MatchRequestController::store()` - re-enable before production launch
- `User::userAuth()` is the correct relationship name (not `authentications()`)

## COMMANDS

```bash
php artisan serve                    # Local dev
php artisan migrate --force          # Run migrations (production)
php artisan config:cache             # Cache config
php artisan route:cache              # Cache routes
php artisan test                     # Run Pest tests
php artisan make:model Name -m       # New model + migration
php artisan make:controller NameController  # New controller
```

## ENVIRONMENT

Production env vars defined in `.do/app.yaml`. Key ones:
- `FILESYSTEM_DISK=do_spaces` (not `s3`)
- `DB_PORT=25060` (DO Managed MySQL)
- `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_REGION=sgp1`, `DO_SPACES_BUCKET=pawlink-storage`
- `PAYMONGO_PUBLIC_KEY`, `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`
