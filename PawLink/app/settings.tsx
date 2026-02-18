import React from "react";
import { useRouter } from "expo-router";
import { useSession } from "@/context/AuthContext";
import {
  SettingsLayout,
  SettingsSection,
  SettingsItem,
} from "@/components/settings";

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useSession();

  const handleLogout = async () => {
    signOut?.();
  };

  return (
    <SettingsLayout headerTitle="Settings">
      <SettingsSection title="General">
        <SettingsItem
          icon="user"
          iconColor="#3B82F6"
          label="Account"
          onPress={() => router.push("/edit-profile")}
        />
        <SettingsItem
          icon="bell"
          iconColor="#F59E0B"
          label="Notifications"
          onPress={() => router.push("/notifications")}
        />
        <SettingsItem
          icon="shield"
          iconColor="#10B981"
          label="Privacy & Security"
          onPress={() => router.push("/privacy-security")}
        />
      </SettingsSection>

      <SettingsSection title="Billing">
        <SettingsItem
          icon="credit-card"
          iconColor="#8B5CF6"
          label="My Payments"
          onPress={() => router.push("/my-payments")}
        />
        <SettingsItem
          icon="star"
          iconColor="#F59E0B"
          label="Subscription"
          onPress={() => router.push("/subscription")}
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsItem
          icon="log-out"
          label="Sign Out"
          onPress={handleLogout}
          isDestructive
          borderless
        />
      </SettingsSection>
    </SettingsLayout>
  );
}
