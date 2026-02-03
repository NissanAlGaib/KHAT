# Changelog

All notable changes to PawLink will be documented in this file.

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

## [1.3.1] - Previous Release

- Previous version changes
