# PawLink Mobile App — User Manual

**Version:** 1.5.0  
**Last Updated:** March 1, 2026  
**Platform:** Android (via Expo / EAS)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
   - 2.1 [Installing the App](#21-installing-the-app)
   - 2.2 [Creating an Account](#22-creating-an-account)
   - 2.3 [Logging In](#23-logging-in)
   - 2.4 [Forgot Password](#24-forgot-password)
3. [Identity Verification](#3-identity-verification)
   - 3.1 [Verifying Your Identity](#31-verifying-your-identity)
   - 3.2 [Adding Certificates (Optional)](#32-adding-certificates-optional)
   - 3.3 [Checking Verification Status](#33-checking-verification-status)
4. [Navigating the App](#4-navigating-the-app)
   - 4.1 [Bottom Navigation Tabs](#41-bottom-navigation-tabs)
   - 4.2 [Switching Roles (Breeder / Shooter)](#42-switching-roles-breeder--shooter)
5. [Managing Your Pets](#5-managing-your-pets)
   - 5.1 [Adding a New Pet](#51-adding-a-new-pet)
   - 5.2 [Viewing Your Pet's Profile](#52-viewing-your-pets-profile)
   - 5.3 [Managing Vaccinations](#53-managing-vaccinations)
   - 5.4 [Importing Vaccination History](#54-importing-vaccination-history)
   - 5.5 [Viewing Litters & Breeding History](#55-viewing-litters--breeding-history)
6. [Finding Breeding Matches](#6-finding-breeding-matches)
   - 6.1 [The Home Screen (Breeder)](#61-the-home-screen-breeder)
   - 6.2 [Swiping Through Matches](#62-swiping-through-matches)
   - 6.3 [Viewing a Pet's Public Profile](#63-viewing-a-pets-public-profile)
   - 6.4 [Checking Compatibility](#64-checking-compatibility)
   - 6.5 [AI Offspring Prediction](#65-ai-offspring-prediction)
   - 6.6 [Searching for Pets, Breeders & Shooters](#66-searching-for-pets-breeders--shooters)
7. [Match Requests](#7-match-requests)
   - 7.1 [Sending a Match Request](#71-sending-a-match-request)
   - 7.2 [Managing Incoming Requests](#72-managing-incoming-requests)
   - 7.3 [Managing Outgoing Requests](#73-managing-outgoing-requests)
   - 7.4 [Match History](#74-match-history)
8. [Chat & Messaging](#8-chat--messaging)
   - 8.1 [Starting a Conversation](#81-starting-a-conversation)
   - 8.2 [Sending Messages](#82-sending-messages)
   - 8.3 [Blocking & Reporting Users](#83-blocking--reporting-users)
9. [Breeding Contracts](#9-breeding-contracts)
   - 9.1 [Creating a Contract](#91-creating-a-contract)
   - 9.2 [Reviewing & Accepting a Contract](#92-reviewing--accepting-a-contract)
   - 9.3 [Contract Lifecycle](#93-contract-lifecycle)
   - 9.4 [Contract Detail Tabs](#94-contract-detail-tabs)
10. [Shooter Workflow](#10-shooter-workflow)
    - 10.1 [Shooter Home Dashboard](#101-shooter-home-dashboard)
    - 10.2 [Browsing Available Offers](#102-browsing-available-offers)
    - 10.3 [Accepting a Shooter Offer](#103-accepting-a-shooter-offer)
    - 10.4 [Active Assignments](#104-active-assignments)
11. [Subscriptions & Payments](#11-subscriptions--payments)
    - 11.1 [Subscription Plans](#111-subscription-plans)
    - 11.2 [Upgrading Your Plan](#112-upgrading-your-plan)
    - 11.3 [My Payments & Money Pool](#113-my-payments--money-pool)
    - 11.4 [Filing a Dispute](#114-filing-a-dispute)
12. [Activity & Notifications](#12-activity--notifications)
13. [Profile & Settings](#13-profile--settings)
    - 13.1 [Viewing Your Profile](#131-viewing-your-profile)
    - 13.2 [Editing Your Profile](#132-editing-your-profile)
    - 13.3 [Privacy & Security](#133-privacy--security)
    - 13.4 [Signing Out](#134-signing-out)
14. [Troubleshooting & FAQ](#14-troubleshooting--faq)
15. [Contact & Support](#15-contact--support)

---

## 1. Introduction

**PawLink** is a mobile pet breeding matchmaking platform that connects pet breeders with compatible breeding partners for their dogs and cats. The app also supports **Shooters** — breeding handlers/facilitators who assist with the logistics of breeding arrangements.

### Key Features

- **Smart Matching** — Swipe-based interface to discover compatible breeding partners with compatibility scores.
- **AI-Powered Tools** — Breed identification from photos, offspring appearance prediction, and OCR document scanning.
- **Breeding Contracts** — In-app contract creation and management for breeding arrangements.
- **Secure Payments** — Integrated PayMongo payment system with money pool escrow for collateral and compensation.
- **Real-Time Chat** — Direct messaging between matched breeders with read receipts.
- **Verification System** — Identity and document verification to ensure trust and safety.
- **Vaccination Tracking** — Comprehensive health record management for your pets.

---

## 2. Getting Started

### 2.1 Installing the App

1. Download the **PawLink** APK from the provided distribution link or scan the QR code shared by the development team.
2. On your Android device, go to **Settings > Security** and enable **Install from unknown sources** (if not already enabled).
3. Open the downloaded APK file and tap **Install**.
4. Once installed, tap **Open** to launch PawLink.

> **Note:** PawLink receives over-the-air (OTA) updates automatically. When an update is available, you will be prompted to restart the app.

### 2.2 Creating an Account

Tap **Register** on the login screen to begin the 4-step registration process:

#### Step 1 — Account Setup

- Enter your **email address** (must be valid and unique).
- Choose a **username**.
- Create a **password** with the following requirements:
  - At least 8 characters long
  - Contains at least one uppercase letter
  - Contains at least one number
  - Contains at least one special character

#### Step 2 — Personal Information

- Enter your **first name** and **last name**.
- Select your **birthdate** (you must be at least 13 years old).
- Choose your **sex** (Male or Female).

#### Step 3 — Address

- Enter your address in the Philippine format:
  - **Street Address**
  - **Barangay**
  - **City / Municipality**
  - **Province**
  - **Postal Code** (4 digits)

#### Step 4 — Role Selection

- Choose one or both roles:
  - **Breeder** — You own pets and are looking for breeding partners.
  - **Shooter** — You facilitate and handle breeding arrangements.
- You must select at least one role. You can select both.

Tap **Submit** to create your account. You will be redirected to the login screen.

### 2.3 Logging In

1. Enter your **email** and **password**.
2. Tap **Sign In**.
3. You will be taken to the Home screen.

> If your account has been suspended or banned, an alert will appear with an explanation. See [Troubleshooting](#14-troubleshooting--faq) for details.

### 2.4 Forgot Password

If you forget your password, tap **Forgot Password?** on the login screen. Follow the on-screen instructions to reset your password via email.

---

## 3. Identity Verification

Before you can add pets or send match requests, you must verify your identity.

### 3.1 Verifying Your Identity

1. From the **Profile** tab, tap on your **My Pets** section and then the **"+"** button, or navigate to **Settings > Verification Status**.
2. If you have not yet verified, you will be guided through the verification wizard.

#### Step 1 — Government ID Verification (Required)

- Tap **Upload ID** to take a photo or select one from your gallery.
- The app uses **OCR (Optical Character Recognition)** to automatically read and fill in details from your ID:
  - Full Name
  - ID Number
  - Issuing Authority
  - Issue and Expiry Dates
- Review the auto-filled information and make corrections if needed.
- Tap **Next** to proceed.

#### Step 2 — Licensed Breeder Certificate (Optional)

- If you have a breeder's license, upload it here.
- OCR will auto-fill certificate details.
- You may tap **Skip** if you don't have one.

#### Step 3 — Shooter Certificate (Optional)

- If you are a Shooter with certification, upload it here.
- You may tap **Skip** if not applicable.

Tap **Submit** to send your documents for review.

### 3.2 Adding Certificates (Optional)

If you skipped a certificate during initial verification, you can add it later:

1. Go to **Settings > Verification Status**.
2. Tap **Add Certificate** on the relevant document type.
3. Upload and submit.

### 3.3 Checking Verification Status

Go to **Settings > Verification Status** to see the current state of each document:

| Status            | Meaning                                                        |
| ----------------- | -------------------------------------------------------------- |
| **Not Submitted** | You have not uploaded this document yet.                       |
| **Under Review**  | Your document has been submitted and is awaiting admin review. |
| **Verified** ✅   | Your document has been approved.                               |
| **Rejected** ❌   | Your document was rejected. Check the reason and resubmit.     |

If a document is rejected, tap **Resubmit** to upload a new version with corrections.

---

## 4. Navigating the App

### 4.1 Bottom Navigation Tabs

PawLink uses a bottom navigation bar with 5 tabs:

| Tab                | Icon | Description                                                                               |
| ------------------ | ---- | ----------------------------------------------------------------------------------------- |
| **Home**           | 🏠   | Your main dashboard — browse top matches, nearby pets, and shooters.                      |
| **Matches**        | ❤️   | Manage match requests (incoming/outgoing), view active matches, and review match history. |
| **Match** (center) | 🐾   | Full-screen swipe interface for discovering pet matches.                                  |
| **Activity**       | 🔔   | Notification center — verification updates, match alerts, messages, and system notices.   |
| **Profile**        | 👤   | Your profile dashboard, pet list, and settings.                                           |

### 4.2 Switching Roles (Breeder / Shooter)

If you registered for both Breeder and Shooter roles:

1. Go to the **Profile** tab.
2. Tap the **Role Switcher** toggle near the top of the screen.
3. The app will switch between Breeder and Shooter modes:
   - **Breeder mode**: Home shows the matching interface and pet discovery.
   - **Shooter mode**: Home shows the Shooter dashboard with offers and assignments.

---

## 5. Managing Your Pets

### 5.1 Adding a New Pet

> **Prerequisite:** You must complete identity verification before adding a pet.

1. Go to the **Profile** tab.
2. Tap the **My Pets** section.
3. Tap the **"+"** floating action button.
4. Complete the 5-step Add Pet wizard:

#### Step 1 — Pet Information

- Enter your pet's **name**.
- Select **species** (Dog or Cat).
- **AI Breed Identification**: Tap the camera icon to take a photo or select one from your gallery. The AI will identify the breed and auto-fill it.
- Alternatively, manually select the **breed** from the dropdown.
- Select **sex** (Male or Female).
- Enter **birthdate**, **height** (cm), and **weight** (kg).
- Optionally enter a **microchip ID**.

#### Step 2 — About Your Pet

- Select relevant **behaviors** from the multi-select list (e.g., Friendly, Playful, Calm, Protective).
- Select relevant **attributes** (e.g., Hypoallergenic, Good with children).
- Write a **description** about your pet.

#### Step 3 — Health Certificate

- Upload your pet's health certificate document (photo).
- OCR will auto-fill certificate details.
- Review and correct the information as needed.

#### Step 4 — Photos

- Upload a **minimum of 3 photos** of your pet.
- Tap on a photo to set it as the **primary photo** (this will be shown in match cards).

#### Step 5 — Preferences

- Set your preferred breeding partner criteria:
  - **Preferred breed**
  - **Preferred behaviors**
  - **Preferred attributes**
  - **Age range** (minimum and maximum)

Tap **Submit** to register your pet. After successful registration, you will be offered the option to **import vaccination history**.

### 5.2 Viewing Your Pet's Profile

From **Profile > My Pets**, tap on any pet card to view the full pet profile. Your pet profile has 4 tabs:

- **About** — Species, breed, sex, age, weight, height, microchip ID, behaviors, attributes, and description.
- **Health** — Vaccination cards showing shot records. Status indicators: Valid ✅, Expiring Soon ⚠️, Expired ❌. You can add new shot records and resubmit rejected documents.
- **Gallery** — Photo grid displaying all uploaded photos with the primary photo highlighted.
- **History** — Your pet's breeding and litter history.

**Pet Status Badges:**

| Badge            | Meaning                                                            |
| ---------------- | ------------------------------------------------------------------ |
| **Available**    | Your pet is ready for matching.                                    |
| **Pending**      | Your pet has an active match request or is awaiting verification.  |
| **Disabled**     | Your pet has been temporarily disabled.                            |
| **Archived**     | Your pet has been archived and is not active.                      |
| **Cooldown: Xd** | Your pet is in a post-breeding cooldown period (X days remaining). |

### 5.3 Managing Vaccinations

1. Open your pet's profile and go to the **Health** tab.
2. You will see a **vaccination dashboard** with stats:
   - Total Cards
   - Verified
   - Pending
   - Overdue
3. Each vaccine card shows the protocol schedule and shot records.
4. To **add a new shot record**:
   - Tap on the vaccine card.
   - Tap **Add Shot**.
   - Enter the date and upload a photo of the vaccination document as proof.
   - Submit for verification.
5. To manage protocols, tap **Manage Protocol** to opt-in to new vaccine protocols or change existing ones.

### 5.4 Importing Vaccination History

After registering a new pet, you can import past vaccination records:

1. When prompted after pet registration, tap **Import Vaccination History**.
2. For each vaccine card:
   - Enter shot dates.
   - Upload supporting documents (photos of past vaccination records).
3. Submit all records at once.

You can also access this later from your pet's Health tab.

### 5.5 Viewing Litters & Breeding History

1. Open your pet's profile and go to the **History** tab, or navigate to the **Litters** screen.
2. View summary statistics:
   - **Total Litters**
   - **Total Pups/Kittens**
   - **Alive Count**
3. Tap on a litter card to see full details:
   - **Overview** — Parent information, breeding date, milestone timeline.
   - **Offspring** — Individual offspring cards with allocation status (Assigned, Transferred, Unassigned).
   - **Health** — Health records for the litter.

---

## 6. Finding Breeding Matches

### 6.1 The Home Screen (Breeder)

When in Breeder mode, the Home screen displays:

- **Greeting Header** — A personalized greeting with a search icon and subscription badge.
- **Top Matches** — A swipeable card stack showing the best-matched pets based on your pet's profile and preferences. Each card displays:
  - Pet photo
  - Pet name and breed
  - Compatibility percentage score
- **Nearby Pets** — A horizontally scrollable list of pets in your area.
- **Shooters** — A horizontally scrollable list of available shooters.
- **Browse Tabs** — Toggle between a full "Pets" list and "Shooters" list.

### 6.2 Swiping Through Matches

On both the Home screen and the dedicated **Match** tab (center navigation button):

- **Swipe Right** or tap the **♥ (Heart)** button to **send a match request** to this pet.
- **Swipe Left** or tap the **✕ (X)** button to **pass** on this pet. Passed pets will not be shown again.

> **Important:** Only pets of the same species and opposite sex will be shown. Your own pets are excluded from results.

### 6.3 Viewing a Pet's Public Profile

Tap on any pet card (from Home, Search, or Matches) to view the full public pet profile with 5 tabs:

- **About** — Species, breed, age, weight, height, description, and behavior/attribute tags.
- **Health** — Vaccination status and health certification.
- **Gallery** — Photo gallery.
- **Litters** — Previous breeding/litter history.
- **Compatibility** — A detailed compatibility score between this pet and your currently selected pet, with a trait-by-trait breakdown.

A **"Send Match Request"** button appears at the bottom of the profile.

### 6.4 Checking Compatibility

On a pet's public profile, switch to the **Compatibility** tab to see:

- **Overall compatibility score** (percentage).
- **Trait-by-trait breakdown** — The algorithm evaluates breed compatibility, health status, age, location proximity, behavior matching, and your stated preferences.

### 6.5 AI Offspring Prediction

1. From a pet's public profile (or from your pet's compatibility view), tap **AI Offspring Prediction**.
2. The screen shows both parent pets side by side with the compatibility score.
3. Tap **Generate Prediction** to create an AI-generated image of what offspring might look like.
4. View predicted traits:
   - Breed mix
   - Coat type
   - Size estimate
   - Temperament predictions

> **Note:** The number of AI generations per day is limited based on your subscription tier (1/day for Free, more for paid plans).

### 6.6 Searching for Pets, Breeders & Shooters

1. Tap the **search icon** on the Home screen, or navigate to the **Search** screen.
2. Type your search query in the search bar (results appear after a brief delay).
3. Filter by category: **All**, **Pets**, **Breeders**, or **Shooters**.
4. For Pets, further filter by:
   - **Species**: Dog or Cat
   - **Sex**: Male or Female
5. Tap on a result to navigate to the respective profile:
   - **Pet** → Pet public profile
   - **Breeder** → Breeder profile (shows their stats, pets, verification status)
   - **Shooter** → Shooter profile (shows their experience, stats, credentials)

Your recent searches are saved and can be cleared.

---

## 7. Match Requests

### 7.1 Sending a Match Request

There are several ways to send a match request:

- **Swipe right** on a match card on the Home or Match screen.
- Tap the **♥ (Heart)** button on a match card.
- Tap **"Send Match Request"** on a pet's public profile.

> **Requirements:**
>
> - Your identity must be verified.
> - You must have an active pet selected.
> - Free tier users may need to make a per-request payment via PayMongo.

### 7.2 Managing Incoming Requests

1. Go to the **Matches** tab.
2. Tap the **Requests** section.
3. Under **Incoming**, you will see requests from other breeders. Each card shows:
   - Pet photo, name, and breed.
   - Distance from your location.
   - Compatibility score.
4. Tap **♥** to **accept** the request — a conversation will be created automatically, and you can start chatting.
5. Tap **✕** to **decline** the request.

### 7.3 Managing Outgoing Requests

In the same **Requests** section:

1. Under **Outgoing**, you will see requests you have sent.
2. Tap **Cancel** to withdraw a pending request.

### 7.4 Match History

1. In the **Matches** tab, tap the **History** section.
2. Filter by: **All**, **Declined**, or **Cancelled**.
3. Browse previous match requests with pagination.

---

## 8. Chat & Messaging

### 8.1 Starting a Conversation

After a match request is accepted:

1. Tap **"Start Chat"** on the matched pair in the **Matches** tab, or
2. The conversation will appear in the **Activity** tab notifications — tap to open.

### 8.2 Sending Messages

The conversation screen provides:

- **Real-time messaging** — Messages refresh automatically every 5 seconds.
- **Message bubbles** — Your messages appear on the right (blue), the other party's on the left.
- **Timestamps** — Shown on each message.
- **Read receipts** — Double check marks (✓✓) indicate the other party has read your message.
- **Date headers** — Messages are grouped by date for easy navigation.
- **Match information** — At the top of the chat, you can see the matched pet and the other breeder's information. If a shooter is assigned, their information is also displayed.
- **Contract card** — If a contract exists, a compact contract status card appears in the chat header. Tap it to view the full contract.
- **Match timeline** — Shows the progress of the breeding match.

### 8.3 Blocking & Reporting Users

If you need to block or report a user:

1. Tap the **shield icon** (🛡️) in the chat header.
2. Choose an action:
   - **Block User** — Prevents further communication. You can unblock later from settings.
   - **Report User** — Select a reason for the report and submit it for admin review.

---

## 9. Breeding Contracts

### 9.1 Creating a Contract

Once a match is established, either party can create a breeding contract:

1. In the conversation screen, tap the **"Create Contract"** button (appears when no contract exists).
2. Complete the 5-step contract wizard:

#### Step 1 — Compensation Type

Select one or more compensation types:

- **💰 Money** — Monetary payment in Philippine Peso (₱).
- **🐾 Share Offspring** — Share puppies/kittens from the litter.
- **📦 Goods / Foods** — Non-monetary compensation.

#### Step 2 — Compensation Details

Based on your selections in Step 1:

- **Money**: Enter the payment amount (₱).
- **Offspring Sharing**: Choose the split method:
  - _Percentage-based_ — Each party gets a percentage of the litter.
  - _Fixed number_ — Each party gets a set number of offspring.
  - _Alternating selection_ — Parties take turns choosing offspring.
  - Enter the value, and select who picks first.
- **Goods/Foods**: Describe the items.

#### Step 3 — Shooter (Optional)

If you want to assign a breeding handler:

- Enter the **shooter's name** or search for one.
- Enter the **shooter payment amount** (₱).
- Provide a **location description** for the breeding.
- Add any **special conditions**.

#### Step 4 — Collateral & Timeline

- **Security Deposit**: Set the total collateral amount. This is split 50/50 between both parties and held in the money pool as escrow.
- **Contract End Date**: Set the deadline for the contract.

#### Step 5 — Review & Submit

- Review the full contract summary.
- Tap **Submit** to send the contract for the other party's review.

### 9.2 Reviewing & Accepting a Contract

When you receive a contract from the other party:

1. Open the conversation and tap the **contract card**.
2. Review all terms carefully on the contract detail screen.
3. Tap **Accept** to agree to the terms, or **Reject** to decline.
4. If accepted, both parties will be prompted to pay their share of the collateral.

### 9.3 Contract Lifecycle

A breeding contract follows these stages:

| Stage                   | Description                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| **1. Create Contract**  | One party drafts the contract terms.                                                               |
| **2. Accept Contract**  | The other party reviews and accepts (or rejects).                                                  |
| **3. Pay Collateral**   | Both parties pay their 50% share of the collateral via PayMongo. Funds are held in the money pool. |
| **4. Submit Reports**   | Both parties can submit breeding progress reports.                                                 |
| **5. Mark Breeding**    | When breeding occurs, mark it as complete.                                                         |
| **6. Record Offspring** | Record the resulting litter — number of offspring, health status.                                  |
| **7. Complete Match**   | Finalize the contract. Collateral and compensation are released from the money pool.               |

**Contract Statuses:**

| Status              | Meaning                                           |
| ------------------- | ------------------------------------------------- |
| `Draft`             | Contract is being created.                        |
| `Pending`           | Waiting for the other party to review.            |
| `Accepted`          | Both parties agree — awaiting collateral payment. |
| `Shooter Requested` | A shooter has been invited to the contract.       |
| `Shooter Accepted`  | The shooter has accepted the assignment.          |
| `In Progress`       | Breeding activities are underway.                 |
| `Breeding Complete` | Breeding has been confirmed.                      |
| `Completed`         | Contract is finalized and closed.                 |
| `Rejected`          | The contract was rejected by one party.           |
| `Cancelled`         | The contract was cancelled.                       |

### 9.4 Contract Detail Tabs

The contract detail screen has 5 tabs:

1. **Overview** — Full contract terms, compensation details, timeline, and status. Animated "Next Action" banner guides you through the next required step.
2. **Payments** — Track collateral payments, compensation transactions, and shooter payments.
3. **Reports** — Submit and view breeding progress reports from both parties.
4. **Breeding** — Log breeding events and mark breeding as complete.
5. **Offspring** — Record litter details, individual offspring information, and allocation.

---

## 10. Shooter Workflow

### 10.1 Shooter Home Dashboard

Switch to **Shooter** role (see [Section 4.2](#42-switching-roles-breeder--shooter)) to access the Shooter Home, which shows:

- **Stats Banner**:
  - Active assignments
  - Pending requests
  - Completed assignments
  - Available offers
  - Breakdown of pets handled (dogs vs. cats)

- **Three Tabs**:
  - **Current** — Active and pending assignments. Each card shows both pets, payment (₱), location, and breeding status.
  - **Available** — Open offers from breeders that you can accept.
  - **Finished** — Completed or failed assignments with outcome badges.

### 10.2 Browsing Available Offers

1. In the Shooter Home, tap the **Available** tab.
2. Browse open offers, each showing:
   - Both pets (photos, names, breeds)
   - Payment amount (₱)
   - Location
3. Tap on an offer to view the **Offer Details** screen.

### 10.3 Accepting a Shooter Offer

On the **Offer Details** screen:

1. Review both pets (photos, species, sex, breed).
2. Review the payment amount and any conditions.
3. Tap **"Accept Offer"** — Your status changes to "accepted_by_shooter" and the breeders will be notified for confirmation.

### 10.4 Active Assignments

Once confirmed:

1. Active assignments appear under the **Current** tab.
2. Tap an assignment to join the **conversation** between both breeders.
3. Assist with breeding logistics, submit reports, and help coordinate the breeding.
4. Upon successful completion, your payment is processed through the money pool.

---

## 11. Subscriptions & Payments

### 11.1 Subscription Plans

PawLink offers the following plans:

| Feature                          | Free | Standard         | Premium          |
| -------------------------------- | ---- | ---------------- | ---------------- |
| **Registered Pets**              | 1    | More             | Unlimited        |
| **Matches per Month**            | 3    | More             | Unlimited        |
| **AI Offspring Predictions/Day** | 1    | More             | Unlimited        |
| **Billing**                      | —    | Monthly / Yearly | Monthly / Yearly |

> Paid plans are available with monthly and yearly billing cycles. Yearly plans include a savings discount.

### 11.2 Upgrading Your Plan

1. Go to **Profile > Settings > Subscription**, or tap the **subscription badge** on the Home screen.
2. Browse available plans displayed as carousel cards with gradient designs.
3. Toggle between **Monthly** and **Yearly** billing to compare prices.
4. Tap **Subscribe** on your chosen plan.
5. You will be redirected to **PayMongo** to complete the payment.
6. After payment:
   - **Success** — You'll be redirected back to PawLink with a confirmation screen. Your new plan is active immediately.
   - **Cancelled** — You'll see a cancellation notice and return to the app.

### 11.3 My Payments & Money Pool

Access via **Profile > Settings > My Payments**.

**Money Pool Balance:**

PawLink uses a virtual escrow-style **Money Pool** to securely manage breeding contract finances. Your balance shows:

| Type                 | Description                                            |
| -------------------- | ------------------------------------------------------ |
| **Held**             | Funds currently held in escrow for active contracts.   |
| **Frozen**           | Funds frozen due to a pending dispute or admin action. |
| **Pending Deposits** | Collateral payments that are still processing.         |
| **Total Released**   | Total amount released to you from completed contracts. |

**Transaction Tabs:**

- **Deposits** — Your collateral payments and contributions to the pool.
- **Releases** — Funds released to you upon contract completion.
- **Refunds** — Refunded amounts from cancelled contracts.
- **Fee Deductions** — Platform fees and cancellation charges.

Amounts are color-coded:

- 🟢 Green — Earnings / Money received
- 🟠 Orange — Credits / Pending amounts
- 🔴 Red — Debits / Deductions

### 11.4 Filing a Dispute

If there is a disagreement regarding a contract payment:

1. Navigate to **My Payments > Disputes**.
2. Tap **File Dispute**.
3. Provide details about the issue.
4. Submit for admin review.
5. Track the status of your dispute in the Disputes tab.

---

## 12. Activity & Notifications

The **Activity** tab (🔔) serves as your unified notification center.

**Filter Chips** — Filter notifications by category:

- **All** — View all notifications.
- **Verification** — Updates on your document verification status.
- **Matches** — Match request updates (new requests, acceptances, declines).
- **Messages** — New chat messages.
- **Shooter** — Shooter offer and assignment notifications.
- **Subscription** — Plan changes and payment confirmations.
- **System** — General announcements and system alerts.

**Verification Notifications** are grouped by severity:

- ⚠️ **Warnings** — Documents expiring soon.
- 🔴 **Rejected / Needs Attention** — Documents rejected with reasons; tap **Resubmit** to fix.
- 🟡 **Under Review** — Documents submitted and pending.
- 🟢 **Approved** — Documents verified and valid.

**Actions:**

- Tap **"Mark All as Read"** to clear all unread indicators.
- Tap any notification to navigate directly to the relevant screen (conversation, matches, subscription, etc.).

---

## 13. Profile & Settings

### 13.1 Viewing Your Profile

Go to the **Profile** tab to see:

- **Profile header** — Your photo, name, and verification status badge.
- **Role switcher** — Toggle between Breeder and Shooter (if both roles are active).
- **Three sub-tabs**:
  - **Dashboard** — Key statistics:
    - Current Breeding arrangements
    - Total Matches
    - Success Rate
    - Income (₱)
  - **My Pets** — Grid of your registered pets with status badges. Tap the **"+"** button to add a new pet.
  - **Settings** — Quick access to settings options.

### 13.2 Editing Your Profile

1. Go to **Profile > Settings > Account**, or tap your profile header.
2. On the **Edit Profile** screen you can update:
   - **First Name**
   - **Last Name**
   - **Contact Number**
   - **Birthdate**
   - **Sex**
   - **Profile Image** — Tap to take a new photo or select from gallery.
3. Your email is displayed but **cannot be changed**.
4. Tap **Save** to apply changes.

### 13.3 Privacy & Security

Go to **Profile > Settings > Privacy & Security** for:

#### Change Password

1. Enter your **current password**.
2. Enter your **new password** (same requirements as registration: 8+ chars, uppercase, number, special char).
3. Confirm the new password.
4. Tap **Update Password**.

#### Delete Account

1. Tap **Delete Account**.
2. Type **"DELETE"** in the confirmation field.
3. Enter your **password** to confirm.
4. Tap **Confirm** — This action is **permanent and cannot be undone**. All your data, pets, matches, and contracts will be deleted.

### 13.4 Signing Out

1. Go to **Profile > Settings**.
2. Tap **Sign Out**.
3. Confirm to log out. You will be returned to the login screen.

---

## 14. Troubleshooting & FAQ

### Q: I can't add a pet. What do I do?

**A:** You must complete identity verification first. Go to **Settings > Verification Status** and ensure your government ID is verified (✅).

### Q: My verification document was rejected. What now?

**A:** Go to **Settings > Verification Status**, check the rejection reason, and tap **Resubmit** to upload a corrected document.

### Q: I can't see any pets to match with.

**A:** Make sure you have a pet registered and selected. Matches only show pets of the same species and opposite sex. If your area is low-activity, try the Search feature.

### Q: I was charged but my subscription didn't activate.

**A:** Return to the app and go to **Settings > Subscription**. The app checks for payment confirmation when you return. If the issue persists, contact support.

### Q: My match card says "Pending Shooter Request." What does this mean?

**A:** A shooter (breeding handler) has been invited but hasn't accepted yet. Wait for them to respond.

### Q: I accidentally passed on a pet. Can I undo it?

**A:** No, passed pets are not shown again. You may find the same pet using the Search feature and send a match request from their profile.

### Q: My account is suspended or banned. What can I do?

**A:** A banned screen will appear showing the reason and (for suspensions) the end date. You can contact support at **pawlink.support@gmail.com** or tap the **Contact Support** button.

### Q: How do I switch between Breeder and Shooter mode?

**A:** Go to the Profile tab and tap the role switcher toggle at the top.

### Q: How does the money pool work?

**A:** The money pool is a virtual escrow that holds collateral and compensation payments during breeding contracts. Funds are released to the appropriate parties upon contract completion, or refunded if the contract is cancelled. Disputes are reviewed by the admin team.

### Q: How many pets can I register?

**A:** Free plan: 1 pet. Paid plans allow more pets. Check the Subscription screen for plan details.

---

## 15. Contact & Support

If you need assistance, have questions, or want to report an issue:

- **Email:** pawlink.support@gmail.com
- **In-App:** Use the Report feature in any conversation to flag concerns.

---

_PawLink — Connecting Responsible Pet Breeders_

_© 2026 KHAT Development Team. All rights reserved._
