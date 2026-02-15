# Changelog

All notable changes to the PawLink project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---
## [1.4.7] - 2026-02-16

### Admin Data Export (CSV/PDF)

#### New: Data Export System
- **Admin Pages**: Added **CSV** and **PDF** export buttons to all data-rich admin management pages:
  - User Management
  - Admin Management
  - Pet Management
  - Match History
  - Safety Reports & Blocked Users
  - Audit Logs
  - Subscription Tiers
  - Protocol Categories
  - Vaccine Protocols
- **Functionality**: Exports match current active filters (status, search, dates, etc.) and include all matching records (ignoring pagination).
- **PDF Generation**: Implemented professional PDF reports using `dompdf` with consistent layout, branding, and generation metadata.
- **CSV Streaming**: Implemented memory-efficient CSV streaming for large datasets.

#### Backend Architecture
- **New Trait**: `Exportable.php` — Reusable trait for controllers to handle CSV streaming and PDF generation logic centrally.
- **New Views**: `admin/exports/` — Dedicated Blade templates for PDF reports (`layout.blade.php`, `users-pdf.blade.php`, `pets-pdf.blade.php`, etc.).
- **Controllers**: Updated 9 admin controllers (`AdminController`, `SubscriptionTierController`, etc.) to support `?export=csv` and `?export=pdf` query parameters.
- **Dependency**: Added `barryvdh/laravel-dompdf` package for PDF generation.

### Administrative Controls & Configuration

#### New: Subscription Management
- **New Page**: `subscription-tiers/index.blade.php` — manage subscription plans and limits
- **Features**: Configure price, duration, max pets, max matches, and AI generation limits per tier
- **Models**: Created `SubscriptionTier` model and migration
- **Controller**: `SubscriptionTierController` for full CRUD operations

#### New: Protocol Categories
- **New Page**: `protocol-categories/index.blade.php` — organize vaccine protocols
- **Features**: Create/Edit/Delete categories for better protocol organization
- **Models**: Created `ProtocolCategory` model and migration
- **Controller**: `ProtocolCategoryController` for management

#### New: Multi-Admin Management
- **New Feature**: Ability to invite/add new admin users directly from the Admin Panel
- **Page Update**: `admin/admins/index.blade.php` — added "Add New Admin" modal and listing

### User Safety & Auditing

#### New: User Suspension System
- **Database**: Added `is_suspended` and `suspension_end_date` columns to `users` and `pets` tables
- **Logic**: Implemented `CheckUserStatus` logic (in `LoginRequest`) to block suspended/banned users with 403 Forbidden
- **Admin UI**: Added "Suspend User" and "Ban User" actions in User Management with duration selector (7 days, 30 days, Permanent)
- **Pet Suspension**: Suspending a user automatically suspends their pets (hiding them from matchmaking)

#### New: Audit Logging
- **New System**: Comprehensive audit logging for all admin actions
- **New Page**: `admin/audit-logs.blade.php` — searchable log of who did what and when
- **Model**: `AuditLog` model with `log()` helper
- **Tracking**: Logs creations, updates, deletions, and verification actions (e.g., "Admin X approved vaccine Y for Pet Z")

---
## [1.4.6] - 2026-02-11

### AI Breed Identification, Admin Safety Management & Vaccination UX

#### New: Pet Breed Identification AI
- **New Python Service**: `breed-api/` — FastAPI server with TensorFlow/Keras model for breed classification (55 breeds across dogs and cats)
- **New Controller**: `BreedIdentifierController.php` — Laravel proxy endpoint to the Python AI service
- **New Service**: Updated `breedService.ts` — replaced placeholder stub with real AI integration (`identifyBreedFromImage()`, `checkBreedServiceHealth()`)
- **Model Training**: `PawLinkPetBreedClassifier.py` — training script for the `.h5` classifier model
- **Add Pet Screen**: AI "Identify Breed" button in `add-pet.tsx` — opens image picker, shows top-3 breed predictions with confidence percentages in a modal
- Breed lists (`DOG_BREEDS`, `CAT_BREEDS`) moved from `add-pet.tsx` to centralized `breedService.ts`
- **New API Routes**: `POST /api/breed-identify`, `GET /api/breed-identify/health`

#### New: Admin Reports & Safety Management
- **New Page**: `reports.blade.php` — full reports management with search, filters (status, reason, date range), stats cards (total/pending/resolved/dismissed), and detail modal with reported user history
- **New Page**: `blocks.blade.php` — user blocks management with admin force-unblock capability
- **Removed**: `tickets.blade.php` (replaced by reports system)
- **New Migration**: `add_resolution_action_to_safety_reports_table` — adds resolution action tracking (warning, temporary ban, permanent ban, content removal)
- **New Config**: `backend/config/safety.php` — safety system configuration
- **SafetyReport Model**: Added resolution action constants (`ACTION_WARNING`, `ACTION_TEMPORARY_BAN`, `ACTION_PERMANENT_BAN`, `ACTION_CONTENT_REMOVAL`), status constants, `getReasonLabel()` helper, `reportsAgainst` relationship on User model
- **AdminController**: Added `reports()`, `getReportDetails()`, `reviewReport()`, `blocks()`, `forceUnblock()` methods
- **Dashboard**: Added pending reports count stat card
- **User Management**: Added report count badge per user (`withCount('reportsAgainst')`)
- **Admin Web Routes**: Added `/reports`, `/reports/{id}/details`, `/reports/{id}/review`, `/blocks`, `/blocks/{id}` (DELETE)

#### New: In-App Warning Notifications
- **NotificationController**: Users now receive in-app warning notifications when admin resolves a safety report with `ACTION_WARNING`
- **notifications.tsx**: Added warning notification card rendering with distinct styling
- **notificationService.ts**: Updated to handle `admin_warning` notification type
- **NotificationContext**: Notification count now includes warning count alongside rejected documents

#### Changed: Vaccination UX Improvements
- **New Component**: `AddVaccineSheet.tsx` — bottom sheet (via `@gorhom/bottom-sheet`) replacing the inline opt-in modal for adding optional vaccines; includes search/filter, swipe-to-dismiss, polished protocol cards
- **New Feature**: Protocol change — users can now switch a vaccination card's protocol via `changeProtocol()` endpoint
- **vaccinations.tsx**: Refactored — extracted opt-in UI to `AddVaccineSheet`, added edit protocol modal
- **VaccinationCard.tsx**: Added edit protocol button
- **VaccinationController**: Added `changeProtocol()` method
- **New API Route**: `POST /api/pets/{petId}/vaccination-cards/{cardId}/change-protocol`

#### Changed: Admin Panel Enhancements
- **Vaccine Protocol Management**: Replaced separate create page with inline modal in `index.blade.php`; added edit modal; removed `/vaccine-protocols/create` route
- **Sidebar**: Reorganized into logical groups with collapsible section headers
- **Users Page** (`users/index.blade.php`): Redesigned layout and table structure
- **Pets Page** (`pets/index.blade.php`): UI fixes and improvements

#### Backend
- **CORS**: Added CORS middleware configuration in `bootstrap/app.php`
- **VaccineProtocol Model**: Minor updates for protocol management

#### Dependencies
- Added `@gorhom/bottom-sheet` for vaccine opt-in bottom sheet

---
## [1.4.5] - 2026-02-11

### Admin Panel Bugfixes & Design Consistency

#### Bug Fixes
- **`pets/index.blade.php`**: Wired `confirmSuspend()` and `confirmDelete()` to actual backend routes — previously stubs with `console.log` only
- **`users/index.blade.php`**: Document Status column now checks actual `userAuth` expiry dates — was hardcoded to always show "Valid"
- **`users/index.blade.php`**: Fixed SweetAlert icon ternary (`status === 'approve'` → `status === 'approved'`)
- **`pets/show.blade.php`**: Breed chart labels now show actual breed name instead of "Litter 1", "Litter 2"
- **`dashboard.blade.php`**: Moved Chart.js `<script>` from `@push('styles')` to `@push('scripts')`

#### Design Consistency
- Added subtitle `<p>` tags to Pet Management, Profile Settings, and Notifications pages (matching Dashboard/Users/Analytics pattern)
- Standardized all table header `<th>` font-weights to `font-semibold` across pets/index and pets/show
- Added filter section header with icon to pets/index (matching Users page pattern)

#### Backend
- **`AdminController::usersIndex()`**: Implemented `doc_status` filter (valid/expired/missing) using actual `userAuth` expiry dates — HTML filter existed but was ignored by backend
- **`AdminController::usersIndex()`**: Added `userAuth` eager-loading to prevent N+1 queries on Document Status column

---
## [1.4.4] - 2026-02-10

### Vaccination Management Overhaul

Complete rework of the vaccination system from "user creates vaccines" to "admin controls vaccine protocols, user uploads proof, admin approves/rejects."

#### New: Admin-Managed Vaccine Protocols
- **New Table**: `vaccine_protocols` — admin-defined vaccines with name, species, series doses, intervals, booster config
- **New Model**: `VaccineProtocol.php` — scopes (`active`, `forSpecies`, `required`, `optional`), protocol type detection (`series_only`, `series_with_booster`, `recurring`)
- **New Controller**: `VaccineProtocolController.php` — full CRUD + shot verification (approve/reject with audit logging)
- **Seeded Protocols**: Parvo (3-dose + annual booster), Distemper (3-dose + annual booster), Rabies (annual), Leptospirosis (annual) for dogs; FVRCP (3-dose + annual booster), FeLV (2-dose) for cats

#### New: Admin Blade Views
- **Protocol Management**: `index.blade.php` — list with stats cards, species/status/active filters, pagination
- **Create/Edit Forms**: `create.blade.php`, `edit.blade.php` — protocol type radio buttons (Series Only, Series + Booster, Recurring) with dynamic field toggling
- **Shot Verification Queue**: `pending-shots.blade.php` — pending shots with pet/owner info, proof document viewer, approve/reject with SweetAlert2 rejection reason modal
- **Sidebar**: Added "Vaccine Protocols" and "Shot Verification" links to admin layout

#### New: Admin Web Routes
- `GET/POST /admin/vaccine-protocols` — list and create protocols
- `GET /admin/vaccine-protocols/create` — create form
- `GET /admin/vaccine-protocols/{id}/edit` — edit form
- `PUT /admin/vaccine-protocols/{id}` — update protocol
- `PATCH /admin/vaccine-protocols/{id}/toggle` — activate/deactivate
- `GET /admin/vaccination-shots/pending` — verification queue
- `POST /admin/vaccination-shots/{shotId}/approve` — approve shot
- `POST /admin/vaccination-shots/{shotId}/reject` — reject shot with reason

#### Changed: Approval-Based Shot Workflow
- Shots now start as `verification_status: 'pending'` — only admin-approved shots count toward completion
- **New display statuses**: `pending_approval`, `approved`, `rejected`, `historical`
- Progress percentage, series completion, and card status all based on **approved shots only**
- Concurrent uploads allowed — users can upload Dose 2 while Dose 1 is still pending review

#### Changed: Backend Models
- **VaccinationCard**: Added `protocol()` relationship, `approvedShots()`, `pendingShots()`, `historicalShots()` relations; `createRequiredCardsForPet()` now queries `vaccine_protocols` table; removed hardcoded `REQUIRED_VACCINES` constant; removed `createCustomCard()` method
- **VaccinationShot**: Added `is_booster`, `verification_status`, `rejection_reason` fields; `createForCard()` sets status to `pending`; added `createHistoricalShot()` for pre-app records
- **AdminController**: Added `vaccinationCards.protocol` and `vaccinationCards.shots` eager loading in `petDetails()`
- **PetController**: Updated vaccination card response to include `approved_shots_count`, `pending_shots_count`, `is_in_booster_phase`, `protocol`; added `verification_status`, `is_booster` to shot response

#### Changed: API Routes
- **Added**: `GET /api/pets/{petId}/available-protocols` — returns enrolled + available optional protocols
- **Added**: `POST /api/pets/{petId}/opt-in/{protocolId}` — opt-in to optional vaccine protocol
- **Removed**: `POST /api/pets/{petId}/vaccination-cards` (custom card creation)
- **Removed**: `DELETE /api/pets/{petId}/vaccination-cards/{cardId}` (card deletion)

#### Changed: Frontend
- **petService.ts**: Added `VaccineProtocol`, `AvailableProtocolsResponse` interfaces; added `getAvailableProtocols()`, `optInToProtocol()` functions; removed `createCustomVaccinationCard()`, `deleteVaccinationCard()`
- **vaccinations.tsx**: Replaced custom card modal with opt-in modal showing admin-defined protocol cards; added "Pending" stat card; renamed "Completed" to "Verified"
- **VaccinationCard.tsx**: Shows `approved_shots_count` in progress; pending banner for shots awaiting approval; booster phase/completion messages; status colors for `pending_approval` and `rejected`
- **AddShotModal.tsx**: Added "Approval Info Note" warning that shots require admin approval

#### Migration
- `2026_02_10_000001_create_vaccine_protocols_and_update_vaccination_system.php` — creates `vaccine_protocols` table, adds `vaccine_protocol_id` FK to `vaccination_cards`, adds `is_booster` to `vaccination_shots`, adds `historical` to `verification_status` enum, seeds 6 initial protocols and links existing cards

#### Admin Panel Structure Fix
- **Refactored `dashboard.blade.php`**: Converted from standalone 514-line HTML file to `@extends('admin.layouts.app')` — sidebar now uses shared layout, always stays in sync with other pages
- **Fixed mobile menu in `layouts/app.blade.php`**: Added missing links (Match History, Analytics, Subscription & Billing, Tickets, Audit Logs) and entire Personal section (Profile Settings, Notifications, Settings) with active state highlighting
- **PetController consistency**: Updated vaccination card response to include `approved_shots_count`, `pending_shots_count`, `is_in_booster_phase`, `protocol`, `verification_status`, `is_booster`; fixed `completed_shots_count` mapping to use `approved_shots_count`

---
## [1.4.3] - 2026-02-05

### Block & Report System

#### Backend
- **New Tables**: `user_blocks` and `safety_reports` for user safety features
- **New Models**: `UserBlock.php` and `SafetyReport.php` with relationships
- **New Controller**: `SafetyController.php` with endpoints:
  - `POST /api/users/{id}/block` - Block a user
  - `DELETE /api/users/{id}/block` - Unblock a user
  - `GET /api/users/blocked` - Get list of blocked users
  - `GET /api/users/{id}/blocked-status` - Check block status
  - `POST /api/users/{id}/report` - Report a user
  - `GET /api/report-reasons` - Get available report reasons
- **User Model**: Added `blockedUsers()`, `blockedByUsers()`, `hasBlocked()`, `isBlockedBy()`, `getBlockedUserIds()` methods
- **Match Filtering**: Blocked users' pets now excluded from matching pool in `MatchController`

#### Frontend
- **New Service**: `safetyService.ts` with block/report API functions
- **New Component**: `BlockReportModal.tsx` - Tabbed modal for blocking and reporting users
- **New Component**: `MatchTimeline.tsx` - Visual progress timeline showing match stages (Matched → Contract → Signed → Breeding → Result)
- **Conversation Screen**: Added shield button in header to access Block & Report, integrated Match Timeline

### Rest Period for Failed Breeding
- Added `FAILED_BREEDING_COOLDOWN_DAYS = 14` constant to Pet model
- Female pet (dam) now receives 14-day cooldown when breeding fails

### Bug Fixes
- Fixed `User::authentications()` → `User::userAuth()` method call in `MatchRequestController`
- Added `match_accepted_at` to conversation API response for timeline accuracy

### Testing Mode
- Temporarily disabled payment/subscription requirement for match requests (for testing)

---
## [1.4.0] - 2026-02-04

### Pet Creation & Vaccination Rework

#### Vaccination Card System
- **New Component**: `VaccinationCard.tsx` - Expandable card with progress bar, shot timeline, and status indicators
- **New Component**: `AddShotModal.tsx` - Modal form for adding shot records with file upload, date pickers, and auto-calculated expiration
- **New Screen**: `vaccinations.tsx` - Dedicated vaccination management screen with stats summary, required/optional sections
- Integrated vaccination cards into Pet Profile Health tab
- Cards auto-initialize on pet registration (Parvo, Distemper, Rabies, Leptospirosis)

#### Vaccination Logic Rework
- **Breaking Change**: Next shot date now based on **expiration date** instead of fixed intervals
- User provides actual expiration from vet documentation
- System shows "Next shot due: [expiration date]" for accurate scheduling
- Removed `interval_days` dependency from shot scheduling

#### Booster Shot Support
- Users can now add shots **beyond required series** (previously blocked)
- Completion message updated: "Vaccination series completed! You can still add booster shots if needed."
- Modal shows "Booster Shot" label with green badge when adding beyond required count
- Info note explains booster context to users

#### Simplified Recurrence Types
- Changed custom card creation from `none/yearly/biannual` to `none/recurring`
- **One-time Series**: No renewal after completing required shots
- **Recurring**: Renew when expired (user provides expiration date)
- Cleaner UI with helpful descriptions for each option

#### File Storage Fix
- Changed all file uploads to use `do_spaces` disk instead of `public`
- Fixed 15 storage locations across `PetController`, `VaccinationController`, `BreedingContractController`
- All vaccination records, pet photos, health certificates now upload to DigitalOcean Spaces

#### Code Quality Fixes
- Removed stray `\r` characters from 7 source files
- Fixed custom vaccination modal to use proper `TextInput` instead of `Text` placeholder

#### Backend Changes
- `VaccinationShot::createForCard()` - Uses `$expirationDate` for `$nextShotDate`
- `VaccinationCard::calculateNextShotDate()` - Returns latest shot's expiration date
- `VaccinationCard::createCustomCard()` - Removed `$intervalDays` parameter
- `VaccinationController::createCustomCard()` - Added `recurring` to valid recurrence types, removed `interval_days` validation

#### Frontend Changes
- `petService.ts` - Updated `createCustomVaccinationCard` type signature
- `VaccinationCard.tsx` - Always allow adding shots, added `recurring` case in progress text
- `vaccinations.tsx` - New renewal type UI with descriptions
- `AddShotModal.tsx` - Booster shot detection and UI differentiation

#### Match Request Verification Requirement
- **Backend**: Added ID verification check in `MatchRequestController::store()` - unverified users receive 403 with `requires_verification: true`
- **Frontend**: Updated `sendMatchRequest()` to handle verification error response
- **UX**: Shows alert with "Verify Now" button that navigates to verification status screen
- Users must have approved ID verification before sending match requests

---
## [1.3.3] - 2026-02-03

### User Verification Redesign

#### New Verification UI Components
- `StepperProgress` - Visual 3-step progress indicator with animated transitions
- `IdTypeSelector` - Modal-based Philippine ID type picker with search
- `DocumentUploader` - Camera/gallery picker with image preview and remove option
- `AutoFilledInput` - Styled input with floating label and icon support
- `OcrLoadingOverlay` - AI scanning animation overlay for future OCR integration

#### Verification Flow Redesign
- Complete redesign of User Verification pages with modern card-based UI
- Added ScrollView inside KeyboardAvoidingView to fix keyboard covering inputs
- Added `keyboardVerticalOffset` to account for header height

#### Resubmission Pages Redesign
- Redesigned `resubmit-user-verification.tsx` to match new verification design
- Redesigned `resubmit-document.tsx` for pet vaccination/health record resubmissions
- Both pages now use consistent styling with verification flow

#### Profile Page Resubmission Fix
- Fixed resubmission routing from Profile page
- Now correctly routes to resubmit screen instead of full verification flow
- Updates existing rejected document instead of creating new database rows

#### DigitalOcean Spaces Storage Fix
- Changed all verification uploads to use `do_spaces` disk instead of `public`
- Fixed Admin document URLs to use `Storage::disk('do_spaces')->url()`
- Fixed `uriToFile()` in `verificationService.ts` to extract MIME type from file extension

#### Type Fixes
- Added missing `active_contracts` and `failed_contracts` to `ShooterProfile.statistics` type

#### Documentation
- Added OCR implementation plan in `docs/OCR_IMPLEMENTATION_PLAN.md`

#### New Verification Status Screen
- Created `verification-status.tsx` - Centralized screen showing all document statuses
- Shows summary banner with overall verification status
- Individual cards for each document type (ID, Breeder License, Shooter Certificate)
- Displays rejection reasons and provides resubmit buttons for rejected documents
- Updated `VerificationStatus` type to include `rejection_reason`, `document_number`, `document_name`, `issue_date`, `expiry_date`, `issuing_authority`

#### Single Certificate Submission
- Created `add-certificate.tsx` - Dedicated screen for adding breeder/shooter certificates
- Prevents need to go through full 3-step verification flow for optional certificates
- Dynamic configuration based on certificate type (breeder = amber theme, shooter = blue theme)
- Profile page verification button now routes to Verification Status screen
- Updated `getVerificationDisplay()` to check ALL documents, not just ID

---
## [1.3.2] - 2026-02-03

### Fixed
- Profile images not displaying correctly due to malformed URLs
- Double slash in storage URLs caused by trailing slash in API_BASE_URL
- Inconsistent image URL construction across different screens

### Added
- Centralized `getStorageUrl()` utility in `utils/imageUrl.ts` for consistent image URL handling

### Changed
- Removed trailing slash from `API_BASE_URL` in `config/env.ts`
- Updated `edit-profile.tsx`, `SearchResultCard.tsx`, `search.tsx`, `HorizontalShooterScroll.tsx`, and `[id].tsx` to use the new `getStorageUrl()` utility

---

## [1.3.1] - 2026-01-29

### Pet Cooldown Fixes & Global Search

#### Global Search Feature
- Added new **Search Screen** (`app/search.tsx`) with full-text search across pets, breeders, and shooters
- Three tab navigation: Pets, Breeders, Shooters
- Filter chips for pets: Species (Dog/Cat) and Sex (Male/Female)
- Debounced search (300ms) for optimal performance
- Recent searches persistence with AsyncStorage (save, remove, clear all)
- Search icon in PlayfulHeader now navigates to search screen
- "See All" buttons in homepage sections navigate to search with pre-applied tab filters

#### Backend Search API
- Created `SearchController.php` with three endpoints:
  - `GET /api/search/pets` - Search pets by name, breed, species with optional filters
  - `GET /api/search/breeders` - Search verified breeders by name/email
  - `GET /api/search/shooters` - Search verified shooters by name/email
- Excludes pets on cooldown from search results
- Returns formatted data with owner info and photos

#### New Files
- `PawLink/app/search.tsx` - Search screen component
- `PawLink/services/searchService.ts` - API service + AsyncStorage persistence
- `backend/app/Http/Controllers/SearchController.php` - Search endpoints

#### Dependencies
- Added `@react-native-async-storage/async-storage` for recent searches persistence

### 🔥 HOTFIX - Search Screen Black Screen Crash

#### Critical Bug Fixed
- **Issue**: Search screen displayed black/gray screen when navigating from homepage in production APK builds
- **Root Cause**: Fabric (New Architecture) synchronization issues + outdated react-native-reanimated with tree-shaking bug

#### Navigation Architecture Fix
- Changed root layout from `Slot` to `Stack` navigator for proper screen transitions
- Added `contentStyle: { backgroundColor: '#FFFFFF' }` to all Stack navigators
- Added `sceneStyle: { backgroundColor: '#FFFFFF' }` to Tabs navigator
- Added `animation: 'fade'` to root Stack for smoother transitions
- Prevents native "black hole" during Fabric view synchronization

#### Files Modified
- `app/_layout.tsx` - Converted from Slot to Stack with explicit screen definitions
- `app/(tabs)/_layout.tsx` - Added sceneStyle backgroundColor
- `app/(chat)/_layout.tsx` - Added contentStyle backgroundColor
- `app/(verification)/_layout.tsx` - Added contentStyle backgroundColor
- `app/(auth)/_layout.tsx` - Added backgroundColor to root View

#### Search Screen Hardening
- Wrapped SearchScreen in `ErrorBoundary` component to catch JS crashes gracefully
- Removed `autoFocus` on TextInput (caused Android production issues)
- Added null safety checks for pet/user card rendering

#### New Components
- `components/ErrorBoundary.tsx` - Catches JS errors and displays fallback UI with retry button

#### Dependency Upgrades (Required Rebuild)
- Upgraded `react-native-reanimated` from 4.1.5 → **4.2.1** (fixes tree-shaking crash)
- Upgraded `react-native-worklets` from 0.5.1 → **0.7.2** (fixes native initialization stripping)

#### Technical Details
- Tree-shaking in R8/ProGuard was stripping `react-native-worklets` initialization code in production builds
- Fabric defaults to transparent/black background, causing "black screen" during navigation transitions
- Fix requires APK rebuild (not OTA-pushable due to native dependency changes)

---

## [1.3.0] - 2026-01-28

### Deployment

#### DigitalOcean App Platform
- Deployed Laravel backend to DigitalOcean App Platform
- Created `Dockerfile` for PHP 8.2 + Apache container
- Created `.do/app.yaml` App Platform specification
- Admin panel accessible at `/admin/login`

#### DigitalOcean Managed MySQL
- Configured managed MySQL 8 database cluster
- Connected via secure port 25060

#### DigitalOcean Spaces (Object Storage)
- Set up S3-compatible file storage for pet images and documents
- Added `do_spaces` disk configuration to `filesystems.php`
- Region: Singapore (sgp1) for optimal Philippines access

### Mobile App Build & Distribution

#### EAS Build Configuration
- Configured Expo Application Services (EAS) for Android APK builds
- Updated `app.json` with proper package name (`com.khat.pawlink`)
- Created `eas.json` with preview and production build profiles
- Added `.easignore` to exclude backend folder from builds

#### OTA Updates (EAS Update)
- Installed and configured `expo-updates` for over-the-air updates
- Created `useUpdateChecker` hook for update prompts
- Users receive update notification on app open with option to restart
- Branch/channel mapping: `preview` branch → `preview` channel

### UI/UX Improvements

#### Role Switcher Enhancement
- Role switcher in Profile Settings now only shows for users with both Pet Owner AND Shooter roles
- Single-role users no longer see the unnecessary role toggle

#### Typography
- Changed "PAWLINK" header title to use Baloo font family

### Bug Fixes

#### Build Fixes
- Fixed crash on tab navigation caused by Reanimated v4 + SVG animations on new architecture
- Removed `FadeIn`/`FadeOut` animations from `CurvedTabBar` center button
- Fixed package version mismatches via `npx expo install --fix`

### Documentation
- Created `docs/digitalocean-deployment.md` with complete deployment guide
- Step-by-step instructions for Spaces, MySQL, and App Platform setup

---

## [1.2.0] - 2026-01-27

### UI/UX Improvements

#### Header Redesign
- Redesigned header to Instagram-style layout with centered "PAWLINK" title
- Search icon moved to left side of header
- Crown (subscription) and notification icons on right side
- Removed search bar and filter button from header (cleaner look)
- Added proper spacing below header (`marginBottom: 16`)
- Uses `useSafeAreaInsets()` for proper status bar handling

#### Navigation Bar Enhancements
- Center button now displays **selected pet's photo** instead of static paw icon
- Falls back to paw icon when no pet selected or no photo available
- Reduced border width from 6px to 4px for cleaner appearance
- Added `overflow: hidden` for proper circular image clipping

#### Removed Components
- Removed `FloatingAddButton` from homepage (functionality moved elsewhere)
- Cleaned up unused imports and handlers (`handleAddPetPress`, `isIdVerified`)
- Removed verification status fetching from homepage (no longer needed)

### Code Cleanup
- Removed unused `Alert` import from homepage
- Removed `verificationService` imports from homepage
- Simplified homepage data fetching (removed verification API call)

---

## [1.1.0] - 2026-01-27

### UI/UX Improvements

#### Match Card Redesign
- Increased card height from 320px to 400px for better content spacing
- Increased photo area from 220px to 260px
- Added age calculation from birthdate (displayed as "Name, Age")
- Breed now displays with tag icon instead of showing "Unknown"
- Added separator line between info section and location
- Improved visual hierarchy: Photo > Name/Age > Breed > Location

#### Action Buttons Fix
- Standardized button sizes: Pass/Like at 60px, Message at 52px
- Removed awkward `translateY` offset from message button
- Increased gap between buttons from 24px to 32px
- Added stronger shadows (`Shadows.lg`) for better elevation

#### Match Card Stack
- Updated `CARD_HEIGHT` constant to 400px to match new card design
- Compatibility badge now uses coral color for heart icon (was white on white)

### Backend API Updates
- `MatchController::getTopMatches()` now returns `breed`, `sex`, and `birthdate` for both pets
- Updated `TopMatch` TypeScript interface to include new fields

### Bug Fixes
- Fixed duplicate "See All" buttons in pet/shooter sections
- Made `HorizontalPetScroll` headless (header provided by `SectionContainer`)
- Made `HorizontalShooterScroll` headless (header provided by `SectionContainer`)
- Removed `onSeeAllPress` prop from scroll components

---

## [1.0.0] - 2026-01-26

### New Features

#### Homepage Redesign
- Complete homepage overhaul with modern card-based design
- New component architecture for better maintainability

#### New Components
- `PlayfulHeader` - Large curved header with brand title and icons
- `MatchCard` - Individual match card with photo, compatibility %, pet info
- `MatchCardStack` - Stacked cards with swipe gestures and action buttons
- `HorizontalPetScroll` - Horizontal scrolling pet cards
- `HorizontalShooterScroll` - Horizontal scrolling shooter cards
- `FloatingAddButton` - Floating action button for adding pets
- `SkeletonLoader` - Loading state skeletons for cards
- `SectionContainer` - Rounded container with icon, title, and "See All"
- `TabSwitcher` - Pills to switch between Pets/Shooters tabs

#### Swipe Gestures & Interactions
- Added swipe left/right gestures to match cards using `react-native-gesture-handler`
- Smooth animations with `react-native-reanimated`
- Haptic feedback on swipe actions via `expo-haptics`

#### Visual Design
- Warm coral color palette (`#FFE0D8` background, `#FF6B4A` accent)
- Pink match section container (`#F9DCDC`)
- Curved corners and soft shadows throughout
- Custom icons for subscriptions and notifications

#### Color System Updates
Added new colors to `constants/colors.ts`:
- `bgCoral: "#FFE0D8"` - Main warm background
- `bgCoralLight: "#FFF5F3"` - Lighter coral variant
- `matchCardBg: "#F9DCDC"` - Pink for match sections
- `matchCardBorder: "#FECACA"` - Match card borders
- `coralVibrant: "#FF6B4A"` - Primary accent color
- `coralDark: "#DC2626"` - Dark coral for emphasis
- `coralBorder: "#FFD1C7"` - Subtle coral borders

### Technical Improvements
- Wrapped app in `GestureHandlerRootView` in `app/_layout.tsx`
- Reduced homepage from ~993 lines to ~300 lines
- Modular component structure for easier maintenance

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.4.7 | 2026-02-16 | Admin data export, user suspension system, audit logs, subscription management |
| 1.4.6 | 2026-02-11 | AI breed identification, admin reports & safety management, vaccination UX (bottom sheet, protocol change), in-app warnings |
| 1.4.5 | 2026-02-11 | Admin panel bugfixes — wired stub actions, fixed hardcoded statuses, design consistency |
| 1.4.4 | 2026-02-10 | Vaccination Management overhaul — admin-controlled protocols, approval workflow, shot verification queue |
| 1.4.3 | 2026-02-05 | Block & Report system, Match Timeline, Rest Period for failed breeding |
| 1.4.0 | 2026-02-04 | Pet Creation & Vaccination Rework - card system, expiration-based scheduling, booster support, DO Spaces fix |
| 1.3.3 | 2026-02-03 | User Verification redesign, Verification Status screen, single certificate submission, DO Spaces fix |
| 1.3.2 | 2026-02-03 | Image URL fix with centralized `getStorageUrl()` utility |
| 1.3.1 | 2026-01-29 | Global search, **HOTFIX: black screen crash fix**, reanimated 4.2.1 |
| 1.3.0 | 2026-01-28 | DigitalOcean deployment, EAS Build/Update, role switcher fix |
| 1.2.0 | 2026-01-27 | Instagram-style header, pet photo in nav bar |
| 1.1.0 | 2026-01-27 | Match card redesign, breed data fix, button improvements |
| 1.0.0 | 2026-01-26 | Initial homepage redesign with swipe gestures |
