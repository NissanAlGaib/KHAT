# Instructor Feedback Analysis & Requirements
**Date:** February 5, 2026
**Source:** Engr. Marjorie

This document organizes the recent feedback into a comprehensive guide for system improvements. It clarifies the logic gaps and functional requirements identified during the review.

---

## 1. Vaccination Management (Critical Workflow Update)
The current "User adds shot" model is incorrect. Control must shift to the Admin.

### New Workflow
1.  **Admin Control:** The list of available vaccines and their schedules (e.g., Parvo, Distemper) resides *strictly* on the Admin side. Users should not be "creating" vaccines.
2.  **User Action:** Users only **attach proof** (photos/documents) for a specific vaccine shot.
3.  **Approval Process:**
    *   User uploads proof -> Status: `Pending`.
    *   Admin reviews proof -> Status: `Approved` or `Rejected`.
    *   Only `Approved` vaccines reflect on the User's profile as "Completed".
4.  **Display:**
    *   Vaccines should appear as a **List** on the user side, pulled directly from the Admin's configured schedule.
    *   Users should see what is due, what is pending approval, and what is completed.

### Complex Scheduling Logic (Parvo Example)
The system must handle multi-dose logic, not just single shots.
*   **Scenario:** Parvo requires 3 consecutive doses followed by an Annual Booster.
*   **Logic Requirement:** The system needs a "Series" tracking feature.
    *   *If Dose 1 is approved -> System opens Dose 2.*
    *   *If Dose 3 is approved -> System schedules Annual Booster.*
*   **Gap:** "How do you add the parvo shot assuming it's not yet in the profile?" -> The Admin defines the "Parvo Protocol" (Series of 3), and adding "Parvo" to a pet automatically adds the placeholders for all 3 required shots.

---

## 2. Breeding & Matching Logic
Focus on flexibility, success tracking, and clearer ownership of outcomes.

### Successful Matching & Offspring
*   **Definition of Success:** A match is only truly "Successful" if it results in offspring. "Just mating" is a status update, but "Producing Offspring" is the success metric.
*   **Offspring Attribution:**
    *   **Question:** "To whom does it fall? Female or male?"
    *   **Logic:** Typically, the **Female Owner** (Dam) records the litter initially. However, the system should link the offspring to the **Male (Sire)** in the database for lineage tracking.
*   **Reporting:**
    *   **Daily Report:** Needs to track the status of the mating process (e.g., "Shooter booked", "Mating Verified").
    *   **Shooter History:** Users need to search for a Shooter based on their *success rate* (e.g., "How many times has this shooter been successful looking for a shooter?").

### Flexibility & Crossbreeding
*   **Strict vs. Flexible:** The system currently enforces compatibility too strictly.
*   **Requirement:** Allow **Crossbreeding** (Mix Breeds).
    *   *User Outcome:* "What if I just want to mix breeds?" or "I don't care about the app's logic, I like this specific dog."
    *   **Feature:** **Manual Browse / "See All" Mode**. Users should be able to scroll through *all* available dogs, even those with low compatibility scores, and initiate a request. Compatibility warnings can be shown, but shouldn't block the action.

### Failed Matches
*   **Automatic Status:** If a match fails (no pregnancy/offspring), the status must reflect "Failed" immediately.
*   **Consequence:** No offspring records are created.

---

## 3. Profile & User Management

### User Roles
*   **Transitioning:** A standard Pet Owner user must have a clear pathway to become a Breeder if they meet criteria (already noted as "Solved", but ensure flow is smooth).

### Profile Enhancements
*   **Statistics:** Profiles (especially for Shooters/Studs) must show performance stats:
    *   Number of successful matings.
    *   Offspring count.
    *   Photos of parents and resulting puppies ("What they made").
*   **Ratings:** Implementation of a user rating system (Review after transaction).

---

## 4. Financials & Agreements
*   **Compensation:** How is the "Puppy Share" or "Cash" agreement profiled?
    *   The agreement terms (e.g., "1 Puppy to Male Owner" or "₱5000 fee") need to be recorded in the Match Contract explicitly.
*   **Money Tracking:** Record that payment was `Received`. This is currently missing ("Wala pa to").

---

## Summary of Action Items (No-Code Plan)
1.  **Redesign Database Schema for Vaccines:** Move vaccine definitions to a global table; UserVaccines becomes a join table with status constraints.
2.  **Update Match Algorithm:** Add a flag to bypass compatibility filters (e.g., `allow_crossbreed`).
3.  **Enhance Shooter Profile:** Add queries to count successful `MatchRecords` and display on profile.
4.  **Create "Litter" Module:** Allow Female owners to register a "Litter" linked to a specific completed Match ID.
