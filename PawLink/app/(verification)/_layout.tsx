import { Stack } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";

export default function VerificationLayout() {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // use a positive offset for iOS (header height), 0 for Android
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="verify" />
      </Stack>
    </KeyboardAvoidingView>
  );
}
