import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [sex, setSex] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

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
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
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

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert({
        title: "Validation Error",
        message: "Name is required",
        type: "warning",
      });
      return;
    }

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
        birthdate: birthdate ? dayjs(birthdate).format("YYYY-MM-DD") : undefined,
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
    const storageUrl = getStorageUrl(profileImage);
    if (storageUrl) {
      return { uri: storageUrl };
    }
    return require("@/assets/images/icon.png");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
              <Image source={getImageSource()} style={styles.profileImage} />
              <View style={styles.editBadge}>
                <Feather name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Contact Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* Birthdate */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Birthdate</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={birthdate ? styles.inputText : styles.placeholder}>
                  {birthdate
                    ? dayjs(birthdate).format("MMMM D, YYYY")
                    : "Select birthdate"}
                </Text>
                <Feather name="calendar" size={20} color="#999" />
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

            {/* Sex/Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderButtons}>
                {["male", "female"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderButton,
                      sex === option && styles.genderButtonActive,
                    ]}
                    onPress={() => setSex(option)}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        sex === option && styles.genderButtonTextActive,
                      ]}
                    >
                      {option === "male" ? "♂ Male" : "♀ Female"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Email (read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.input, styles.disabledInput]}>
                <Text style={styles.disabledText}>{profile?.email}</Text>
                <Feather name="lock" size={16} color="#999" />
              </View>
              <Text style={styles.helperText}>
                Email cannot be changed
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal {...{ visible, ...alertOptions, onClose: hideAlert }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  flex1: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  imageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputText: {
    fontSize: 16,
    color: "#333",
  },
  placeholder: {
    fontSize: 16,
    color: "#999",
  },
  disabledInput: {
    backgroundColor: "#F3F4F6",
  },
  disabledText: {
    fontSize: 16,
    color: "#666",
  },
  helperText: {
    fontSize: 12,
    color: "#999",
  },
  genderButtons: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "white",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  genderButtonTextActive: {
    color: "white",
  },
});
