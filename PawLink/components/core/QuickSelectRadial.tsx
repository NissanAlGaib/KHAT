import React, { useMemo } from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  SharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, FontFamily, FontSize, Spacing, Shadows } from "@/constants";
import { usePet } from "@/context/PetContext";
import { getStorageUrl } from "@/utils/imageUrl";

const ICON_SIZE = 48;
const ARC_RADIUS = 85;
// Arc angles: left (-135°), center (-90°/straight up), right (-45°)
const ARC_ANGLES_MAP: Record<number, number[]> = {
  1: [-90], // single: straight up
  2: [-120, -60], // two: spread evenly
  3: [-135, -90, -45], // three: full arc
};

interface QuickSelectRadialProps {
  /** 0 = hidden, 1 = fully visible */
  progress: SharedValue<number>;
  /** Shared value tracking which icon (0-based) the finger is over, -1 = none */
  hoveredIndex: SharedValue<number>;
}

export default function QuickSelectRadial({
  progress,
  hoveredIndex,
}: QuickSelectRadialProps) {
  const { userPets, pinnedPetIds } = usePet();

  // Resolve pinned pets (filter to existing + available pets, max 3)
  const pinnedPets = useMemo(() => {
    return pinnedPetIds
      .map((id) => userPets.find((p) => p.pet_id === id))
      .filter(
        (p): p is NonNullable<typeof p> =>
          p != null && p.status === "active" && !p.is_on_cooldown,
      )
      .slice(0, 3);
  }, [pinnedPetIds, userPets]);

  const angles = ARC_ANGLES_MAP[pinnedPets.length] ?? [];

  if (pinnedPets.length === 0) return null;

  return (
    <View style={radialStyles.container} pointerEvents="none">
      {pinnedPets.map((pet, index) => {
        const angleDeg = angles[index] ?? -90;
        const angleRad = (angleDeg * Math.PI) / 180;
        const targetX = Math.cos(angleRad) * ARC_RADIUS;
        const targetY = Math.sin(angleRad) * ARC_RADIUS;

        const primaryPhoto = pet.photos?.find((p: any) => p.is_primary);
        const photoUrl = primaryPhoto?.photo_url;

        return (
          <RadialIcon
            key={pet.pet_id}
            index={index}
            targetX={targetX}
            targetY={targetY}
            photoUrl={photoUrl ? getStorageUrl(photoUrl) : null}
            petName={pet.name}
            progress={progress}
            hoveredIndex={hoveredIndex}
          />
        );
      })}
    </View>
  );
}

interface RadialIconProps {
  index: number;
  targetX: number;
  targetY: number;
  photoUrl: string | null | undefined;
  petName: string;
  progress: SharedValue<number>;
  hoveredIndex: SharedValue<number>;
}

function RadialIcon({
  index,
  targetX,
  targetY,
  photoUrl,
  petName,
  progress,
  hoveredIndex,
}: RadialIconProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.3, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP,
    );
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [0, targetX],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [0, targetY],
      Extrapolation.CLAMP,
    );

    const isHovered = hoveredIndex.value === index;
    const hoverScale = isHovered ? 1.2 : 1;

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale: scale * hoverScale },
      ],
    };
  });

  const hoverRingStyle = useAnimatedStyle(() => {
    const isHovered = hoveredIndex.value === index;
    return {
      borderColor: isHovered ? Colors.primary : Colors.borderLight,
      borderWidth: isHovered ? 3 : 2,
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const isHovered = hoveredIndex.value === index;
    return {
      opacity: isHovered ? 1 : 0,
      transform: [{ translateY: isHovered ? 0 : 4 }],
    };
  });

  return (
    <Animated.View style={[radialStyles.iconWrapper, animatedStyle]}>
      <Animated.View style={[radialStyles.iconCircle, hoverRingStyle]}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={radialStyles.iconPhoto}
            resizeMode="cover"
          />
        ) : (
          <MaterialCommunityIcons name="paw" size={20} color={Colors.primary} />
        )}
      </Animated.View>
      <Animated.View style={[radialStyles.labelContainer, labelStyle]}>
        <Text style={radialStyles.label} numberOfLines={1}>
          {petName}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

/** Calculate the position data for hit-testing from the CurvedTabBar gesture */
export function getRadialPositions(pinnedCount: number) {
  const angles = ARC_ANGLES_MAP[pinnedCount] ?? [];
  return angles.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: Math.cos(rad) * ARC_RADIUS,
      y: Math.sin(rad) * ARC_RADIUS,
    };
  });
}

export const RADIAL_ICON_SIZE = ICON_SIZE;
export const RADIAL_HIT_RADIUS = ICON_SIZE / 2 + 10; // generous hit area

const radialStyles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 0,
    height: 0,
    // Centered on the floating button center
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    position: "absolute",
    alignItems: "center",
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: Colors.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...Shadows.md,
  },
  iconPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: ICON_SIZE / 2,
  },
  labelContainer: {
    position: "absolute",
    top: ICON_SIZE + 4,
    backgroundColor: Colors.textPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 40,
    alignItems: "center",
  },
  label: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mulishBold,
    color: Colors.white,
    textAlign: "center",
    maxWidth: 70,
  },
});
