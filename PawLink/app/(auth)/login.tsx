import { View, Text, Image } from "react-native";
import React, { useState } from "react";
import { useSession } from "@/context/AuthContext";
import { Link } from "expo-router";
import { isAxiosError } from "axios";
import axiosInstance from "@/config/axiosConfig";
import CustomInput from "@/components/app/CustomInput";
import CustomButton from "@/components/app/CustomButton";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";

/**
 * Login Screen
 * VERSION 1.1 - Uses theme colors from Tailwind config
 */
const Login = () => {
  const { signIn } = useSession();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
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
          showAlert({
            title: "Login Error",
            message: responseData.message,
            type: "error",
          });
        } else {
          showAlert({
            title: "Login Error",
            message: "An unexpected error occurred.",
            type: "error",
          });
        }
      } else {
        showAlert({
          title: "Login Error",
          message: "Unable to connect to the server.",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="gap-6 rounded-t-3xl bg-bg-primary p-5 mt-5">
      <Image
        className="absolute -top-64 -right-4"
        source={require("../../assets/images/login_dog.png")}
      />
      <View className="w-full px-4 mt-6 mb-4">
        <Text className="font-baloo text-3xl text-center uppercase text-text-primary">
          Login To Your Account
        </Text>
        <Text className="text-text-muted text-center font-roboto-condensed-extralight text-sm">
          Enter your email and password below
        </Text>
      </View>
      <CustomInput
        placeholder="Enter Your Email"
        value={data.email}
        error={errors.email}
        onChangeText={(text) => handleChange("email", text)}
        label="Email"
        keyboardType="email-address"
      />
      <CustomInput
        placeholder="Enter Your Password"
        value={data.password}
        error={errors.password}
        onChangeText={(text) => handleChange("password", text)}
        label="Password"
        secureTextEntry
      />
      <CustomButton title="Login" onPress={handleLogin} isLoading={loading} />
      <Text className="text-sm text-text-muted text-center mb-6 font-roboto">
        Not registered yet?{" "}
        <Link href="/register">
          <Text className="text-primary-dark font-roboto">Create Account</Text>
        </Link>
      </Text>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </View>
  );
};

export default Login;
