import React from "react";
import { View, Text, Modal, TouchableOpacity, Animated } from "react-native";
import {
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react-native";

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

const ALERT_STYLES = {
  success: {
    icon: CheckCircle,
    iconColor: "#10b981",
    bgColor: "#f0fdf4",
    borderColor: "#10b981",
  },
  error: {
    icon: XCircle,
    iconColor: "#ef4444",
    bgColor: "#fef2f2",
    borderColor: "#ef4444",
  },
  warning: {
    icon: AlertCircle,
    iconColor: "#f59e0b",
    bgColor: "#fffbeb",
    borderColor: "#f59e0b",
  },
  info: {
    icon: Info,
    iconColor: "#3b82f6",
    bgColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
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

  const style = ALERT_STYLES[type];
  const IconComponent = style.icon;

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case "cancel":
        return "bg-gray-200";
      case "destructive":
        return "bg-red-500";
      default:
        return "bg-[#ea5b3a]";
    }
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case "cancel":
        return "text-gray-700";
      case "destructive":
        return "text-white";
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
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
        >
          {/* Header with Icon */}
          <View className="items-center pt-8 pb-4 px-6">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: style.bgColor }}
            >
              <IconComponent size={32} color={style.iconColor} />
            </View>
            <Text className="text-2xl font-baloo text-[#111111] text-center mb-2">
              {title}
            </Text>
            <Text className="text-gray-600 text-center text-base leading-6">
              {message}
            </Text>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-200 mx-6" />

          {/* Buttons */}
          <View className="px-6 py-4">
            {buttons.length === 1 ? (
              <TouchableOpacity
                onPress={() => handleButtonPress(buttons[0])}
                className={`py-4 rounded-full ${getButtonStyle(
                  buttons[0].style
                )}`}
              >
                <Text
                  className={`text-center font-semibold text-base ${getButtonTextStyle(
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
                    className={`flex-1 py-4 rounded-full ${getButtonStyle(
                      button.style
                    )}`}
                  >
                    <Text
                      className={`text-center font-semibold text-base ${getButtonTextStyle(
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
