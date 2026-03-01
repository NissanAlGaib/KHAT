import React, { useEffect, useState, useMemo } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Link, router } from "expo-router";
import axiosInstance from "@/config/axiosConfig";
import { isAxiosError } from "axios";
import CustomInput from "@/components/app/CustomInput";
import CustomButton from "@/components/app/CustomButton";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from "dayjs";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import {
  getRegions,
  getProvinces,
  getCities,
} from "@/constants/philippineAddress";

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

interface Errors {
  [key: string]: string;
}

const Register = () => {
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const [address, setAddress] = useState({
    street: "",
    barangay: "",
    city: "",
    province: "",
    postal_code: "",
  });

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

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(data.sex);

  // Show/hide password state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Address dropdown states
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const regionItems = useMemo(() => getRegions(), []);
  const provinceItems = useMemo(
    () => getProvinces(selectedRegion),
    [selectedRegion],
  );
  const cityItems = useMemo(
    () => getCities(selectedRegion, selectedProvince),
    [selectedRegion, selectedProvince],
  );

  // Sync address when cascading dropdowns change
  useEffect(() => {
    setAddress((a) => ({
      ...a,
      province: selectedProvince,
      city: selectedCity,
    }));
  }, [selectedProvince, selectedCity]);

  // Reset dependent dropdowns when parent changes
  useEffect(() => {
    setSelectedProvince("");
    setSelectedCity("");
    setAddress((a) => ({ ...a, province: "", city: "" }));
  }, [selectedRegion]);

  useEffect(() => {
    setSelectedCity("");
    setAddress((a) => ({ ...a, city: "" }));
  }, [selectedProvince]);

  const handleConfirm = (date: Date) => {
    const formatted = dayjs(date).format("YYYY-MM-DD");
    setData((prev) => ({ ...prev, birthdate: formatted }));
    hideDatePicker();
  };

  const [errors, setErrors] = useState<Errors>({});

  const handleChange = (key: string, value: string) => {
    // Strip non-letter characters in real-time for name fields
    if (key === "firstName" || key === "lastName") {
      const filtered = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿÑñ' -]/g, "");
      setData((prev) => ({ ...prev, [key]: filtered }));
    } else {
      setData((prev) => ({ ...prev, [key]: value }));
    }
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

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
      const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ' -]+$/;
      if (!data.firstName) {
        stepErrors.firstName = "First name is required.";
      } else if (!nameRegex.test(data.firstName)) {
        stepErrors.firstName =
          "First name can only contain letters, spaces, hyphens, and apostrophes.";
      }
      if (!data.lastName) {
        stepErrors.lastName = "Last name is required.";
      } else if (!nameRegex.test(data.lastName)) {
        stepErrors.lastName =
          "Last name can only contain letters, spaces, hyphens, and apostrophes.";
      }
      if (!data.birthdate) {
        stepErrors.birthdate = "Please select your birthdate.";
      } else {
        const birth = new Date(data.birthdate);
        const today = new Date();
        const age =
          today.getFullYear() -
          birth.getFullYear() -
          (today <
          new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
            ? 1
            : 0);

        if (birth > today) {
          stepErrors.birthdate = "Birthdate cannot be in the future.";
        } else if (age < 13) {
          stepErrors.birthdate =
            "You must be at least 13 years old to register.";
        } else if (age > 100) {
          stepErrors.birthdate = "Please enter a valid birthdate.";
        }
      }
      if (!data.sex) {
        stepErrors.sex = "Please select your gender from the dropdown.";
      } else if (!["Male", "Female", "Other"].includes(data.sex)) {
        stepErrors.sex = "Invalid gender selection.";
      }
    } else if (step === 3) {
      // Step 3: Address Details
      const a = step === 3 ? address : data.address || {};
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

  useEffect(() => {
    setData((prev) => ({ ...prev, address }));
  }, [address]);

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    const payload = { ...data, address };
    setLoading(true);
    try {
      await axiosInstance.post("/api/register", payload);
      showAlert({
        title: "Success",
        message: "Account created successfully!",
        type: "success",
        buttons: [
          {
            text: "OK",
            onPress: () => router.replace("/Login"),
            style: "default",
          },
        ],
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const responseData = error.response?.data;
        if (responseData?.errors) setErrors(responseData.errors);
        else
          showAlert({
            title: "Error",
            message: responseData?.message || "Registration failed",
            type: "error",
          });
      } else {
        showAlert({
          title: "Error",
          message: "Network error occurred",
          type: "error",
        });
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
              value={data.email ?? ""}
              onChangeText={(t) => handleChange("email", t)}
              error={errors.email}
            />
            <CustomInput
              label="Create Username"
              placeholder="must be unique"
              value={data.name ?? ""}
              onChangeText={(t) => handleChange("name", t)}
              error={errors.name}
            />
            <CustomInput
              label="Create Password"
              placeholder="Create password"
              secureTextEntry={!showPassword}
              value={data.password ?? ""}
              onChangeText={(t) => handleChange("password", t)}
              error={errors.password}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              }
            />
            <CustomInput
              label="Confirm Password"
              placeholder="Repeat password"
              secureTextEntry={!showConfirmPassword}
              value={data.password_confirmation ?? ""}
              onChangeText={(t) => handleChange("password_confirmation", t)}
              error={errors.password_confirmation}
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
          </View>
        );

      case 2:
        return (
          <View className="gap-4">
            <CustomInput
              label="First Name"
              value={data.firstName ?? ""}
              onChangeText={(t) => handleChange("firstName", t)}
              error={errors.firstName}
            />
            <CustomInput
              label="Last Name"
              value={data.lastName ?? ""}
              onChangeText={(t) => handleChange("lastName", t)}
              error={errors.lastName}
            />
            <View className="">
              <Text className="font-mulish mb-2">Birthdate</Text>

              <TouchableOpacity
                className="border border-gray-300 rounded-lg p-3"
                onPress={showDatePicker}
              >
                <Text>{data.birthdate || "Select your birthdate"}</Text>
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                maximumDate={new Date()}
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
              />
              <Text className="text-red-500 font-roboto-condensed-extralight">
                {errors.birthdate}
              </Text>
            </View>
            <View className="">
              <Text className="font-mulish mb-2 -mt-5">Sex</Text>

              <View className="border border-gray-300 rounded-lg">
                <DropDownPicker
                  open={open}
                  value={value}
                  items={[
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                    { label: "Other", value: "Other" },
                  ]}
                  setOpen={setOpen}
                  setValue={(cb) => {
                    const v = cb(value);
                    setValue(v);
                    handleChange("sex", v);
                  }}
                  listMode="SCROLLVIEW"
                  placeholder="Select your sex"
                  style={{ borderColor: "#d1d5db" }}
                  dropDownContainerStyle={{ borderColor: "#d1d5db" }}
                />
              </View>
              <Text className="text-red-500 font-roboto-condensed-extralight">
                {errors.sex}
              </Text>
            </View>
          </View>
        );

      case 3:
        return (
          <View className="gap-3">
            <CustomInput
              label="Street / House No."
              value={address.street}
              onChangeText={(t) => setAddress((a) => ({ ...a, street: t }))}
              error={errors["address.street"]}
            />

            {/* Region Dropdown */}
            <View style={{ zIndex: 4000 }}>
              <Text className="font-mulish mb-2 text-sm text-text-secondary">
                Region
              </Text>
              <DropDownPicker
                open={regionOpen}
                value={selectedRegion}
                items={regionItems}
                setOpen={setRegionOpen}
                setValue={setSelectedRegion}
                listMode="SCROLLVIEW"
                scrollViewProps={{ nestedScrollEnabled: true }}
                placeholder="Select Region"
                searchable={true}
                searchPlaceholder="Search region..."
                style={{ borderColor: "#d1d5db", minHeight: 48 }}
                dropDownContainerStyle={{
                  borderColor: "#d1d5db",
                  maxHeight: 200,
                }}
                onOpen={() => {
                  setProvinceOpen(false);
                  setCityOpen(false);
                }}
              />
              {errors["address.province"] && !selectedRegion && (
                <Text className="text-red-500 text-sm mt-1 font-roboto-condensed-extralight">
                  Please select a region first.
                </Text>
              )}
            </View>

            {/* Province Dropdown */}
            <View style={{ zIndex: 3000 }}>
              <Text className="font-mulish mb-2 text-sm text-text-secondary">
                Province
              </Text>
              <DropDownPicker
                open={provinceOpen}
                value={selectedProvince}
                items={provinceItems}
                setOpen={setProvinceOpen}
                setValue={setSelectedProvince}
                listMode="SCROLLVIEW"
                scrollViewProps={{ nestedScrollEnabled: true }}
                placeholder={
                  selectedRegion ? "Select Province" : "Select a region first"
                }
                disabled={!selectedRegion}
                searchable={true}
                searchPlaceholder="Search province..."
                style={{
                  borderColor: "#d1d5db",
                  minHeight: 48,
                  opacity: selectedRegion ? 1 : 0.5,
                }}
                dropDownContainerStyle={{
                  borderColor: "#d1d5db",
                  maxHeight: 200,
                }}
                onOpen={() => {
                  setRegionOpen(false);
                  setCityOpen(false);
                }}
              />
              {errors["address.province"] ? (
                <Text className="text-red-500 text-sm mt-1 font-roboto-condensed-extralight">
                  {errors["address.province"]}
                </Text>
              ) : null}
            </View>

            {/* City Dropdown */}
            <View style={{ zIndex: 2000 }}>
              <Text className="font-mulish mb-2 text-sm text-text-secondary">
                City / Municipality
              </Text>
              <DropDownPicker
                open={cityOpen}
                value={selectedCity}
                items={cityItems}
                setOpen={setCityOpen}
                setValue={setSelectedCity}
                listMode="SCROLLVIEW"
                scrollViewProps={{ nestedScrollEnabled: true }}
                placeholder={
                  selectedProvince
                    ? "Select City/Municipality"
                    : "Select a province first"
                }
                disabled={!selectedProvince}
                searchable={true}
                searchPlaceholder="Search city..."
                style={{
                  borderColor: "#d1d5db",
                  minHeight: 48,
                  opacity: selectedProvince ? 1 : 0.5,
                }}
                dropDownContainerStyle={{
                  borderColor: "#d1d5db",
                  maxHeight: 200,
                }}
                onOpen={() => {
                  setRegionOpen(false);
                  setProvinceOpen(false);
                }}
              />
              {errors["address.city"] ? (
                <Text className="text-red-500 text-sm mt-1 font-roboto-condensed-extralight">
                  {errors["address.city"]}
                </Text>
              ) : null}
            </View>

            <CustomInput
              label="Barangay / District"
              value={address.barangay}
              onChangeText={(t) => setAddress((a) => ({ ...a, barangay: t }))}
              error={errors["address.barangay"]}
              placeholder="Enter your barangay"
            />

            <CustomInput
              label="Postal Code"
              value={address.postal_code}
              onChangeText={(t) => {
                const digits = t.replace(/[^0-9]/g, "").slice(0, 4);
                setAddress((a) => ({ ...a, postal_code: digits }));
              }}
              error={errors["address.postal_code"]}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="e.g. 8000"
            />
          </View>
        );

      case 4:
        const toggleRole = (role: string) => {
          setData((prev) => {
            const roles = [...prev.roles];
            const index = roles.indexOf(role);
            if (index > -1) roles.splice(index, 1);
            else roles.push(role);
            return { ...prev, roles };
          });
        };

        return (
          <View className="gap-2">
            <Text className="font-baloo text-3xl mt-4 text-[#E4492E]">
              Select Your Role:
            </Text>

            <View className="mt-2 gap-4">
              <TouchableOpacity
                onPress={() => toggleRole("Shooter")}
                className="flex-row items-start gap-3 p-3 border border-gray-300 rounded-xl bg-white active:bg-gray-50"
              >
                <MaterialCommunityIcons
                  name={
                    data.roles.includes("Shooter")
                      ? "checkbox-marked"
                      : "checkbox-blank-outline"
                  }
                  size={28}
                  color={data.roles.includes("Shooter") ? "#E4492E" : "#9CA3AF"}
                />

                <View className="flex-1">
                  <Text
                    className={`font-mulish-bold text-lg ${
                      data.roles.includes("Shooter")
                        ? "text-[#E4492E]"
                        : "text-gray-800"
                    }`}
                  >
                    Shooter
                  </Text>
                  <Text className="text-gray-500 text-sm font-roboto-condensed">
                    Assists in breeding pets, helping to ensure healthy
                    offspring and responsible pet care.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleRole("Breeder")}
                className="flex-row items-start gap-3 p-3 border border-gray-300 rounded-xl bg-white active:bg-gray-50"
              >
                <MaterialCommunityIcons
                  name={
                    data.roles.includes("Breeder")
                      ? "checkbox-marked"
                      : "checkbox-blank-outline"
                  }
                  size={28}
                  color={data.roles.includes("Breeder") ? "#E4492E" : "#9CA3AF"}
                />

                <View className="flex-1">
                  <Text
                    className={`font-mulish-bold text-lg ${
                      data.roles.includes("Breeder")
                        ? "text-[#E4492E]"
                        : "text-gray-800"
                    }`}
                  >
                    Breeder
                  </Text>
                  <Text className="text-gray-500 text-sm font-roboto-condensed">
                    Assists in breeding pets, helping to ensure healthy
                    offspring and responsible pet care.
                  </Text>
                </View>
              </TouchableOpacity>

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
        <Link href="/login">
          <Text className="text-[#E4492E] font-roboto">Login</Text>
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

export default Register;
