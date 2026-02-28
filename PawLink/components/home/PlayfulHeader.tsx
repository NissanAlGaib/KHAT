import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Shadows } from "@/constants";

interface PlayfulHeaderProps {
  onSearchPress?: () => void;
  onSubscriptionPress?: () => void;
}

/**
 * Instagram-style header with:
 * - Search icon on the left
 * - Centered app name "PAWLINK"
 * - Subscription (crown) icon on the right
 */
export default function PlayfulHeader({
  onSearchPress,
  onSubscriptionPress,
}: PlayfulHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        {/* Left Side - Search Icon */}
        <View style={styles.leftContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSearchPress}
            activeOpacity={0.7}
          >
            <Image
              source={require("@/assets/images/Search_Icon.png")}
              style={styles.iconImage}
            />
          </TouchableOpacity>
        </View>

        {/* Center - App Name */}
        <View style={styles.centerContainer}>
          <Text style={styles.title}>PAWLINK</Text>
        </View>

        {/* Right Side - Subscription Icon */}
        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSubscriptionPress}
            activeOpacity={0.7}
          >
            <Image
              source={require("@/assets/images/Subscription_Icon.png")}
              style={styles.iconImage}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 16, // Space below header
    // Subtle shadow for depth without being heavy
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
    // Subtle bottom border as fallback
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
  },
  leftContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  centerContainer: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rightContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: "Baloo2-ExtraBold",
    color: Colors.coralVibrant,
    letterSpacing: 1.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconImage: {
    width: 26,
    height: 26,
    resizeMode: "contain",
  },
});
