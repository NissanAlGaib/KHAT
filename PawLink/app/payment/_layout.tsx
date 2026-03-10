import { Stack } from "expo-router";

export default function PaymentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FFFFFF" },
        animation: "fade",
      }}
    />
  );
}
