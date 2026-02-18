import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

import { useSession } from "@/context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  type UserProfile,
} from "@/services/userService";
import { getStorageUrl } from "@/utils/imageUrl";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { Colors } from "@/constants";

import {
  SettingsLayout,
  SettingsSection,
  SettingsInput,
  SettingsButton,
} from "@/components/settings";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [sex, setSex] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  // Validation state
  const [errors, setErrors] = useState<{ name?: string; contact?: string }>({});

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      setName(data.name || "");
      setEmail(data.email || "");
      setContactNumber(data.contact_number || "");
      setBirthdate(data.birthdate ? new Date(data.birthdate) : null);
      setSex(data.sex || "");
      setProfileImage(data.profile_image || null);
    } catch (error) {
      console.error("Error loading profile:", error);
      showAlert({
        title: "Error",
        message: "Failed to load profile data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showAlert({
        title: "Permission Required",
        message: "Please allow access to your photo library",
        type: "warning",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewImageUri(result.assets[0].uri);
    }
  };

  const validate = () => {
    let valid = true;
    const newErrors: { name?: string; contact?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      // Upload new image if selected
      if (newImageUri) {
        await uploadProfileImage(newImageUri);
      }

      // Update profile data
      await updateUserProfile({
        name: name.trim(),
        contact_number: contactNumber.trim() || undefined,
        birthdate: birthdate
          ? dayjs(birthdate).format("YYYY-MM-DD")
          : undefined,
        sex: sex || undefined,
      });

      showAlert({
        title: "Success",
        message: "Profile updated successfully",
        type: "success",
        buttons: [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      showAlert({
        title: "Error",
        message: error.response?.data?.message || "Failed to update profile",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const getImageSource = () => {
    if (newImageUri) {
      return { uri: newImageUri };
    }
    if (profileImage) {
      const storageUrl = getStorageUrl(profileImage);
      if (storageUrl) {
        return { uri: storageUrl };
      }
    }
    return require("@/assets/images/icon.png");
  };

  // Gender selection helper
  const GenderButton = ({
    value,
    label,
    icon,
  }: {
    value: string;
    label: string;
    icon: string;
  }) => {
    const isSelected = sex === value;
    return (
      <TouchableOpacity
        onPress={() => setSex(value)}
        className={`flex-1 flex-row items-center justify-center p-3 rounded-lg border mr-2 ${
          isSelected
            ? "bg-orange-50 border-orange-500"
            : "bg-white border-gray-200"
        }`}
      >
        <Text
          className={`mr-2 ${isSelected ? "text-orange-600" : "text-gray-500"}`}
        >
          {icon}
        </Text>
        <Text
          className={`font-medium ${isSelected ? "text-orange-700" : "text-gray-700"}`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SettingsLayout
      headerTitle="Edit Profile"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="mb-6 items-center pt-4">
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            <View className="relative">
              <Image
                source={getImageSource()}
                className="w-32 h-32 rounded-full border-4 border-white shadow-sm"
              />
              <View className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full border-2 border-white">
                <Feather name="camera" size={16} color="white" />
              </View>
            </View>
          </TouchableOpacity>
          <Text className="text-gray-500 text-sm mt-3">
            Tap to change photo
          </Text>
        </View>

        <SettingsSection title="Personal Information">
          <View className="p-4 bg-white">
            <SettingsInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. John Doe"
              icon="user"
              error={errors.name}
            />

            <SettingsInput
              label="Email Address"
              value={email}
              editable={false}
              icon="mail"
              className="opacity-60"
            />

            <SettingsInput
              label="Phone Number"
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="e.g. 09123456789"
              keyboardType="phone-pad"
              icon="phone"
            />

            <View className="mb-4 mx-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
                Date of Birth
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 h-12"
              >
                <Feather
                  name="calendar"
                  size={20}
                  color="#9ca3af"
                  style={{ marginRight: 10 }}
                />
                <Text
                  className={
                    birthdate
                      ? "text-gray-900 text-base"
                      : "text-gray-400 text-base"
                  }
                >
                  {birthdate
                    ? dayjs(birthdate).format("MMMM D, YYYY")
                    : "Select date"}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={birthdate || new Date(2000, 0, 1)}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) setBirthdate(date);
                }}
              />
            )}

            <View className="mb-2 mx-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
                Gender
              </Text>
              <View className="flex-row">
                <GenderButton value="male" label="Male" icon="♂" />
                <GenderButton value="female" label="Female" icon="♀" />
              </View>
            </View>
          </View>
        </SettingsSection>

        <View className="px-4 mt-4">
          <SettingsButton
            title={saving ? "Saving Changes..." : "Save Changes"}
            onPress={handleSave}
            loading={saving}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SettingsLayout>
  );
}
