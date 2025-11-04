import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "@/context/AuthContext";
import axiosInstance from "@/config/axiosConfig";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    try {
      const resp = await axiosInstance.post("/api/login", {
        email,
        password,
      });
      const { token, user } = resp.data;
      if (token && user) {
        await signIn(token, user);
        // navigation will be handled by RootNavigator when session updates
      }
      console.log(resp.data);
    } catch (e) {
      console.error("Login error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f6f6]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="h-60 bg-[#ea5b3a] items-center justify-end pb-3">
          <Image
            source={require("@/assets/images/partial-react-logo.png")}
            className="w-8/12 h-36"
            style={{ tintColor: "rgba(255,255,255,0.95)" }}
            resizeMode="contain"
          />
        </View>

        <View className="flex-1 bg-white -mt-8 rounded-t-2xl p-6">
          <Text className="text-gray-800 font-semibold text-sm text-center mb-3">
            LOG IN
          </Text>

          <View className="mb-3">
            <Text className="text-gray-700 text-sm mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter Email"
              className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-700 text-sm mb-2">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
              className="border border-gray-200 px-3 py-2 rounded-md bg-white"
            />
          </View>

          <TouchableOpacity
            className="items-end mt-1 mb-3"
            onPress={() => router.push("/forgot")}
          >
            <Text className="text-gray-500 text-xs">Forget Password ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#ea5b3a] py-3 rounded-xl items-center shadow-md"
            onPress={onLogin}
            disabled={loading}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Signing in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center mt-5">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-3 text-gray-400 text-xs">Or sign up with</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <View className="flex-row justify-center mt-3">
            <Text className="text-gray-500">Not register yet ? </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text className="text-[#ea5b3a] ml-2 font-semibold">
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
