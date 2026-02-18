import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useSession } from "@/context/AuthContext";
import { changePassword, deleteAccount } from "@/services/userService";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { Colors } from "@/constants";

import {
  SettingsLayout,
  SettingsSection,
  SettingsInput,
  SettingsButton,
  SettingsItem,
} from "@/components/settings";

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { signOut, user } = useSession();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // const [showCurrentPassword, setShowCurrentPassword] = useState(false); // Can just use secureTextEntry toggle if I update Input, but for now standard secure
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

  const SectionHeader = ({
    title,
    description,
    icon,
    color,
    bg,
    expanded,
    onPress,
  }: {
    title: string;
    description: string;
    icon: keyof typeof Feather.glyphMap;
    color: string;
    bg: string;
    expanded: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      className="flex-row items-center justify-between p-4 bg-white active:bg-gray-50 rounded-xl"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1 mr-4">
        <View
          className="w-10 h-10 rounded-xl justify-center items-center mr-3"
          style={{ backgroundColor: bg }}
        >
          <Feather name={icon} size={20} color={color} />
        </View>
        <View>
          <Text
            className="text-base font-semibold text-gray-900"
            style={{ color: color === "#DC2626" ? color : "#111827" }}
          >
            {title}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
            {description}
          </Text>
        </View>
      </View>
      <Feather
        name={expanded ? "chevron-up" : "chevron-down"}
        size={20}
        color={color === "#DC2626" ? color : "#9CA3AF"}
      />
    </TouchableOpacity>
  );

  return (
    <SettingsLayout headerTitle="Privacy & Security">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <SettingsSection>
          <SectionHeader
            title="Change Password"
            description="Update your account password"
            icon="lock"
            color="#3B82F6"
            bg="#EBF5FF"
            expanded={showPasswordSection}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          />

          {showPasswordSection && (
            <View className="px-4 pb-4 bg-white border-t border-gray-100 pt-4">
              <SettingsInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
                icon="lock"
              />
              <SettingsInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min 8 characters"
                secureTextEntry
                icon="key"
              />
              <SettingsInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry
                icon="check-circle"
              />

              <SettingsButton
                title="Update Password"
                onPress={handleChangePassword}
                loading={changingPassword}
                variant="primary"
                className="mt-2"
              />
            </View>
          )}
        </SettingsSection>

        <SettingsSection title="Account Information">
          <SettingsItem
            label="Email"
            value={user?.email || "Not set"}
            type="info"
            icon="mail"
            iconColor="#3B82F6"
          />
          <SettingsItem
            label="Account ID"
            value={`#${user?.id || "---"}`}
            type="info"
            icon="hash"
            iconColor="#6B7280"
            borderless
          />
        </SettingsSection>

        <SettingsSection>
          <SectionHeader
            title="Delete Account"
            description="Permanently delete your account"
            icon="trash-2"
            color="#DC2626"
            bg="#FEF2F2"
            expanded={showDeleteSection}
            onPress={() => setShowDeleteSection(!showDeleteSection)}
          />

          {showDeleteSection && (
            <View className="px-4 pb-4 bg-white border-t border-red-100 pt-4">
              <View className="flex-row items-start bg-red-50 p-3 rounded-xl mb-4">
                <Feather
                  name="alert-triangle"
                  size={18}
                  color="#DC2626"
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <Text className="flex-1 text-xs text-red-700 leading-5">
                  This will permanently delete your account, all your pets,
                  matches, and breeding history. This action cannot be undone.
                </Text>
              </View>

              <SettingsInput
                label="Your Password"
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Verify identity"
                secureTextEntry
              />

              <SettingsInput
                label='Type "DELETE" to confirm'
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder='Type "DELETE"'
                autoCapitalize="characters"
                error={
                  deleteConfirmation && deleteConfirmation !== "DELETE"
                    ? "Must type DELETE"
                    : undefined
                }
              />

              <SettingsButton
                title="Delete My Account"
                onPress={handleDeleteAccount}
                loading={deletingAccount}
                variant="destructive"
                className="mt-2"
              />
            </View>
          )}
        </SettingsSection>
      </KeyboardAvoidingView>

      <AlertModal {...{ visible, ...alertOptions, onClose: hideAlert }} />
    </SettingsLayout>
  );
}
