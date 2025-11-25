# Quick Start Guide - Testing Shooter Feature

## How to Test the Shooter Homepage

### Step 1: Start the App

The app should already be running. If not:

```bash
cd PawLink
npx expo start -c
```

### Step 2: Switch to Shooter Role

1. **Open the app** on your device/emulator
2. **Navigate to the Profile tab** (bottom navigation, rightmost icon with person)
3. **Look for the role dropdown** in the top-right corner of the profile screen
   - You'll see a button with your current role (e.g., "Pet Owner ▼")
   - The button has a coral/orange background (`#FF6B4A`)
4. **Tap the role dropdown button**
   - A small menu will appear below the button
5. **Select "Shooter"** from the dropdown
   - The menu will close
   - Your role is now switched to Shooter

### Step 3: View the Shooter Homepage

1. **Navigate back to the Home tab** (bottom navigation, leftmost icon with house)
2. **You should now see:**
   - The same header with "PAWLINK" logo
   - A pink banner saying "Currently breeding handling" with a paw icon
   - Text showing "You have 4 active breeding pairs"
   - A grid of breeding pair cards showing:
     - Two pet images side by side
     - Pet names (e.g., "May23 & Marie 23")
     - Owner names with a heart icon
     - Fee amount with a money icon
     - Location with a pin icon

### Step 4: Switch Back to Pet Owner

1. **Go back to the Profile tab**
2. **Tap the role dropdown** (now showing "Shooter ▼")
3. **Select "Pet Owner"**
4. **Return to the Home tab**
   - You should see the regular pet owner homepage with:
     - Search bar
     - Banner carousel
     - "Perfect Match Found!" section
     - Tabs for "PETS" and "SHOOTERS"

## Visual Confirmation

### Shooter Homepage Should Show:

```
┌─────────────────────────────────────┐
│ PAWLINK              [🔔] [⚙️]      │
│ [Search bar]         [Settings]     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🐾  Currently breeding handling     │
│     You have 4 active breeding pairs│
└─────────────────────────────────────┘

Active Breeding Pairs

┌────────────┐  ┌────────────┐
│ [Pet][Pet] │  │ [Pet][Pet] │
│ 🐾 Names   │  │ 🐾 Names   │
│ ❤️  Owners │  │ ❤️  Owners │
│ 💰 ₱2,000  │  │ 💰 ₱3,000  │
│ 📍 Location│  │ 📍 Location│
└────────────┘  └────────────┘

┌────────────┐  ┌────────────┐
│ [Pet][Pet] │  │ [Pet][Pet] │
│ ...        │  │ ...        │
└────────────┘  └────────────┘
```

### Profile Page Role Switcher:

```
Top-right corner:
┌──────────────────┐
│ Pet Owner ▼      │  ← Tap this
└──────────────────┘
       ↓
┌──────────────────┐
│ Pet Owner ▼      │
├──────────────────┤
│ Shooter          │  ← Menu appears
└──────────────────┘
```

## Troubleshooting

### Issue: Role dropdown not visible

- Make sure you're on the Profile tab
- Look in the top-right corner, next to your profile picture
- The button should be orange with white text

### Issue: Homepage doesn't change after switching role

- Make sure you switched roles in the Profile tab first
- Navigate back to the Home tab to see the change
- Try switching back and forth between tabs

### Issue: Mock data not showing

- Check the console for any errors
- Ensure the app reloaded after code changes
- Try clearing the Expo cache: `npx expo start -c`

### Issue: Images not loading

- This is expected! Mock data uses placeholder images
- You'll see default pet icons or empty image placeholders
- Real images will load once backend is connected

## What You Should See (Mock Data)

Currently displays 4 breeding pairs:

1. **May23 & Marie 23**

   - Owners: Copper & Luna
   - Fee: ₱2,000
   - Location: Zamboanga City

2. **hns33 & jokee3**

   - Owners: Puppy & Cloud
   - Fee: ₱3,000
   - Location: Zamboanga City

3. **May23 & Marie 23**

   - Owners: Copper & Ling
   - Fee: ₱2,000
   - Location: Zamboanga City

4. **May23 & Marie 23**
   - Owners: Copper & Ling
   - Fee: ₱2,000
   - Location: Zamboanga City

## Expected Behavior

- ✅ Role switcher works in Profile tab
- ✅ Homepage changes based on selected role
- ✅ Shooter homepage shows breeding pairs
- ✅ Pet owner homepage shows pets and shooters
- ✅ Switching between roles is instant
- ✅ State persists within the session

## Not Yet Implemented (Awaiting Backend)

- ❌ Clicking on breeding pair cards (no detail page yet)
- ❌ Real pet images (using placeholders)
- ❌ Real data from API (using mock data)
- ❌ Actual breeding pair count (hardcoded to 4)
- ❌ Filtering or searching breeding pairs
- ❌ Updating breeding status
- ❌ Adding progress updates

## Next Steps

Once you've verified the UI works:

1. Backend developer can implement the API endpoints
2. Replace mock data in `shooter-index.tsx` with API calls
3. Implement breeding pair detail page
4. Add ability to update breeding status
5. Add progress update functionality

## Questions or Issues?

Check these files:

- `PawLink/app/(tabs)/shooter-index.tsx` - Shooter homepage
- `PawLink/app/(tabs)/index.tsx` - Main homepage with role logic
- `PawLink/app/(tabs)/profile.tsx` - Profile with role switcher
- `SHOOTER_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `SHOOTER_BACKEND_API.md` - Backend API requirements
