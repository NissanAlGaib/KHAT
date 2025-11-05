/* eslint-disable react-hooks/rules-of-hooks */
import {
  View,
  Text,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  Button,
} from "react-native";
import React, { useState } from "react";
import { useSession } from "@/context/AuthContext";
import { Link, router, Slot } from "expo-router";
import axios, { isAxiosError } from "axios";
import axiosInstance from "@/config/axiosConfig";
import CustomInput from "@/components/app/CustomInput";
import CustomButton from "@/components/app/CustomButton";

const Login = () => {
  const { signIn } = useSession();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleChange = async (key: string, value: string) => {
    setData({
      ...data,
      [key]: value,
    });
    setErrors({
      ...errors,
      [key]: "",
    });
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrors({
      email: "",
      password: "",
    });
    try {
      const response = await axiosInstance.post("/api/login", data);
      await signIn(response.data.token, response.data.user);
    } catch (error) {
      if (isAxiosError(error)) {
        const responseData = error.response?.data;
        if (responseData?.errors) {
          setErrors(responseData.errors);
        } else if (responseData?.message) {
          Alert.alert("Login Error", responseData.message);
        } else {
          Alert.alert("Login Error", "An unexpected error occurred.");
        }
      } else {
        console.error("Login Error:", error);
        Alert.alert("Login Error", "Unable to connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="gap-10 rounded-t-[45px] bg-[#FEFEFE] p-5 mt-5">
      <View className="w-full px-4 mt-2 mb-6">
        <Text className="font-extrabold text-3xl text-center mb-2">
          Login To Your Account
        </Text>
        <Text className="text-[#6D6A6A] text-center">
          Enter your email and password below
        </Text>
      </View>
      <CustomInput
        placeholder="Enter Your Email"
        value={data.email}
        onChangeText={(text) => handleChange("email", text)}
        label="Email"
        keyboardType="email-address"
      />
      <CustomInput
        placeholder="Enter Your Password"
        value={data.password}
        onChangeText={(text) => handleChange("password", text)}
        label="Password"
        secureTextEntry
      />
      <CustomButton
        title="Login"
        onPress={handleLogin}
        isLoading={loading}
      />
      <Text className="text-sm text-[#6B7280] text-center mb-6">
        Not registered yet?{" "}
        <Link href="/register">
          <Text className="text-[#E4492E]">Create Account</Text>
        </Link>
      </Text>
    </View>
  );
};

export default Login;
