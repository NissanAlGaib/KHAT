import React, { useState } from "react";
import { TextInput, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SearchIconMorph } from "./SearchIconMorph";

export function AnimatedSearchBar() {
  const [focused, setFocused] = useState(false);

  const width = useSharedValue(50);
  const inputOpacity = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    width: withTiming(width.value, { duration: 350 }),
  }));

  const inputStyle = useAnimatedStyle(() => ({
    opacity: withTiming(inputOpacity.value, { duration: 300 }),
  }));

  const handleToggle = (open: boolean) => {
    if (open) {
      width.value = 260;
      inputOpacity.value = 1;
    } else {
      width.value = 48; // collapsed width
      inputOpacity.value = 0;
    }
  };

  return (
    <Animated.View
      style={containerStyle}
      className="
    flex-row 
    items-center 
    bg-[#F2F2F2]
    rounded-full 
    px-4
    h-11              /* <- MATCHES your design */
    overflow-hidden
  "
    >
      <View className="w-7 h-7 justify-center items-center">
        <SearchIconMorph size={22} color="#ea5b3a" onToggle={handleToggle} />
      </View>

      <Animated.View style={[inputStyle, { flex: 1 }]}>
        <TextInput
          placeholder="Search..."
          placeholderTextColor="#999"
          style={{ color: "#333", paddingVertical: 0 }}
          className="text-[15px]"
        />
      </Animated.View>
    </Animated.View>
  );
}
