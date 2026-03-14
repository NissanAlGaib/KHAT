import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

/**
 * Deep-link landing screen after PayMongo payment succeeds.
 * pawlink://payment/success → this route
 *
 * The actual payment verification is handled by the originating screen
 * (subscription, view-profile, PaymentPromptModal) via AppState listeners
 * or "Verify Payment" buttons. This screen simply redirects the user back
 * to the home tab so they land inside the app instead of a dead page.
 */
export default function PaymentSuccessRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Short delay so the user sees a brief confirmation before redirect
    const timeout = setTimeout(() => {
      router.replace("/(tabs)");
    }, 1200);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF5F5",
        padding: 24,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#DCFCE7",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Feather name="check-circle" size={32} color="#16a34a" />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: "#1F2937",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Payment Complete
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#6B7280",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Returning you to PawLink…
      </Text>
      <ActivityIndicator size="small" color="#E75234" />
    </View>
  );
}
