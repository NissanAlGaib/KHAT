import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import React from "react";
import cn from "clsx";

interface CustomButtonProps {
  onPress: () => void;
  title?: string;
  btnstyle?: string | object;
  textStyle?: string | object;
  leftIcon?: React.ReactNode;
  isLoading?: boolean;
}

const CustomButton = ({
  onPress,
  title = "Button",
  btnstyle,
  textStyle,
  leftIcon,
  isLoading = false,
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
      className={cn(
        "bg-[#E85234] rounded-full p-3 flex flex-row justify-center mt-6",
        btnstyle
      )}
      onPress={onPress}
      disabled={isLoading}
    >
      {leftIcon}
      <View className="flex-center flex-row">
        {isLoading ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : (
          <Text className={cn("text-white text-base font-mulish-bold", textStyle)}>{title}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CustomButton;
