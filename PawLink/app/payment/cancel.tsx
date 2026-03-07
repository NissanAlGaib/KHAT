import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

/**
 * Deep-link landing screen after PayMongo payment is cancelled.
 * pawlink://payment/cancel → this route
 *
 * Redirects the user back to the home tab.
 */
export default function PaymentCancelRedirect() {
  const router = useRouter();

  useEffect(() => {
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
          backgroundColor: "#FEE2E2",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Feather name="x-circle" size={32} color="#EF4444" />
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
        Payment Cancelled
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
