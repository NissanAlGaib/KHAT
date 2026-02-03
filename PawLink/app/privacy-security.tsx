import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useSession } from "@/context/AuthContext";
import { changePassword, deleteAccount } from "@/services/userService";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { Colors } from "@/constants";

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { signOut, user } = useSession();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert({
        title: "Validation Error",
        message: "Please fill in all password fields",
        type: "warning",
      });
      return;
    }

    if (newPassword.length < 8) {
      showAlert({
        title: "Validation Error",
        message: "New password must be at least 8 characters",
        type: "warning",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({
        title: "Validation Error",
        message: "New passwords do not match",
        type: "warning",
      });
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword(currentPassword, newPassword, confirmPassword);
      
      showAlert({
        title: "Success",
        message: "Password changed successfully",
        type: "success",
        buttons: [
          {
            text: "OK",
            onPress: () => {
              setShowPasswordSection(false);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            },
          },
        ],
      });
    } catch (error: any) {
      showAlert({
        title: "Error",
        message: error.response?.data?.message || "Failed to change password",
        type: "error",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "DELETE") {
      showAlert({
        title: "Confirmation Required",
        message: 'Please type "DELETE" to confirm account deletion',
        type: "warning",
      });
      return;
    }

    if (!deletePassword) {
      showAlert({
        title: "Password Required",
        message: "Please enter your password to confirm",
        type: "warning",
      });
      return;
    }

    showAlert({
      title: "Delete Account?",
      message:
        "This action cannot be undone. All your data, pets, and matches will be permanently deleted.",
      type: "error",
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ],
    });
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await deleteAccount(deletePassword);
      
      showAlert({
        title: "Account Deleted",
        message: "Your account has been deleted. We're sorry to see you go.",
        type: "success",
        buttons: [
          {
            text: "OK",
            onPress: () => {
              signOut?.();
            },
          },
        ],
      });
    } catch (error: any) {
      showAlert({
        title: "Error",
        message: error.response?.data?.message || "Failed to delete account",
        type: "error",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

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
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Password Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowPasswordSection(!showPasswordSection)}
            >
              <View style={styles.sectionLeft}>
                <View style={[styles.iconContainer, { backgroundColor: "#EBF5FF" }]}>
                  <Feather name="lock" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Change Password</Text>
                  <Text style={styles.sectionDescription}>
                    Update your account password
                  </Text>
                </View>
              </View>
              <Feather
                name={showPasswordSection ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            {showPasswordSection && (
              <View style={styles.sectionContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <View style={styles.passwordInput}>
                    <TextInput
                      style={styles.passwordTextInput}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showCurrentPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <Feather
                        name={showCurrentPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordInput}>
                    <TextInput
                      style={styles.passwordTextInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password (min 8 chars)"
                      placeholderTextColor="#999"
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Feather
                        name={showNewPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Account Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLeft}>
                <View style={[styles.iconContainer, { backgroundColor: "#F0FDF4" }]}>
                  <Feather name="user" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Account Information</Text>
                  <Text style={styles.sectionDescription}>
                    Your account details
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.infoContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account ID</Text>
                <Text style={styles.infoValue}>#{user?.id}</Text>
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={[styles.section, styles.dangerSection]}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowDeleteSection(!showDeleteSection)}
            >
              <View style={styles.sectionLeft}>
                <View style={[styles.iconContainer, { backgroundColor: "#FEF2F2" }]}>
                  <Feather name="trash-2" size={20} color="#DC2626" />
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: "#DC2626" }]}>
                    Delete Account
                  </Text>
                  <Text style={styles.sectionDescription}>
                    Permanently delete your account
                  </Text>
                </View>
              </View>
              <Feather
                name={showDeleteSection ? "chevron-up" : "chevron-down"}
                size={20}
                color="#DC2626"
              />
            </TouchableOpacity>

            {showDeleteSection && (
              <View style={styles.sectionContent}>
                <View style={styles.warningBox}>
                  <Feather name="alert-triangle" size={20} color="#DC2626" />
                  <Text style={styles.warningText}>
                    This will permanently delete your account, all your pets, matches,
                    and breeding history. This action cannot be undone.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Your Password</Text>
                  <TextInput
                    style={styles.input}
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Type "DELETE" to confirm</Text>
                  <TextInput
                    style={styles.input}
                    value={deleteConfirmation}
                    onChangeText={setDeleteConfirmation}
                    placeholder='Type "DELETE"'
                    placeholderTextColor="#999"
                    autoCapitalize="characters"
                  />
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  {deletingAccount ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete My Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dangerSection: {
    borderColor: "#FECACA",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  sectionDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  infoContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
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
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  passwordInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  passwordTextInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#991B1B",
    lineHeight: 18,
  },
});
