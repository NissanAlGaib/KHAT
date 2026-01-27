import React from "react";
import { View, Text, Modal, TouchableOpacity, Animated } from "react-native";
import {
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react-native";
import { Colors, AlertStyles } from "@/constants";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  buttons?: AlertButton[];
  onClose: () => void;
}

/**
 * AlertModal - Unified alert/dialog component
 * VERSION 1.1 - Uses theme colors from constants/theme.ts
 */

const ALERT_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

export default function AlertModal({
  visible,
  title,
  message,
  type = "info",
  buttons = [{ text: "OK", style: "default" }],
  onClose,
}: AlertModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const alertStyle = AlertStyles[type];
  const IconComponent = ALERT_ICONS[type];

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case "cancel":
        return "bg-bg-muted";
      case "destructive":
        return "bg-error";
      default:
        return "bg-primary";
    }
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case "cancel":
        return "text-text-secondary";
      case "destructive":
      default:
        return "text-white";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-5">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="bg-white rounded-2.5xl w-full max-w-sm overflow-hidden"
        >
          {/* Header with Icon */}
          <View className="items-center pt-8 pb-4 px-6">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: alertStyle.bgColor }}
            >
              <IconComponent size={32} color={alertStyle.iconColor} />
            </View>
            <Text className="text-2xl font-baloo text-text-primary text-center mb-2">
              {title}
            </Text>
            <Text className="text-text-muted text-center text-base leading-6">
              {message}
            </Text>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-border-light mx-6" />

          {/* Buttons */}
          <View className="px-6 py-4">
            {buttons.length === 1 ? (
              <TouchableOpacity
                onPress={() => handleButtonPress(buttons[0])}
                className={`py-3.5 rounded-full ${getButtonStyle(
                  buttons[0].style
                )}`}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-center font-mulish-bold text-base ${getButtonTextStyle(
                    buttons[0].style
                  )}`}
                >
                  {buttons[0].text}
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row gap-3">
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleButtonPress(button)}
                    className={`flex-1 py-3.5 rounded-full ${getButtonStyle(
                      button.style
                    )}`}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-center font-mulish-bold text-base ${getButtonTextStyle(
                        button.style
                      )}`}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
