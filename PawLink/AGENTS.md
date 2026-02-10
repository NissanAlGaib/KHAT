# PAWLINK FRONTEND

React Native (Expo 54) mobile app with Expo Router, NativeWind (Tailwind), TypeScript.

## STRUCTURE

```
PawLink/
├── app/                    # File-based routing (Expo Router)
│   ├── _layout.tsx         # Root layout - all Context providers wrapped here
│   ├── (auth)/             # Login, register, forgot password
│   ├── (tabs)/             # Main tab screens (index, chat, match, profile, favorites)
│   ├── (verification)/     # Multi-step verification flow + resubmission
│   ├── (chat)/             # Conversation screen
│   ├── (breeder)/[id].tsx  # Breeder profile detail
│   ├── (shooter)/[id].tsx  # Shooter profile detail
│   └── search.tsx          # Global search screen
├── components/             # Domain-organized
│   ├── core/               # AlertModal, CustomButton (generic UI)
│   ├── home/               # PlayfulHeader, MatchCard, MatchCardStack, SectionContainer
│   ├── pet/                # VaccinationCard, AddShotModal, ReadOnlyVaccinationCard
│   ├── chat/               # BlockReportModal, MatchTimeline
│   ├── contracts/          # Contract-related components
│   ├── search/             # SearchResultCard, FilterChips, CategorySection
│   └── verification/       # StepperProgress, DocumentUploader, IdTypeSelector, etc.
├── services/               # One per domain, all use axiosInstance
├── context/                # AuthContext, PetContext, RoleContext, NotificationContext
├── hooks/                  # useAlert, useLoadFonts, useStorageState, useUpdateChecker
├── config/                 # axiosConfig.ts, env.ts
├── constants/              # colors.ts (coral palette), theme.ts
├── types/                  # Pet.ts, User.ts, Contract.ts
└── utils/                  # imageUrl.ts, formDataUtils.ts, apiError.ts
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new screen | `app/` or `app/(group)/` | Follow Expo Router file conventions |
| Add new API call | `services/` | Create function in domain service, use `axiosInstance` |
| Add global state | `context/` | Create provider, wrap in `app/_layout.tsx` |
| Style components | Inline with NativeWind | `className="..."` - Tailwind classes |
| Image from backend | `utils/imageUrl.ts` | `getStorageUrl(path)` for DO Spaces URLs |
| Form with file upload | `utils/formDataUtils.ts` | Multipart handling for images |
| Colors/theme | `constants/colors.ts` | Coral palette: `#FFE0D8` bg, `#FF6B4A` accent |

## CONVENTIONS

- All screens in `app/` get `contentStyle: { backgroundColor: '#FFFFFF' }` on Stack navigators
- Tab navigator gets `sceneStyle: { backgroundColor: '#FFFFFF' }` to prevent black flash
- Dynamic routes use `[id].tsx` bracket syntax
- Service functions return typed responses, throw on error
- Components use `expo-image` (not `Image` from react-native) for performance
- Icons from `lucide-react-native`
- Date handling via `dayjs`

## ANTI-PATTERNS

- **NEVER** use `autoFocus` on TextInput in production (crashes on Android)
- **NEVER** use `FadeIn`/`FadeOut` animations on elements rendered inside Tab navigator (Reanimated v4 + Fabric crash)
- **NEVER** use `Slot` as root navigator - must be `Stack` for proper screen transitions
- Avoid `react-native-web` specific code - app is mobile-only in practice
