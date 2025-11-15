import React from "react";
import { View, TouchableOpacity, Dimensions, Platform } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import {
  Home,
  Heart,
  PawPrint,
  MessageCircle,
  User,
} from "lucide-react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

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

  type TabRoute =
    | "/(tabs)"
    | "/(tabs)/favorites"
    | "/(tabs)/match"
    | "/(tabs)/chat"
    | "/(tabs)/profile";

  const icons: { icon: any; route: TabRoute }[] = [
    { icon: Home, route: "/(tabs)" },
    { icon: Heart, route: "/(tabs)/favorites" },
    { icon: PawPrint, route: "/(tabs)/match" },
    { icon: MessageCircle, route: "/(tabs)/chat" },
    { icon: User, route: "/(tabs)/profile" },
  ];

  // SVG path for curved tab bar with center cutout
  const createCurvedPath = () => {
    const centerX = TAB_BAR_WIDTH / 2;
    const radius = 25; // corner radius
    const cutoutRadius = CENTER_CUTOUT_RADIUS;

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
      <View style={{ width: TAB_BAR_WIDTH, height: TAB_BAR_HEIGHT + 40 }}>
        {/* Curved background with cutout */}
        <Svg
          width={TAB_BAR_WIDTH}
          height={TAB_BAR_HEIGHT}
          style={{ position: "absolute", bottom: 0 }}
        >
          <Path d={createCurvedPath()} fill="#EA5B3A" />
        </Svg>

        {/* Center floating circle button */}
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={{
            position: "absolute",
            top: -2,
            left: TAB_BAR_WIDTH / 2 - CENTER_CIRCLE_SIZE / 2,
            width: CENTER_CIRCLE_SIZE,
            height: CENTER_CIRCLE_SIZE,
            borderRadius: CENTER_CIRCLE_SIZE / 2,
            backgroundColor: "white",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: 6,
            borderColor: "#EA5B3A",
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/match")}
            style={{
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PawPrint size={40} color="#EA5B3A" strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>

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
            // Skip center position (reserved for floating button)
            if (index === 2) {
              return <View key={index} style={{ width: CENTER_CIRCLE_SIZE }} />;
            }

            const Icon = item.icon;
            const isActive = current === index;

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
                <Icon
                  size={28}
                  color={isActive ? "white" : "rgba(255, 255, 255, 0.6)"}
                  strokeWidth={2.5}
                />
                {/* Active indicator dot */}
                {isActive && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "white",
                      marginTop: 4,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}