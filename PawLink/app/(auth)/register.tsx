import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Link, router } from "expo-router";
import axiosInstance from "@/config/axiosConfig";
import { isAxiosError } from "axios";
import CustomInput from "@/components/app/CustomInput";
import CustomButton from "@/components/app/CustomButton";

interface RegisterData {
  email: string;
  name: string;
  password: string;
  password_confirmation: string;
  firstName: string;
  lastName: string;
  contact_number: string;
  birthdate: string;
  sex: string;
  address: {
    street: string;
    barangay: string;
    city: string;
    province: string;
    postal_code: string;
  };
  roles: string[];
}

const Register = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<RegisterData>({
    email: "",
    name: "",
    password: "",
    password_confirmation: "",
    firstName: "",
    lastName: "",
    contact_number: "",
    birthdate: "",
    sex: "",
    address: {
      street: "",
      barangay: "",
      city: "",
      province: "",
      postal_code: "",
    },
    roles: [],
  });

  const [errors, setErrors] = useState<any>({});

  const handleChange = (key: string, value: string) => {
    if (key.includes("address.")) {
      const addressKey = key.split(".")[1];
      setData({
        ...data,
        address: { ...data.address, [addressKey]: value },
      });
    } else {
      setData({ ...data, [key]: value });
    }
    setErrors({ ...errors, [key]: "" });
  };

  // ✅ Step validation before moving forward
  const validateStep = () => {
    let stepErrors: any = {};

    if (step === 1) {
      // Step 1: Account Setup
      if (!data.email) {
        stepErrors.email = "Please enter your email address.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        stepErrors.email =
          "Please provide a valid email format (e.g., name@email.com).";
      }

      if (!data.name) {
        stepErrors.name = "Please choose a username.";
      } else if (data.name.length < 3) {
        stepErrors.name = "Username must be at least 3 characters long.";
      }

      if (!data.password) {
        stepErrors.password = "Please create a password.";
      } else if (data.password.length < 8) {
        stepErrors.password = "Password must be at least 8 characters long.";
      }

      if (!data.password_confirmation) {
        stepErrors.password_confirmation = "Please confirm your password.";
      } else if (data.password !== data.password_confirmation) {
        stepErrors.password_confirmation =
          "Passwords do not match. Please re-enter.";
      }
    } else if (step === 2) {
      // Step 2: Personal Information
      if (!data.firstName) stepErrors.firstName = "First name is required.";
      if (!data.lastName) stepErrors.lastName = "Last name is required.";
      if (!data.birthdate) {
        stepErrors.birthdate = "Please enter your birthdate.";
      } else {
        const birth = new Date(data.birthdate);
        if (birth > new Date()) {
          stepErrors.birthdate = "Birthdate cannot be in the future.";
        }
      }
      if (!data.sex) stepErrors.sex = "Please select your gender.";
    } else if (step === 3) {
      // Step 3: Address Details
      const a = data.address || {};
      if (!a.street)
        stepErrors["address.street"] =
          "Please provide your street or house number.";
      if (!a.barangay)
        stepErrors["address.barangay"] = "Barangay field cannot be empty.";
      if (!a.city)
        stepErrors["address.city"] =
          "Please specify your city or municipality.";
      if (!a.province) stepErrors["address.province"] = "Province is required.";
      if (!a.postal_code) {
        stepErrors["address.postal_code"] = "Postal code is required.";
      } else if (!/^\d{4}$/.test(a.postal_code)) {
        stepErrors["address.postal_code"] =
          "Please enter a valid 4-digit postal code.";
      }
    } else if (step === 4) {
      if (!data.roles || data.roles.length === 0) {
        stepErrors.status =
          "Please select at least one role (Shooter or Breeder).";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/register", data);
      Alert.alert("Success", "Account created successfully!");
      router.replace("/Login");
    } catch (error) {
      if (isAxiosError(error)) {
        const responseData = error.response?.data;
        if (responseData?.errors) setErrors(responseData.errors);
        else
          Alert.alert("Error", responseData?.message || "Registration failed");
      } else {
        Alert.alert("Error", "Network error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View className="gap-4">
            <CustomInput
              label="Email"
              placeholder="example@gmail.com"
              value={data.email}
              onChangeText={(t) => handleChange("email", t)}
              error={errors.email}
            />
            <CustomInput
              label="Create Username"
              placeholder="must be unique"
              value={data.name}
              onChangeText={(t) => handleChange("name", t)}
              error={errors.name}
            />
            <CustomInput
              label="Create Password"
              placeholder="Create password"
              secureTextEntry
              value={data.password}
              onChangeText={(t) => handleChange("password", t)}
              error={errors.password}
            />
            <CustomInput
              label="Confirm Password"
              placeholder="Repeat password"
              secureTextEntry
              value={data.password_confirmation}
              onChangeText={(t) => handleChange("password_confirmation", t)}
              error={errors.password_confirmation}
            />
          </View>
        );

      case 2:
        return (
          <View className="gap-4">
            <CustomInput
              label="First Name"
              value={data.firstName}
              onChangeText={(t) => handleChange("firstName", t)}
              error={errors.firstName}
            />
            <CustomInput
              label="Last Name"
              value={data.lastName}
              onChangeText={(t) => handleChange("lastName", t)}
              error={errors.lastName}
            />
            <CustomInput
              label="Birthdate"
              placeholder="YYYY-MM-DD"
              value={data.birthdate}
              onChangeText={(t) => handleChange("birthdate", t)}
              error={errors.birthdate}
            />
            <CustomInput
              label="Sex"
              value={data.sex}
              onChangeText={(t) => handleChange("sex", t)}
              error={errors.sex}
            />
          </View>
        );

      case 3:
        return (
          <View className="gap-3">
            <CustomInput
              label="Street"
              value={data.address.street}
              onChangeText={(t) => handleChange("address.street", t)}
              error={errors["address.street"]}
            />
            <CustomInput
              label="Barangay/District"
              value={data.address.barangay}
              onChangeText={(t) => handleChange("address.barangay", t)}
              error={errors["address.barangay"]}
            />
            <CustomInput
              label="City/Municipality"
              value={data.address.city}
              onChangeText={(t) => handleChange("address.city", t)}
              error={errors["address.city"]}
            />
            <CustomInput
              label="Province"
              value={data.address.province}
              onChangeText={(t) => handleChange("address.province", t)}
              error={errors["address.province"]}
            />
            <CustomInput
              label="Postal Code"
              value={data.address.postal_code}
              onChangeText={(t) => handleChange("address.postal_code", t)}
              error={errors["address.postal_code"]}
            />
          </View>
        );

      case 4:
        return (
          <View className="gap-5">
            <Text className="font-roboto-condensed-bold text-xl text-[#E4492E]">
              Select Your Status:
            </Text>

            <View className="gap-3 mt-2">
              {/* Shooter Option */}
              <CustomButton
                title="Shooter"
                onPress={() =>
                  setData((prev) => ({
                    ...prev,
                    roles: prev.roles.includes("Shooter")
                      ? prev.roles.filter((r) => r !== "Shooter")
                      : [...prev.roles, "Shooter"],
                  }))
                }
                isLoading={false}
                btnstyle={`flex-row items-center justify-center px-4 py-3 rounded-xl border ${
                  data.roles.includes("Shooter")
                    ? "bg-[#E4492E] border-[#E4492E]"
                    : "border-gray-300 bg-white"
                }`}
                textstyle={`${
                  data.roles.includes("Shooter")
                    ? "text-white"
                    : "text-gray-700"
                } font-roboto text-base`}
              />

              {/* Breeder Option */}
              <CustomButton
                title="Breeder"
                onPress={() =>
                  setData((prev) => ({
                    ...prev,
                    roles: prev.roles.includes("Breeder")
                      ? prev.roles.filter((r) => r !== "Breeder")
                      : [...prev.roles, "Breeder"],
                  }))
                }
                isLoading={false}
                btnstyle={`flex-row items-center justify-center px-4 py-3 rounded-xl border ${
                  data.roles.includes("Breeder")
                    ? "bg-[#E4492E] border-[#E4492E]"
                    : "border-gray-300 bg-white"
                }`}
                textstyle={`${
                  data.roles.includes("Breeder")
                    ? "text-white"
                    : "text-gray-700"
                } font-roboto text-base`}
              />

              {errors.status ? (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.status}
                </Text>
              ) : null}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View className="relative bg-[#FEFEFE] rounded-t-[45px] p-5 mt-5">
      {/* Cat image wrapper */}
      <View className="absolute -top-48 w-64 h-64">
        <Image
          source={require("../../assets/images/register_cat.png")}
          resizeMode="contain"
        />
      </View>

      {/* Header text */}
      <View className="w-full px-4 mt-16 mb-4">
        <Text className="font-baloo text-3xl text-center uppercase">
          Create an Account
        </Text>
        <Text className="text-[#6D6A6A] text-center font-roboto-condensed-extralight text-sm">
          Create an account to get started!
        </Text>
      </View>

      {renderStep()}

      <View className="flex-row justify-between gap-3">
        {step > 1 && (
          <CustomButton
            title="Prev"
            onPress={prevStep}
            isLoading={false}
            btnstyle="flex-1"
          />
        )}
        {step < 4 ? (
          <CustomButton
            title="Next"
            onPress={nextStep}
            isLoading={false}
            btnstyle="flex-1"
          />
        ) : (
          <CustomButton
            title="Create"
            onPress={handleSubmit}
            isLoading={loading}
            btnstyle="flex-1"
          />
        )}
      </View>

      <Text className="text-center text-sm text-[#6B7280] mt-4 mb-6 font-roboto">
        Already have an account?{" "}
        <Link href="/Login">
          <Text className="text-[#E4492E] font-roboto">Login</Text>
        </Link>
      </Text>
    </View>
  );
};

export default Register;
