import React from "react";
import { TouchableOpacity, View, Text, Switch, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";

interface SettingsItemProps {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  /** Background color for the icon tile. Defaults to gray. */
  iconColor?: string;
  value?: string | boolean; // boolean for toggle type
  onPress?: () => void;
  type?: "link" | "toggle" | "info" | "action";
  isDestructive?: boolean;
  borderless?: boolean;
}

export const SettingsItem = ({
  label,
  icon,
  iconColor,
  value,
  onPress,
  type = "link",
  isDestructive = false,
  borderless = false,
}: SettingsItemProps) => {
  const isLink = type === "link";
  const isToggle = type === "toggle";

  const tileBg = isDestructive ? "#EF4444" : (iconColor ?? "#6B7280");
  const labelColor = isDestructive ? "#EF4444" : "#111827";

  const Content = (
    <View style={[styles.row, !borderless && styles.rowBorder]}>
      {/* iOS-style icon tile */}
      {icon && (
        <View style={[styles.iconTile, { backgroundColor: tileBg }]}>
          <Feather name={icon} size={17} color="white" />
        </View>
      )}

      {/* Label */}
      <View style={styles.labelWrap}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      </View>

      {/* Right Side Content */}
      <View style={styles.rightWrap}>
        {type === "info" && typeof value === "string" && (
          <Text style={styles.infoText}>{value}</Text>
        )}

        {isToggle && (
          <Switch
            value={value as boolean}
            onValueChange={onPress}
            trackColor={{ false: "#d1d5db", true: Colors.primary }}
            thumbColor={"#ffffff"}
          />
        )}

        {isLink && (
          <>
            {value && typeof value === "string" && (
              <Text style={styles.valueText}>{value}</Text>
            )}
            <Feather name="chevron-right" size={18} color="#C0C0C0" />
          </>
        )}
      </View>
    </View>
  );

  if (isToggle || type === "info") {
    return <View style={styles.bg}>{Content}</View>;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.bg}>
      {Content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bg: { backgroundColor: "white" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  labelWrap: { flex: 1, justifyContent: "center" },
  label: { fontSize: 15, fontWeight: "600" },
  rightWrap: { flexDirection: "row", alignItems: "center" },
  infoText: { color: "#6B7280", fontSize: 14, marginRight: 4 },
  valueText: { color: "#9CA3AF", fontSize: 14, marginRight: 6 },
});
