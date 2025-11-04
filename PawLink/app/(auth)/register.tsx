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
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import axiosInstance from "@/config/axiosConfig";

type FormState = {
  email: string;
  username: string;
  password: string;
  password_confirmation: string;

  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;

  birthday: string;
  sex: string;
  province: string;
  city: string;
  postal: string;
  barangay: string;
  street: string;

  status_shooter: boolean;
  status_owner: boolean;
};

const initialState: FormState = {
  email: "",
  username: "",
  password: "",
  password_confirmation: "",

  firstName: "",
  middleName: "",
  lastName: "",
  phone: "",

  birthday: "",
  sex: "",
  province: "",
  city: "",
  postal: "",
  barangay: "",
  street: "",

  status_shooter: false,
  status_owner: false,
};

export default function RegisterScreen() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const update = (k: keyof FormState, v: any) => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const validateStep = () => {
    setError(null);
    if (step === 0) {
      if (!form.email) return "Email is required";
      if (!form.username) return "Username is required";
      if (!form.password) return "Password is required";
      if (form.password !== form.password_confirmation)
        return "Passwords do not match";
    }
    if (step === 1) {
      if (!form.firstName) return "First name required";
      if (!form.lastName) return "Last name required";
    }
    if (step === 2) {
      if (!form.birthday) return "Birthday required";
    }
    return null;
  };

  const handleNext = () => {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    next();
  };

  const handleCreate = async () => {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        email: form.email,
        username: form.username,
        password: form.password,
        password_confirmation: form.password_confirmation,

        first_name: form.firstName,
        middle_name: form.middleName,
        last_name: form.lastName,
        phone: form.phone,

        birthday: form.birthday,
        sex: form.sex,
        province: form.province,
        city: form.city,
        postal: form.postal,
        barangay: form.barangay,
        street: form.street,
        status_shooter: form.status_shooter,
        status_owner: form.status_owner,
      };

      const resp = await axiosInstance.post("/api/register", payload);
      // assume successful registration
      router.replace("/(auth)/login");
    } catch (e: any) {
      console.error(e);
      // try to extract message
      const msg =
        e?.response?.data?.message || e?.message || "Registration failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">Email</Text>
              <TextInput
                value={form.email}
                onChangeText={(t) => update("email", t)}
                placeholder="example@gmail.com"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">
                Create Username
              </Text>
              <TextInput
                value={form.username}
                onChangeText={(t) => update("username", t)}
                placeholder="it must be unique"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">
                Create Password
              </Text>
              <TextInput
                value={form.password}
                onChangeText={(t) => update("password", t)}
                placeholder="Create Password"
                secureTextEntry
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">
                Confirm Password
              </Text>
              <TextInput
                value={form.password_confirmation}
                onChangeText={(t) => update("password_confirmation", t)}
                placeholder="repeat password"
                secureTextEntry
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>
          </View>
        );

      case 1:
        return (
          <View>
            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">First Name</Text>
              <TextInput
                value={form.firstName}
                onChangeText={(t) => update("firstName", t)}
                placeholder="Enter first name"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">Middle Name</Text>
              <TextInput
                value={form.middleName}
                onChangeText={(t) => update("middleName", t)}
                placeholder="Enter Middle name"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">Last Name</Text>
              <TextInput
                value={form.lastName}
                onChangeText={(t) => update("lastName", t)}
                placeholder="Enter Last name"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">Phone Number</Text>
              <TextInput
                value={form.phone}
                onChangeText={(t) => update("phone", t)}
                placeholder="63+ 000 000 0000"
                keyboardType="phone-pad"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">Birthday</Text>
              <TextInput
                value={form.birthday}
                onChangeText={(t) => update("birthday", t)}
                placeholder="dd/mm/yy"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">Sex</Text>
              <TextInput
                value={form.sex}
                onChangeText={(t) => update("sex", t)}
                placeholder="Enter sex"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">Province</Text>
              <TextInput
                value={form.province}
                onChangeText={(t) => update("province", t)}
                placeholder="Province"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>

            <View className="flex-row space-x-2">
              <View className="flex-1 mb-3">
                <Text className="text-gray-700 text-sm mb-2">
                  City/Municipality
                </Text>
                <TextInput
                  value={form.city}
                  onChangeText={(t) => update("city", t)}
                  placeholder="City/Municipality"
                  className="border border-gray-200 px-3 py-2 rounded-md bg-white"
                />
              </View>

              <View className="w-28 mb-3">
                <Text className="text-gray-700 text-sm mb-2">Postal Code</Text>
                <TextInput
                  value={form.postal}
                  onChangeText={(t) => update("postal", t)}
                  placeholder="Postal Code"
                  keyboardType="numeric"
                  className="border border-gray-200 px-3 py-2 rounded-md bg-white"
                />
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">
                Barangay/District
              </Text>
              <TextInput
                value={form.barangay}
                onChangeText={(t) => update("barangay", t)}
                placeholder="Barangay/District"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-2">
                House/Street Name
              </Text>
              <TextInput
                value={form.street}
                onChangeText={(t) => update("street", t)}
                placeholder="House/Street Name"
                className="border border-gray-200 px-3 py-2 rounded-md bg-white"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View>
            <Text className="text-gray-800 font-medium mb-3">
              Select Your Status:
            </Text>

            <TouchableOpacity
              className="flex-row items-start mb-3"
              onPress={() => update("status_shooter", !form.status_shooter)}
            >
              <View className="w-5 h-5 mr-3 rounded-sm border border-gray-300 items-center justify-center">
                {form.status_shooter && (
                  <View className="w-3 h-3 bg-[#ea5b3a]" />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold">Shooter</Text>
                <Text className="text-gray-500 text-sm">
                  Assists in breeding pets, helping to ensure healthy offspring
                  and responsible pet care.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-start mb-3"
              onPress={() => update("status_owner", !form.status_owner)}
            >
              <View className="w-5 h-5 mr-3 rounded-sm border border-gray-300 items-center justify-center">
                {form.status_owner && <View className="w-3 h-3 bg-[#ea5b3a]" />}
              </View>
              <View className="flex-1">
                <Text className="font-semibold">Pet Owner</Text>
                <Text className="text-gray-500 text-sm">
                  Owning and caring for pets, providing a loving home and
                  fulfilling their daily needs.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f6f6]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
              SIGN UP
            </Text>

            <View className="mb-4">
              <View className="flex-row items-center justify-center space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    className={`w-10 h-2 rounded ${
                      i <= step ? "bg-[#ea5b3a]" : "bg-gray-200"
                    }`}
                  />
                ))}
              </View>
            </View>

            {error && (
              <Text className="text-red-500 text-sm mb-3">{error}</Text>
            )}

            {renderStep()}

            <View className="flex-row justify-between mt-6">
              {step > 0 ? (
                <TouchableOpacity
                  className="px-6 py-3 rounded-lg border border-gray-200"
                  onPress={prev}
                >
                  <Text className="text-gray-700">Prev</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              {step < 3 ? (
                <TouchableOpacity
                  className="bg-[#ea5b3a] px-6 py-3 rounded-lg"
                  onPress={handleNext}
                >
                  <Text className="text-white font-bold">Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-[#ea5b3a] px-6 py-3 rounded-lg flex-row items-center"
                  onPress={handleCreate}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" className="mr-2" />
                  ) : null}
                  <Text className="text-white font-bold">
                    {loading ? "Creating..." : "Create"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
