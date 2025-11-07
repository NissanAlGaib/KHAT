import BubbleBackgroundRe from "@/components/app/BubbleBackground";
import { Slot } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  StyleSheet,
} from "react-native";

export default function AuthLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* Animated Background */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}>
        <BubbleBackgroundRe />
      </View>

      {/* Keyboard Handler */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? -100 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-end",
          }}
          showsVerticalScrollIndicator={false}
        >
          <Slot />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
