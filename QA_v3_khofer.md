# Test Cases - V1.6.2
**Release Date:** October 4, 2026

## Registration

### Reg_014  
**Test Scenario:** Worst case: Register with an existing email and username  
**Objective:** Reveal how the software reacts to duplicate account data to ensure uniqueness

**Pre-Condition:**  
- User is on the registration screen  
- The data used is already present in the database

**Test Steps:**  
1. Enter an email already in the DB  
2. Enter a username already in use  
3. Tap **Next**

**Test Data:**  
- Email: `khofertesting01@email.com`  
- Username: `khofertesting01`

**Expected Result:**  
- The software handles the fault by showing **"Account already exists"**  
- Prevents moving forward to the next screen

**Post Condition:**  
(None required for negative testing)

**Actual Result:**  
The system does not recognize the duplication and proceeds to the next steps.

**Status:** Fail

## Profile → My Pets (Add New Pet)

### Pet_001  
**Test Scenario:** Worst case: Verify the sorting order of the Pet Breed dropdown menu  
**Objective:** Usability scenario to ensure breed options are organized alphabetically for easier user navigation

**Pre-Condition:**  
- User is on the **Add Pet** screen  
- Has navigated to the **Pet Information** section

**Test Steps:**  
1. Locate the **Breed** dropdown field  
2. Tap the dropdown to view the list of choices  
3. Observe the initial sorting of the breeds before typing

**Test Data:**  
- Example breed visible: Puspin

**Expected Result:**  
- The dropdown menu displays the breeds in **alphabetical order**  
- User can quickly find their pet's breed without excessive scrolling

**Post Condition:**  
(None explicitly required)

**Actual Result:**  
The breeds are displayed in a **non-alphabetical / random order** based on database entry.

**Status:** Fail

## Messaging

### Msg_001  
**Test Scenario:** Exchange of contact numbers and external links in chat  
**Objective:** Verify if the system detects and masks sensitive data to prevent off-platform communication and potential abuse

**Pre-Condition:**  
- Two users are logged in  
- An active chat session is opened between them

**Test Steps:**  
1. Open a chat with another user  
2. Type and send a mobile number (e.g., "09123456789")  
3. Type and send an external URL (e.g., "")  
4. Observe if the message is blocked or masked

**Test Data:**  
- Message example: "Call me at 0917-000-0000"

**Expected Result:**  
- The software handles the fault by **masking** the numbers/links  
  (e.g., "Call me at [Redacted]")  
- OR completely **blocks** the message  
- Ensures app utility and user safety are maintained

**Post Condition:**  
(None required for negative testing)

**Actual Result:**  
The system allows the plain text transmission of numbers and links, enabling communication outside the app.

**Status:** Fail

### Msg_002  
**Test Scenario:** Modify contract amount after payment  
**Objective:** Financial integrity test to ensure contract terms are locked once paid

**Pre-Condition:**  
- User A set a price: **2 PHP**  
- User B has already **paid** the amount

**Test Steps:**  
1. User A: Attempt to change amount to **2000**  
2. User B: Check contract view and History log

**Test Data:**  
- Attempted new amount: **2000 PHP**

**Expected Result:**  
- The system **prevents** modification of a paid contract  
- History log still reflects the original **2 PHP** paid amount

**Post Condition:**  
(None for negative testing)

**Actual Result:**  
- System allowed the price change  
- UI showed "**2k**" but History showed "**20**"

**Status:** Fail