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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "android" ? "height" : "padding"}
      keyboardVerticalOffset={0}
    >

      <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}>
        <BubbleBackgroundRe />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
          paddingBottom: 0,
          marginBottom: 0,
        }}
        style={{
          flex: 1,
          zIndex: 1,
          paddingBottom: 0,
          marginBottom: 0,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Slot />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
