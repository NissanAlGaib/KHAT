import BubbleBackgroundRe from "@/components/app/BubbleBackground";
import KeyboardAwareScrollView from "@/components/app/KeyboardAwareScrollView";
import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Animated Background */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}>
        <BubbleBackgroundRe />
      </View>

      {/* Keyboard-aware content */}
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        <Slot />
      </KeyboardAwareScrollView>
    </View>
  );
}
