# QA Report v.2

## ERRORS AND SUGGESTIONS FROM TESTING

**Device Used:** TECNO POVA NEO 2 2022 (Screen size: 6.82 inch)

### REGISTRATION

**Error:**
* When entering the first name and last name fields, the system allows numbers and special characters like ?!@#$%&*(). This should not be allowed because these are formal and necessary information. Only letters should be accepted. Special characters should only be allowed for usernames.

**Suggestion:**
* For filling in the address, users should be able to see suggestions as they type, or have dropdown choices. For example: if they choose their region as Mindanao, then the province dropdown should only show or suggest provinces from that region (listed alphabetically). Once they have chosen their province, the city dropdown should only show or suggest cities from that province (also alphabetically). The same should apply for barangay/district, and so on. This would reduce typing, which can be too much or tiring for users.

---

### LOG IN

**Missing Feature:**
* There should be a "Forgot Password" option available.

**Suggestion:**
* The system should allow users to show their password (with a show/hide password button).

---

### PROFILE - SETTINGS - ACCOUNT (EDIT PROFILE)

**Errors:**
* The buttons to upload a picture are behind a black modal, making it hard to tell if they are clickable during the upload process.
* The system allows users to input more than the required number of digits for contact information, making it unreliable.

**Suggestions:**
* For contact information, the form or field should be set to accept only the needed number of digits, formatted like this: +63 XXX - XXX - XXXX
* It would be better if the buttons were clear and visible, so users do not have to second-guess themselves to complete the upload process.

---

### PROFILE - SETTINGS (PRIVACY AND SECURITY - CHANGE PASSWORD)

**Error:**
* The system cannot recognize when the old password has been reused. Instead of showing an error message like "Cannot use old password," it shows "Password successfully changed" even though no changes were actually made.

---

### PROFILE (VERIFY)

**Errors:**
* When uploading an ID, the buttons to complete the upload (crop, rotate, flip) are behind a transparent black modal, making them look unusable. The photo gets uploaded once "crop" is clicked. This happens for both ID and Certificate uploads.
* When a certificate is uploaded, the crop sizing is not user-friendly or suitable for a standard bond paper size certificate. Even if it can be resized by pulling on the corners, the maximum size still does not support bond paper size certificates unless they are captured in a certain way. The cropping tool works best for landscape IDs. For IDs in portrait mode, they can be rotated to fit the frame, but even when they fit perfectly, the interaction is still not user-friendly.

---

### PROFILE (MY PETS) - ADD A PET

**Error:**
* Cannot find the buttons to move to the next screen. This could be a case where the buttons do not fit within the frame or something similar.

---
