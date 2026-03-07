/**
 * Changelog data for the "What's New" modal.
 *
 * After each release, add a new entry at the TOP of the `releases` array.
 * The hook compares the latest entry's `version` against what is stored
 * in AsyncStorage to decide whether the modal should appear.
 *
 * Categories: "new" | "improved" | "fixed"
 */

export interface ChangelogItem {
  text: string;
  category: "new" | "improved" | "fixed";
}

export interface ReleaseEntry {
  /** Semver string that matches app.json `version` or an OTA update id */
  version: string;
  /** Human-readable title shown in the modal header */
  title: string;
  /** Release date string (for display) */
  date: string;
  /** List of changes */
  items: ChangelogItem[];
}

/**
 * The first entry is always treated as the "current" release.
 * Keep older entries for reference — only the first one is shown.
 */
export const releases: ReleaseEntry[] = [
  {
    version: "1.6.7",
    title: "Pet Selector Revamp & Rich Animations",
    date: "March 7, 2026",
    items: [
      {
        text: "Completely redesigned the Pet Selection modal — gradient header, responsive sizing, and consistent theme styling",
        category: "improved",
      },
      {
        text: "Search bar added to pet selector — quickly find your pet by name",
        category: "new",
      },
      {
        text: "Quick-add pet button in the selector — jump straight to pet registration without leaving the modal",
        category: "new",
      },
      {
        text: "Swipe left/right on the floating pet button to cycle through your pets without opening the modal",
        category: "new",
      },
      {
        text: "Pet name now displayed below the floating tab bar button so you always know which pet is active",
        category: "new",
      },
      {
        text: "Rich animations throughout — bouncy button press, staggered list entry, animated selection checkmarks, and smooth photo crossfade on swipe",
        category: "improved",
      },
      {
        text: "Pet selector now uses the app's design system (theme colors, spacing, typography) instead of hardcoded values",
        category: "fixed",
      },
      {
        text: "New rating and review system — rate breeders and shooters with category-based scores after contract completion",
        category: "new",
      },
      {
        text: "Review modal with category rating rows and detailed review breakdown component",
        category: "new",
      },
      {
        text: "Completed matches archive — view all past completed matches from profile",
        category: "new",
      },
      {
        text: "Admin reviews page revamped with expanded analytics and user review details",
        category: "improved",
      },
      {
        text: "Contract completion flow fixed — breeding contracts now properly finalize and trigger ratings",
        category: "fixed",
      },
      {
        text: "Matching logic hotfix — dropped unique constraint to allow rematching between pets",
        category: "fixed",
      },
      {
        text: "Pet species casing normalized in the database for consistent filtering",
        category: "fixed",
      },
    ],
  },
  {
    version: "1.6.5",
    title: "Icon Refactoring & Admin Improvements",
    date: "March 4, 2026",
    items: [
      {
        text: "Icons refactored across contract tabs, payment screens, and search filters for consistency",
        category: "improved",
      },
      {
        text: "Admin detail page for individual admins with activity and role info",
        category: "new",
      },
      {
        text: "Admin management page enhanced with expanded admin profiles",
        category: "improved",
      },
      {
        text: "Match completion hotfix — resolved issue preventing matches from completing correctly",
        category: "fixed",
      },
      {
        text: "Admin pool transactions and protocol categories pages polished",
        category: "improved",
      },
    ],
  },
  {
    version: "1.6.4",
    title: "Keyboard Handling & Admin Notifications",
    date: "March 3, 2026",
    items: [
      {
        text: "New KeyboardAwareScrollView component — forms automatically scroll focused inputs into view",
        category: "new",
      },
      {
        text: "Auth screens (login, register, forgot password) and verification forms now use keyboard-aware scrolling",
        category: "improved",
      },
      {
        text: "Admin notification bell with real-time pending shot count and alerts",
        category: "new",
      },
      {
        text: "Admin pending shots verification page redesigned with improved layout and pet-specific shot history view",
        category: "improved",
      },
      {
        text: "Import history screen restructured with better data display",
        category: "improved",
      },
      {
        text: "Custom password reset email notification with PawLink branding",
        category: "improved",
      },
    ],
  },
  {
    version: "1.6.2",
    title: "Reports Form Revamp & UI Polish",
    date: "March 3, 2026",
    items: [
      {
        text: "Completely redesigned the Daily Reports form with grouped card sections, icon headers, and cleaner layout",
        category: "improved",
      },
      {
        text: "Health status selector now uses colored icon pills instead of emoji text — each status has a unique icon and color",
        category: "improved",
      },
      {
        text: "Breeding attempt toggle redesigned with Yes/No icon buttons and inline success/failure follow-up",
        category: "improved",
      },
      {
        text: "Photo upload section now shows Camera and Gallery options with dashed-border cards",
        category: "improved",
      },
      {
        text: "Report history cards now feature a colored top accent bar, icon badges, and structured detail sections",
        category: "improved",
      },
      {
        text: "Removed all emoji usage from the Reports tab — replaced with lucide icons throughout",
        category: "fixed",
      },
    ],
  },
  {
    version: "1.6.0",
    title: "Homepage Revamp, Side Buttons, & Shooter Discovery",
    date: "March 2, 2026",
    items: [
      {
        text: "Action buttons moved to sides of the card — Pass (left) and Like (right) no longer cut off by the tab bar",
        category: "improved",
      },
      {
        text: "Dismissible Shooter promo banner on the homepage — discover breeding assistants with one tap",
        category: "new",
      },
      {
        text: "Featured Shooters horizontal carousel on the Search screen with avatar, name, and rating",
        category: "new",
      },
      {
        text: "First-visit tooltip on the Shooters section to introduce the feature to new users",
        category: "new",
      },
      {
        text: "Full-screen Tinder-style swipe on the homepage — dedicated swiping experience",
        category: "new",
      },
      {
        text: "Floating action buttons overlay on card bottom with gradient fade",
        category: "new",
      },
      {
        text: "LIKE and PASS text indicators appear on-card during swipe gestures",
        category: "new",
      },
      {
        text: "Breed filter button added to the header bar for quick match filtering",
        category: "new",
      },
      {
        text: "Subscription page redesigned — white cards with soft gradient accent headers per plan",
        category: "improved",
      },
      {
        text: "Tab bar updated to clean white design with coral accents",
        category: "improved",
      },
      {
        text: "App-wide color system overhauled — neutral base with coral highlights instead of all-coral theme",
        category: "improved",
      },
      {
        text: "Unified sex badge colors across all pet cards",
        category: "improved",
      },
      {
        text: "Action buttons no longer cut off behind the tab bar",
        category: "fixed",
      },
    ],
  },
  {
    version: "1.5.10",
    title: "Search & Filter Revamp",
    date: "March 1, 2026",
    items: [
      {
        text: "Redesigned search screen with Instagram Explore-style pet grid",
        category: "new",
      },
      {
        text: "Filter bottom sheet — filter pets by species, sex, breed, and age range",
        category: "new",
      },
      {
        text: "Breed filter on homepage Top Matches swiping section",
        category: "new",
      },
      {
        text: "Infinite scroll pagination on search and explore results",
        category: "new",
      },
      {
        text: "Cooldown badge overlay on pet cards showing days remaining",
        category: "new",
      },
      {
        text: "Breed list endpoint with preset and user-submitted breeds for dogs and cats",
        category: "new",
      },
      {
        text: "Pets on cooldown now appear in search results instead of being hidden",
        category: "fixed",
      },
    ],
  },
  {
    version: "1.5.8",
    title: "Quality-of-Life Improvements",
    date: "March 1, 2026",
    items: [
      {
        text: "Forgot Password flow — reset your password via email",
        category: "new",
      },
      {
        text: "Show / Hide password toggle on all password fields",
        category: "new",
      },
      {
        text: "Cascading address dropdowns (Region → Province → City)",
        category: "new",
      },
      {
        text: "Phone number auto-formatting (+63 XXX-XXX-XXXX)",
        category: "improved",
      },
      {
        text: "Certificate upload now supports portrait / bond paper sizes",
        category: "improved",
      },
      {
        text: "Upload button visibility behind dark overlay",
        category: "fixed",
      },
      {
        text: "Name fields now only accept letters (no numbers/symbols)",
        category: "fixed",
      },
      {
        text: "Reusing old password is now properly detected and blocked",
        category: "fixed",
      },
    ],
  },
  // ── older releases (not shown, kept for history) ─────────────────
  // {
  //   version: "1.3.0",
  //   title: "Contract Management Revamp",
  //   date: "February 2026",
  //   items: [ ... ],
  // },
];
