import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSession } from "@/context/AuthContext";

export default function Index() {
  const { user, signOut } = useSession();

  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="text-lg font-semibold mb-4">
        Welcome{user ? `, ${user.name}` : ""}!
      </Text>

      <TouchableOpacity
        className="bg-[#ea5b3a] px-6 py-3 rounded-lg shadow"
        onPress={async () => {
          try {
            await signOut();
          } catch (e) {
            console.error("Logout failed", e);
          }
        }}
      >
        <Text className="text-white font-bold">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
