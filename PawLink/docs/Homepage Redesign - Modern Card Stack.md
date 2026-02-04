# PawLink Homepage Redesign - Modern Card Stack

**Version:** 2.0 Concept  
**Date:** January 27, 2026  
**Style:** Modern Card Stack (Tinder-inspired)

---

## Design Philosophy

**Core Principles:**
1. **Focus on matches first** - The primary value of PawLink is finding compatible breeding partners
2. **Reduce cognitive load** - One primary action at a time
3. **Delight with motion** - Smooth animations for card interactions
4. **Clean, airy feel** - White backgrounds with strategic color pops

---

## Visual Mockup Description

### Screen Layout (Top to Bottom)

```
┌─────────────────────────────────────┐
│  ◉ PawLink        🔔  ⚙️  │ ← Minimal Header (40px)
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  [Selected Pet Avatar]      │   │ ← Active Pet Pill (48px)
│  │  Finding matches for: Max   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ╔═══════════════════════════════╗ │
│  ║                               ║ │
│  ║   [LARGE MATCH CARD STACK]   ║ │ ← Hero Section (280px)
│  ║                               ║ │
│  ║   🐕 Bella - 94% Match       ║ │
│  ║   Golden Retriever, Female   ║ │
│  ║                               ║ │
│  ║   [❌]        [💬]      [✓]  ║ │ ← Action Buttons
│  ╚═══════════════════════════════╝ │
│                                     │
│  ─────── Nearby Pets ─────────     │ ← Section Divider
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ →    │ ← Horizontal Scroll
│  │Pet │ │Pet │ │Pet │ │Pet │       │   (120x160px cards)
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │       │
│  └────┘ └────┘ └────┘ └────┘       │
│                                     │
│  ─────── Shooters ─────────        │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ →    │ ← Horizontal Scroll
│  │Shot│ │Shot│ │Shot│ │Shot│       │
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │       │
│  └────┘ └────┘ └────┘ └────┘       │
│                                     │
└─────────────────────────────────────┘
     [🏠]    [💬]    [➕]    [🐾]    [👤]  ← Tab Bar
```

---

## Component Specifications

### 1. Minimal Header

**Changes from Current:**
- Reduce height from ~150px to 56px
- Remove search bar (move to dedicated search screen)
- Remove filter button (move to match card settings)
- Use safe area insets properly

```
Current:  [PAWLINK]  [Sub] [Notif]
          [==== Search ====] [Filter]

Proposed: [◉ Logo]           [🔔] [⚙️]
```

**Specs:**
- Height: 56px (plus safe area)
- Logo: 24px icon + "PawLink" text (18px, medium weight)
- Icons: 24px, subtle gray (#6B7280) until active

---

### 2. Active Pet Pill

**Purpose:** Always show which pet the user is browsing for

**Specs:**
- Height: 48px
- Background: White with subtle shadow
- Left: Pet avatar (36px circle)
- Center: "Finding matches for: [Pet Name]"
- Right: Chevron (tap to change pet)
- Sticky behavior: Scrolls with content initially, then sticks at top

---

### 3. Hero Match Card Stack (THE STAR)

**Concept:** Stacked cards like Tinder, but for pets

**Card Specs:**
- Size: Full width minus 32px padding, 280px height
- Border radius: 24px
- Background: Large pet photo with gradient overlay at bottom
- Stacking: 3 cards visible (current + 2 behind, scaled down)

**Card Content:**
```
┌─────────────────────────────────────┐
│                                     │
│         [Full Photo Area]           │
│                                     │
│                        [AI Badge]   │ ← "94% Match" pill
│  ───────────────────────────────   │
│  🐕 Bella                          │
│  Golden Retriever · Female · 2yrs  │
│  📍 2.3 km away                    │
└─────────────────────────────────────┘
```

**Action Buttons Below Card:**
- ❌ Pass (gray circle, 56px)
- 💬 Message (primary color, 48px)
- ✓ Like (green circle, 56px)

**Interactions:**
- Swipe right = Like
- Swipe left = Pass
- Tap card = View full profile
- Swipe up = Super like (optional)

---

### 4. Horizontal Pet Scroll

**Purpose:** Browse more pets without commitment

**Specs:**
- Section title: "Nearby Pets" with "See All →" link
- Card size: 120px wide × 160px tall
- Card content:
  - Photo (120 × 100px)
  - Name (bold, 14px)
  - Breed (muted, 12px)
  - Sex icon (♂/♀ colored pill)
- Horizontal scroll with snap-to-card
- Show 2.5 cards at a time (peek effect)

---

### 5. Horizontal Shooter Scroll

**Same specs as pet scroll but for shooters:**
- Profile photo
- Name
- "X years experience" badge
- Rating stars (if applicable)

---

### 6. Floating Action Button (FAB)

**Purpose:** Primary action - Add new pet

**Specs:**
- Position: Bottom right, 16px from edges
- Size: 56px circle
- Icon: Plus sign (24px)
- Color: Primary gradient
- Shadow: Medium elevation
- Animation: Scale up on press, pulse when no pets registered

---

## Color Palette Update

**Move away from heavy coral, embrace neutral base:**

| Role | Current | Proposed |
|------|---------|----------|
| Background | `#FFE0D8` (peach) | `#FAFAFA` (off-white) |
| Cards | `#FFFFFF` | `#FFFFFF` |
| Primary | `#FF6B4A` | `#FF6B4A` (keep) |
| Secondary | N/A | `#F3F4F6` (gray-100) |
| Match highlight | `#F9DCDC` (heavy pink) | `#FFF1F0` (subtle blush) |
| Text primary | `#333333` | `#111827` (gray-900) |
| Text muted | `#888888` | `#6B7280` (gray-500) |

---

## Animation Specifications

### Card Stack Animations

1. **Card Swipe:**
   - Duration: 300ms
   - Easing: `Easing.out(Easing.cubic)`
   - Translation: 500px in swipe direction
   - Rotation: 15° in swipe direction
   - Next card scales from 0.95 → 1.0

2. **Card Appear:**
   - Duration: 200ms
   - Easing: Spring (tension: 100, friction: 10)
   - Scale: 0.8 → 1.0
   - Opacity: 0 → 1

3. **Like Button Press:**
   - Haptic: Impact (medium)
   - Scale: 1.0 → 0.9 → 1.1 → 1.0
   - Color: Gray → Green (simultaneous)

---

## Empty States

### No Matches Yet

```
┌─────────────────────────────────────┐
│                                     │
│           [Illustration]            │
│           🐕 💔 🐕                   │
│                                     │
│     No matches yet for Max         │
│                                     │
│   We're finding the perfect        │
│   partner. Check back soon!        │
│                                     │
│   [ Adjust Preferences ]           │
│                                     │
└─────────────────────────────────────┘
```

### No Pet Selected

```
┌─────────────────────────────────────┐
│                                     │
│           [Illustration]            │
│             🐾 ➕                    │
│                                     │
│   Add your first pet to start      │
│   finding matches!                 │
│                                     │
│   [ Add Pet Now ]  (Primary CTA)   │
│                                     │
└─────────────────────────────────────┘
```

---

## Component Hierarchy

```
Homepage/
├── MinimalHeader
│   ├── Logo
│   ├── NotificationBell (with badge)
│   └── SettingsIcon
├── ActivePetPill
│   ├── PetAvatar
│   ├── PetNameLabel
│   └── ChangePetChevron
├── MatchCardStack (HERO)
│   ├── MatchCard (current)
│   ├── MatchCard (next, scaled)
│   ├── MatchCard (third, scaled more)
│   └── ActionButtons
│       ├── PassButton
│       ├── MessageButton
│       └── LikeButton
├── NearbyPetsSection
│   ├── SectionHeader ("Nearby Pets", "See All")
│   └── HorizontalPetScroll
│       └── PetMiniCard[]
├── ShootersSection
│   ├── SectionHeader ("Shooters", "See All")
│   └── HorizontalShooterScroll
│       └── ShooterMiniCard[]
└── FloatingAddButton
```

---

## Implementation Priority

### Phase 1: Structure (2-3 days)
1. Create `MinimalHeader` component
2. Create `ActivePetPill` component
3. Replace grid with horizontal scroll sections
4. Add FAB for add pet

### Phase 2: Card Stack (3-4 days)
1. Create `MatchCard` component
2. Implement swipe gestures with `react-native-gesture-handler`
3. Add stack animation with `react-native-reanimated`
4. Connect to match API

### Phase 3: Polish (1-2 days)
1. Add haptic feedback
2. Implement empty states
3. Add skeleton loaders
4. Performance optimization

---

## Libraries Needed

| Library | Purpose | Already Installed? |
|---------|---------|-------------------|
| `react-native-gesture-handler` | Swipe gestures | ✅ Yes |
| `react-native-reanimated` | Smooth animations | ✅ Yes |
| `expo-haptics` | Haptic feedback | ❓ Check |
| `react-native-safe-area-context` | Safe area | ✅ Yes |

---

## Comparison: Before vs After

| Aspect | Current | Proposed |
|--------|---------|----------|
| Header height | ~150px | 56px |
| Primary focus | Banner carousel | Match card stack |
| Pet browsing | 2-column grid (slow) | Horizontal scroll (fast) |
| Add pet action | Hidden in alert | FAB always visible |
| Background | Peach (#FFE0D8) | Clean white (#FAFAFA) |
| Engagement | Passive scrolling | Active swiping |
| Matches UX | Small section | Hero placement |

---

## Next Steps

1. **Get approval** on this design direction
2. **Create component stubs** for new layout
3. **Migrate incrementally** - don't break existing functionality
4. **A/B test** if possible to measure engagement

---

## Appendix: Inspiration References

- **Tinder**: Card stack interaction pattern
- **Bumble BFF**: Horizontal browse for secondary content
- **Rover**: Pet service app clean aesthetic
- **Hinge**: Prompt-based matching UI elements
