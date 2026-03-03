import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants";

interface MinimalHeaderProps {
  onSettingsPress?: () => void;
}

/**
 * MinimalHeader - Clean, compact header for homepage
 * Height: 56px (plus safe area)
 */
export default function MinimalHeader({ onSettingsPress }: MinimalHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      router.push("/settings");
    }
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FFF8F6"]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="paw" size={18} color={Colors.white} />
          </View>
          <Text style={styles.logoText}>PawLink</Text>
        </View>

        {/* Right Icons */}
        <View style={styles.iconContainer}>
          {/* Settings */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  content: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIconText: {
    fontSize: 18,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Baloo-Regular",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
});
