import { Stack } from "expo-router";

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="conversation" />
      <Stack.Screen name="contract-detail" />
      <Stack.Screen name="create-contract" />
    </Stack>
  );
}
