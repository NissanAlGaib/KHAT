import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ShieldAlert, Mail, ArrowLeft } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useSession } from "@/context/AuthContext";

export default function BannedScreen() {
  const router = useRouter();
  const { signOut } = useSession();
  const params = useLocalSearchParams();
  
  const reason = params.reason as string;
  const endDate = params.end_date as string;
  const errorType = params.error as string; // 'account_banned' or 'account_suspended'
  const supportEmail = (params.support_email as string) || "support@pawlink.ph";

  const isBanned = errorType === "account_banned";
  const title = isBanned ? "Account Banned" : "Account Suspended";
  const iconColor = isBanned ? "#EF4444" : "#F97316"; // Red or Orange
  const bgColor = isBanned ? "bg-red-50" : "bg-orange-50";

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const contactSupport = () => {
    Linking.openURL(`mailto:${supportEmail}?subject=Appeal ${title}`);
  };

  return (
    <View className="flex-1 bg-white px-6 py-10 justify-center items-center">
      <View className={`p-6 rounded-full mb-6 ${bgColor}`}>
        <ShieldAlert size={64} color={iconColor} />
      </View>

      <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
        {title}
      </Text>

      <Text className="text-gray-500 text-center mb-8 px-4">
        {isBanned
          ? "Your account has been permanently banned due to a violation of our community guidelines."
          : `Your account has been temporarily suspended until ${endDate || "further notice"}.`}
      </Text>

      <View className="w-full bg-gray-50 rounded-xl p-5 border border-gray-100 mb-8">
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Reason Provided
        </Text>
        <Text className="text-gray-800 font-medium">
          {reason || "No specific reason provided."}
        </Text>
      </View>

      <TouchableOpacity
        onPress={contactSupport}
        className="flex-row items-center justify-center bg-gray-900 w-full py-4 rounded-xl mb-4"
      >
        <Mail size={20} color="white" className="mr-2" />
        <Text className="text-white font-bold">Contact Support</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogout}
        className="w-full py-4 rounded-xl border border-gray-200"
      >
        <Text className="text-gray-600 font-bold text-center">
          Sign Out & Return to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
