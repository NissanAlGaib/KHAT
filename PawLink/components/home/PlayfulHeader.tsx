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
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants";

interface PlayfulHeaderProps {
  onSearchPress?: () => void;
  onSubscriptionPress?: () => void;
  onFilterPress?: () => void;
  filterActive?: boolean;
  filterCount?: number;
}

/**
 * PlayfulHeader v2 — Clean white header with coral accent.
 * Supports optional breed filter button on the right side.
 */
export default function PlayfulHeader({
  onSearchPress,
  onSubscriptionPress,
  onFilterPress,
  filterActive,
  filterCount = 0,
}: PlayfulHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
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

        {/* Right Side - Filter + Subscription */}
        <View style={styles.rightContainer}>
          {onFilterPress && (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterActive && styles.filterButtonActive,
              ]}
              onPress={onFilterPress}
              activeOpacity={0.7}
            >
              <Feather
                name="sliders"
                size={18}
                color={filterActive ? Colors.white : Colors.textSecondary}
              />
              {filterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{filterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
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
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
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
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Baloo2-ExtraBold",
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },
});
