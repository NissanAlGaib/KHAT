# Quality Assurance Report

## 1. User Rating Table Issue
- The admin account is included in the user ranking table.
- The admin should **not** be included in user ratings or rankings.

---

## 2. Delete User Issue
- When deleting a user, the system displays a raw JSON response:
  
  {"success":true,"message":"User account deleted successfully"}

- After going back, a **404 Not Found** error appears.
- The user is still successfully deleted.
- The system should display a proper success message and redirect correctly without errors.

---

## 3. Create Admin Validation Issue
- When creating an admin account:
  - If the **name** or **password** field is empty, the system still proceeds.
  - No warning message is displayed.
  - The data is not saved, but there is no clear error message.
  - Only the **email field** shows validation.
- The system should require all fields and display proper validation messages.

---

## 4. Delete Protocol Category Issue
- When deleting a protocol category that contains vaccines:
  - The deletion does not proceed because it has existing records.
  - No warning or modal message is shown.
- The system should display a message such as:
  
  > "This category cannot be deleted because it contains vaccines."

---

## 5. Money Pool Section – Export Issues
- All export options are only available in **CSV format** (no PDF option).
- In the exported CSV file:
  - The **date column appears as `####`** instead of showing the actual date.

- Question:
  - Are the dates not supposed to be shown in Excel?
  - Why are the dates displayed as `#####` instead of the correct date format?

- The system should:
  - Provide a **PDF export option**.
  - Fix the date formatting issue in CSV exports.

---

## 6. Admin Details Format Issue
- The **Admin Details** page has the same format as the **User Details** page.
- The admin details layout should be different from the user format.