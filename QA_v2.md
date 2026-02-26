#QA REPORT

## 1. Suspend Button Not Updating (USER MANGEMENT PAGE TABLE)
- After suspending an account, the **Action** button in the table does not change.
- It should automatically change to:
  - **Unsuspend**, or
  - **Lift Suspension**

---

## 2. Error When Granting 199 / Basic Subscription (USER MANAGEMENT PAGE GRANT SUBSCRIPTION )
- Changing subscription from **499 / Premium** to **199 / Basic** causes an error.
- Granting **199 / Basic** subscription results in a system error.
- Other subscription tiers are working properly.
- Only the **199 / Basic** tier is affected.

---

## 3. Difference Between Ban and Suspend
Currently, both actions appear to function the same way.

### Suggested Definition:
- **Suspend** → Temporary restriction (user can be reactivated).
- **Ban** → Permanent restriction (user cannot access the system unless manually lifted).

---

## 4. Suggestion: Add Date Option for Ban/Suspension
- Add a **calendar/date picker** when changing user status.
- This allows:
  - Setting a suspension duration.
  - Automatically lifting suspension on a selected date.

---

## 5. No Warning When Reason Field Is Empty (USER MANAGEMENT PAGE CHANGE STATUS)
- When changing status without entering a reason:
  - The system proceeds.
  - The action does not work.
  - No warning message appears.

### Expected Behavior:
- Display validation message:
  > "Reason is required."

---

## 6. Admin Role Not Properly Revoked (USER MANAGEMENT PAGE ALL USER)
- After adding an Admin role and then revoking it:
  - The user still appears as Admin in **User Management**.
- Role removal is not updating or refreshing properly.

---

## 7. Pet Status Change Not Working (PET MANAGEMENT PAGE ALL PETS CHANGES STATUS)
- Changing pet status to:
  - **Disabled**
  - **Banned**
- Does not work.
- Only **Active** and **Cooldown** statuses function properly.

---

## 8. Protocol Category Count Not Updating (PROTOCOL CATEGORIES PAGE)
- A protocol was added to **Non-Core**.
- In the Protocol Categories page:
  - The **Non-Core** count still displays **0**.
- Category count is not updating.

---

## 9. Subscription Tier Price Editing Not Saving (SUBSCRIPTION TIERS PAGE)
- Editing prices in the **Subscription Tiers** page:
  - Changes do not save.
  - Updates are not applied.

---

# Summary of Main Issues
- UI buttons not updating after actions.
- 199 / Basic subscription tier causing system error.
- Missing validation for required reason field.
- Role updates not reflecting properly.
- Some status options not functioning.
- Category counts not refreshing.
- Subscription price edits not saving.