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
