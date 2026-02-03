# Changelog

All notable changes to the PawLink project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
| 1.3.1 | 2026-01-29 | Global search, **HOTFIX: black screen crash fix**, reanimated 4.2.1 |
| 1.3.0 | 2026-01-28 | DigitalOcean deployment, EAS Build/Update, role switcher fix |
| 1.2.0 | 2026-01-27 | Instagram-style header, pet photo in nav bar |
| 1.1.0 | 2026-01-27 | Match card redesign, breed data fix, button improvements |
| 1.0.0 | 2026-01-26 | Initial homepage redesign with swipe gestures |
