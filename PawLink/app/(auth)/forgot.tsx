import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { Link, useRouter } from "expo-router";
import axiosInstance from "@/config/axiosConfig";
import { isAxiosError } from "axios";
import CustomInput from "@/components/app/CustomInput";
import CustomButton from "@/components/app/CustomButton";
import { Feather } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";

/**
 * Forgot Password Screen
 * Step 1: Enter email to receive reset link/code
 * Step 2: Enter token + new password
 */
const ForgotPassword = () => {
  const router = useRouter();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Step 2
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSendResetLink = async () => {
    if (!email) {
      setEmailError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setEmailError("");
    try {
      await axiosInstance.post("/api/forgot-password", { email });
      showAlert({
        title: "Reset Link Sent",
        message:
          "If an account with that email exists, we've sent a password reset token. Check your inbox and enter the token below.",
        type: "success",
        buttons: [
          {
            text: "Continue",
            onPress: () => setStep(2),
          },
        ],
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const msg =
          error.response?.data?.errors?.email?.[0] ||
          error.response?.data?.message ||
          "Failed to send reset link. Please try again.";
        setEmailError(msg);
      } else {
        showAlert({
          title: "Error",
          message: "Unable to connect to the server.",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!token)
      newErrors.token = "Please enter the reset token from your email.";
    if (!password) {
      newErrors.password = "Please enter a new password.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    if (!passwordConfirmation) {
      newErrors.password_confirmation = "Please confirm your new password.";
    } else if (password !== passwordConfirmation) {
      newErrors.password_confirmation = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await axiosInstance.post("/api/reset-password", {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      showAlert({
        title: "Password Reset!",
        message:
          "Your password has been reset successfully. You can now log in with your new password.",
        type: "success",
        buttons: [
          {
            text: "Go to Login",
            onPress: () => router.replace("/login"),
          },
        ],
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const responseData = error.response?.data;
        if (responseData?.errors) {
          const apiErrors: { [key: string]: string } = {};
          Object.keys(responseData.errors).forEach((key) => {
            apiErrors[key] = responseData.errors[key][0];
          });
          setErrors(apiErrors);
        } else {
          showAlert({
            title: "Reset Failed",
            message:
              responseData?.message ||
              "Failed to reset password. The token may be invalid or expired.",
            type: "error",
          });
        }
      } else {
        showAlert({
          title: "Error",
          message: "Unable to connect to the server.",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="gap-5 rounded-t-3xl bg-bg-primary p-5 mt-5">
      <View className="w-full px-4 mt-6 mb-2">
        <View className="items-center mb-4">
          <View className="w-16 h-16 rounded-full bg-[#FFF0ED] items-center justify-center">
            <Feather
              name={step === 1 ? "mail" : "key"}
              size={28}
              color="#E4492E"
            />
          </View>
        </View>
        <Text className="font-baloo text-3xl text-center uppercase text-text-primary">
          {step === 1 ? "Forgot Password" : "Reset Password"}
        </Text>
        <Text className="text-text-muted text-center font-roboto-condensed-extralight text-sm mt-1">
          {step === 1
            ? "Enter your email address and we'll send you a reset token."
            : "Enter the token from your email and create a new password."}
        </Text>
      </View>

      {step === 1 ? (
        <>
          <CustomInput
            placeholder="Enter your email address"
            value={email}
            error={emailError}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError("");
            }}
            label="Email"
            keyboardType="email-address"
          />
          <CustomButton
            title="Send Reset Token"
            onPress={handleSendResetLink}
            isLoading={loading}
          />
        </>
      ) : (
        <>
          <CustomInput
            placeholder="Paste the reset token"
            value={token}
            error={errors.token || errors.email}
            onChangeText={(text) => {
              setToken(text);
              setErrors((prev) => ({ ...prev, token: "", email: "" }));
            }}
            label="Reset Token"
          />
          <CustomInput
            placeholder="Enter new password"
            value={password}
            error={errors.password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            label="New Password"
            secureTextEntry={!showPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            }
          />
          <CustomInput
            placeholder="Confirm new password"
            value={passwordConfirmation}
            error={errors.password_confirmation}
            onChangeText={(text) => {
              setPasswordConfirmation(text);
              setErrors((prev) => ({ ...prev, password_confirmation: "" }));
            }}
            label="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Feather
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            }
          />
          <CustomButton
            title="Reset Password"
            onPress={handleResetPassword}
            isLoading={loading}
          />
          <TouchableOpacity onPress={() => setStep(1)}>
            <Text className="text-primary-dark font-roboto text-sm text-center">
              Didn't receive a token? Send again
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Text className="text-sm text-text-muted text-center mb-6 font-roboto">
        Remember your password?{" "}
        <Link href="/login">
          <Text className="text-primary-dark font-roboto">Back to Login</Text>
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

export default ForgotPassword;
