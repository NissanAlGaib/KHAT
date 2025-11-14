import { View, Text, TextInput } from "react-native";
import React from "react";
import cn from "clsx";

interface CustomInputProps {
  placeholder?: string;
  value: string;
  error?: string;
  onChangeText: (text: string) => void;
  label?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

const CustomInput = ({
  placeholder = "Enter Text",
  value,
  error,
  onChangeText,
  label,
  secureTextEntry,
  keyboardType = "default",
}: CustomInputProps) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View className="w-full">
      <Text className="label font-mulish">{label}</Text>
      <TextInput
        key={label}
        defaultValue={value}
        onChangeText={(text) => onChangeText(text)}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#888"
        className={cn(
          "rounded-lg p-3 w-full text-base text-dark-100 border-b leading-5",
          isFocused ? "border-black" : "border-gray-300"
        )}
      />
      <Text
        className={cn("text-red-500 font-roboto-condensed-extralight", {
          hidden: !error,
        })}
      >
        {error}
      </Text>
    </View>
  );
};

export default React.memo(CustomInput);
