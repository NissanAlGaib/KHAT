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
  badgeCount?: number;
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
  onSubscriptionPress?: () => void;
}

/**
 * Instagram-style header with:
 * - Search icon on the left
 * - Centered app name "PAWLINK"
 * - Subscription (crown) and notification icons on the right
 */
export default function PlayfulHeader({
  badgeCount = 0,
  onNotificationPress,
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

        {/* Right Side - Subscription & Notification Icons */}
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

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Image
              source={require("@/assets/images/Notif_Icon.png")}
              style={styles.iconImage}
            />
            {badgeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {badgeCount > 9 ? "9+" : badgeCount}
                </Text>
              </View>
            )}
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
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: Colors.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 2,
  },
});
