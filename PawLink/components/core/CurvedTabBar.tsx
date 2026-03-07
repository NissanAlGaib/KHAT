import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Dimensions,
  Text,
  Image,
  StyleSheet,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { Home, Heart, PawPrint, Bell, User } from "lucide-react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import PetSelectionModal from "./PetSelectionModal";
import QuickSelectRadial, {
  getRadialPositions,
  RADIAL_HIT_RADIUS,
} from "./QuickSelectRadial";
import { Colors, FontFamily, FontSize, Spacing, Shadows } from "@/constants";
import { useRole } from "@/context/RoleContext";
import { usePet } from "@/context/PetContext";
import { getPendingShooterRequestsCount } from "@/services/contractService";
import { getActivityUnreadCount } from "@/services/activityService";
import { getStorageUrl } from "@/utils/imageUrl";

const { width } = Dimensions.get("window");
const TAB_BAR_WIDTH = width * 0.9;
const TAB_BAR_HEIGHT = 60;
const CENTER_CIRCLE_SIZE = 65;
const CENTER_CUTOUT_RADIUS = 45;

export default function CurvedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const router = useRouter();
  const current = state.index;
  const [showPetModal, setShowPetModal] = useState(false);
  const { role } = useRole();
  const { selectedPet, userPets, setSelectedPet, pinnedPetIds } = usePet();
  const [pendingShooterRequestsCount, setPendingShooterRequestsCount] =
    useState(0);
  const [activityUnreadCount, setActivityUnreadCount] = useState(0);
  const [showQuickSelect, setShowQuickSelect] = useState(false);

  // Check if user is in Shooter mode
  const isShooterMode = role === "Shooter";

  // --- Animated shared values ---
  const buttonScale = useSharedValue(1);
  const swipeTranslateX = useSharedValue(0);
  const photoOpacity = useSharedValue(1);
  const radialProgress = useSharedValue(0);
  const radialHoveredIndex = useSharedValue(-1);
  const isRadialActive = useSharedValue(false); // worklet-accessible flag

  // Get selected pet's photo URL
  const getSelectedPetPhoto = () => {
    if (!selectedPet) return null;
    const primaryPhoto = selectedPet.photos?.find((p) => p.is_primary);
    return getStorageUrl(primaryPhoto?.photo_url);
  };

  const petPhotoUrl = getSelectedPetPhoto();

  // Get available (non-cooldown, active) pets for swipe cycling
  const availablePets = useMemo(
    () => userPets.filter((p) => p.status === "active" && !p.is_on_cooldown),
    [userPets],
  );

  // --- Swipe to cycle pets ---
  const selectNextPet = useCallback(() => {
    if (availablePets.length <= 1) return;
    const currentIndex = availablePets.findIndex(
      (p) => p.pet_id === selectedPet?.pet_id,
    );
    const nextIndex =
      currentIndex === -1 || currentIndex >= availablePets.length - 1
        ? 0
        : currentIndex + 1;
    setSelectedPet(availablePets[nextIndex]);
  }, [availablePets, selectedPet, setSelectedPet]);

  const selectPrevPet = useCallback(() => {
    if (availablePets.length <= 1) return;
    const currentIndex = availablePets.findIndex(
      (p) => p.pet_id === selectedPet?.pet_id,
    );
    const prevIndex =
      currentIndex <= 0 ? availablePets.length - 1 : currentIndex - 1;
    setSelectedPet(availablePets[prevIndex]);
  }, [availablePets, selectedPet, setSelectedPet]);

  const openModal = useCallback(() => {
    setShowPetModal(true);
  }, []);

  // --- Quick Select Radial (long-press) ---
  const pinnedAvailablePets = useMemo(
    () =>
      pinnedPetIds
        .map((id) => userPets.find((p) => p.pet_id === id))
        .filter(
          (p): p is NonNullable<typeof p> =>
            p != null && p.status === "active" && !p.is_on_cooldown,
        )
        .slice(0, 3),
    [pinnedPetIds, userPets],
  );

  const radialPositions = useMemo(
    () => getRadialPositions(pinnedAvailablePets.length),
    [pinnedAvailablePets.length],
  );

  const activateRadial = useCallback(() => {
    if (pinnedAvailablePets.length === 0) return;
    setShowQuickSelect(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [pinnedAvailablePets.length]);

  const selectRadialPet = useCallback(
    (index: number) => {
      if (index >= 0 && index < pinnedAvailablePets.length) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedPet(pinnedAvailablePets[index]);
      }
      setShowQuickSelect(false);
    },
    [pinnedAvailablePets, setSelectedPet],
  );

  const dismissRadial = useCallback(() => {
    setShowQuickSelect(false);
  }, []);

  const hapticTick = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  // Track previously hovered index for haptic on change (JS side)
  const prevHoveredRef = React.useRef(-1);

  const checkHoverAndHaptic = useCallback(
    (index: number) => {
      if (index !== prevHoveredRef.current && index >= 0) {
        hapticTick();
      }
      prevHoveredRef.current = index;
    },
    [hapticTick],
  );

  // Pan gesture for swipe-to-change
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      swipeTranslateX.value = Math.max(-40, Math.min(40, event.translationX));
    })
    .onEnd((event) => {
      if (event.translationX > 30) {
        // Swipe right → previous pet
        photoOpacity.value = withSequence(
          withTiming(0, { duration: 100 }),
          withTiming(1, { duration: 150 }),
        );
        runOnJS(selectPrevPet)();
      } else if (event.translationX < -30) {
        // Swipe left → next pet
        photoOpacity.value = withSequence(
          withTiming(0, { duration: 100 }),
          withTiming(1, { duration: 150 }),
        );
        runOnJS(selectNextPet)();
      }
      swipeTranslateX.value = withSpring(0, { damping: 15, stiffness: 200 });
    });

  // Tap gesture for opening modal
  const tapGesture = Gesture.Tap().onStart(() => {
    // Bouncy press feedback
    buttonScale.value = withSequence(
      withSpring(0.88, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
    runOnJS(openModal)();
  });

  // Long-press gesture for quick select radial
  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      buttonScale.value = withSpring(0.92, { damping: 12, stiffness: 300 });
      radialProgress.value = withTiming(1, { duration: 200 });
      radialHoveredIndex.value = -1;
      isRadialActive.value = true;
      runOnJS(activateRadial)();
    });

  // After long press activates, use a manual gesture to track finger movement
  const radialPanGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown(() => {
      // Will be activated by simultaneous composition
    })
    .onTouchesMove((event, stateManager) => {
      if (isRadialActive.value) {
        stateManager.activate();
      }
    })
    .onUpdate((event) => {
      if (!isRadialActive.value) return;
      // Hit-test against radial positions
      let hitIndex = -1;
      for (let i = 0; i < radialPositions.length; i++) {
        const pos = radialPositions[i];
        const dx = event.translationX - pos.x;
        const dy = event.translationY - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RADIAL_HIT_RADIUS) {
          hitIndex = i;
          break;
        }
      }
      if (hitIndex !== radialHoveredIndex.value) {
        radialHoveredIndex.value = hitIndex;
        if (hitIndex >= 0) {
          runOnJS(checkHoverAndHaptic)(hitIndex);
        }
      }
    })
    .onEnd(() => {
      const idx = radialHoveredIndex.value;
      isRadialActive.value = false;
      radialProgress.value = withTiming(0, { duration: 150 });
      radialHoveredIndex.value = -1;
      buttonScale.value = withSpring(1, { damping: 10, stiffness: 300 });
      runOnJS(selectRadialPet)(idx);
    })
    .onFinalize(() => {
      isRadialActive.value = false;
      radialProgress.value = withTiming(0, { duration: 150 });
      radialHoveredIndex.value = -1;
      buttonScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });

  // Compose gestures:
  // - Long-press + radial pan run simultaneously for drag-to-select
  // - Pan (swipe) and tap are exclusive alternatives
  // - Long-press takes priority over tap
  const longPressWithPan = Gesture.Simultaneous(
    longPressGesture,
    radialPanGesture,
  );
  const composedGesture = Gesture.Race(
    longPressWithPan,
    panGesture,
    tapGesture,
  );

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value },
      { translateX: swipeTranslateX.value },
    ],
  }));

  const animatedPhotoStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
  }));

  // Fetch pending shooter requests count
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!isShooterMode) {
        const count = await getPendingShooterRequestsCount();
        setPendingShooterRequestsCount(count);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isShooterMode]);

  // Fetch activity notification unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const count = await getActivityUnreadCount();
      setActivityUnreadCount(count);
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  type TabRoute =
    | "/(tabs)"
    | "/(tabs)/matches"
    | "/(tabs)/match"
    | "/(tabs)/activity"
    | "/(tabs)/profile";

  const icons: { icon: any; route: TabRoute }[] = [
    { icon: Home, route: "/(tabs)" },
    { icon: Heart, route: "/(tabs)/matches" },
    { icon: PawPrint, route: "/(tabs)/match" },
    { icon: Bell, route: "/(tabs)/activity" },
    { icon: User, route: "/(tabs)/profile" },
  ];

  // SVG path for curved tab bar with or without center cutout
  const createCurvedPath = () => {
    const centerX = TAB_BAR_WIDTH / 2;
    const radius = 25; // corner radius
    const cutoutRadius = CENTER_CUTOUT_RADIUS;

    // If in Shooter mode, use flat top bar without cutout
    if (isShooterMode) {
      return `
        M ${radius} 0
        L ${TAB_BAR_WIDTH - radius} 0
        Q ${TAB_BAR_WIDTH} 0 ${TAB_BAR_WIDTH} ${radius}
        L ${TAB_BAR_WIDTH} ${TAB_BAR_HEIGHT - radius}
        Q ${TAB_BAR_WIDTH} ${TAB_BAR_HEIGHT} ${TAB_BAR_WIDTH - radius} ${TAB_BAR_HEIGHT}
        L ${radius} ${TAB_BAR_HEIGHT}
        Q 0 ${TAB_BAR_HEIGHT} 0 ${TAB_BAR_HEIGHT - radius}
        L 0 ${radius}
        Q 0 0 ${radius} 0
        Z
      `;
    }

    // Default path with center cutout for Breeder mode
    return `
      M ${radius} 0
      L ${centerX - cutoutRadius - 20} 0
      Q ${centerX - cutoutRadius - 10} 0 ${centerX - cutoutRadius} 10
      Q ${centerX - 20} ${cutoutRadius - 15} ${centerX} ${cutoutRadius - 15}
      Q ${centerX + 20} ${cutoutRadius - 15} ${centerX + cutoutRadius} 10
      Q ${centerX + cutoutRadius + 10} 0 ${centerX + cutoutRadius + 20} 0
      L ${TAB_BAR_WIDTH - radius} 0
      Q ${TAB_BAR_WIDTH} 0 ${TAB_BAR_WIDTH} ${radius}
      L ${TAB_BAR_WIDTH} ${TAB_BAR_HEIGHT - radius}
      Q ${TAB_BAR_WIDTH} ${TAB_BAR_HEIGHT} ${TAB_BAR_WIDTH - radius} ${TAB_BAR_HEIGHT}
      L ${radius} ${TAB_BAR_HEIGHT}
      Q 0 ${TAB_BAR_HEIGHT} 0 ${TAB_BAR_HEIGHT - radius}
      L 0 ${radius}
      Q 0 0 ${radius} 0
      Z
    `;
  };

  return (
    <View className="absolute bottom-0 w-full items-center pb-4">
      <View
        style={{
          width: TAB_BAR_WIDTH,
          height: TAB_BAR_HEIGHT + 40,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Curved background with cutout */}
        <Svg
          width={TAB_BAR_WIDTH}
          height={TAB_BAR_HEIGHT}
          style={{ position: "absolute", bottom: 0 }}
        >
          <Path d={createCurvedPath()} fill={Colors.tabBarBg} />
        </Svg>

        {/* Center floating circle button - only show in Pet Owner mode */}
        {!isShooterMode && (
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              style={[
                floatingStyles.container,
                {
                  left: TAB_BAR_WIDTH / 2 - CENTER_CIRCLE_SIZE / 2,
                },
                animatedButtonStyle,
              ]}
            >
              {/* Circle with photo */}
              <View style={floatingStyles.circle}>
                <Animated.View
                  style={[floatingStyles.photoWrapper, animatedPhotoStyle]}
                >
                  {petPhotoUrl ? (
                    <Image
                      source={{ uri: petPhotoUrl }}
                      style={floatingStyles.photo}
                      resizeMode="cover"
                    />
                  ) : (
                    <PawPrint
                      size={32}
                      color={Colors.primary}
                      strokeWidth={2.5}
                    />
                  )}
                </Animated.View>
              </View>

              {/* Pet name label */}
              <Text
                style={floatingStyles.petNameLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedPet?.name ?? "Select"}
              </Text>

              {/* Quick Select Radial (long-press) */}
              {showQuickSelect && (
                <View
                  style={{
                    position: "absolute",
                    top: CENTER_CIRCLE_SIZE / 2,
                    left: CENTER_CIRCLE_SIZE / 2,
                  }}
                >
                  <QuickSelectRadial
                    progress={radialProgress}
                    hoveredIndex={radialHoveredIndex}
                  />
                </View>
              )}
            </Animated.View>
          </GestureDetector>
        )}

        {/* Icons Row */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            width: TAB_BAR_WIDTH,
            height: TAB_BAR_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
            paddingHorizontal: 20,
          }}
        >
          {icons.map((item, index) => {
            // Skip center position (reserved for floating button) in Pet Owner mode
            if (index === 2 && !isShooterMode) {
              return <View key={index} style={{ width: CENTER_CIRCLE_SIZE }} />;
            }

            // Hide the match tab entirely in Shooter mode
            if (index === 2 && isShooterMode) {
              return null;
            }

            const Icon = item.icon;
            const isActive = current === index;

            // Show badge on matches tab (index 1) if there are pending shooter requests
            const showMatchesBadge =
              index === 1 && pendingShooterRequestsCount > 0 && !isShooterMode;

            // Show badge on activity tab (index 3) if there are unread notifications
            const showActivityBadge = index === 3 && activityUnreadCount > 0;

            const badgeCount = showMatchesBadge
              ? pendingShooterRequestsCount
              : showActivityBadge
                ? activityUnreadCount
                : 0;
            const showBadge = showMatchesBadge || showActivityBadge;

            return (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(item.route)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 12,
                }}
              >
                <View style={{ position: "relative" }}>
                  <Icon
                    size={28}
                    color={
                      isActive ? Colors.tabBarActive : Colors.tabBarInactive
                    }
                    strokeWidth={2.5}
                  />
                  {/* Notification badge */}
                  {showBadge && (
                    <View
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -8,
                        backgroundColor: Colors.tabBarBadgeBg,
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 4,
                        borderWidth: 2,
                        borderColor: Colors.tabBarBg,
                      }}
                    >
                      <Text
                        style={{
                          color: Colors.tabBarBadgeText,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      >
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </Text>
                    </View>
                  )}
                </View>
                {/* Active indicator dot */}
                {isActive && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: Colors.primary,
                      marginTop: 4,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Pet Selection Modal */}
      <PetSelectionModal
        visible={showPetModal}
        onClose={() => setShowPetModal(false)}
      />
    </View>
  );
}

const floatingStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: -4,
    alignItems: "center",
    zIndex: 10,
  },
  circle: {
    width: CENTER_CIRCLE_SIZE,
    height: CENTER_CIRCLE_SIZE,
    borderRadius: CENTER_CIRCLE_SIZE / 2,
    backgroundColor: Colors.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3.5,
    borderColor: Colors.primary,
    overflow: "hidden",
    ...Shadows.lg,
  },
  photoWrapper: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: CENTER_CIRCLE_SIZE / 2,
  },
  petNameLabel: {
    marginTop: 2,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mulishBold,
    color: Colors.textSecondary,
    maxWidth: 80,
    textAlign: "center",
  },
});
