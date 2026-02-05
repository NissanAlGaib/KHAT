import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSession } from "@/context/AuthContext";
import { getPets } from "@/services/petService";
import {
  getUserProfile,
  getUserStatistics,
  type UserProfile,
  type UserStatistics,
} from "@/services/userService";
import {
  getVerificationStatus,
  type VerificationStatus,
} from "@/services/verificationService";
import { getStorageUrl } from "@/utils/imageUrl";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";

export default function ProfileScreen() {
  const { role, setRole } = useRole();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    VerificationStatus[]
  >([]);
  const [statistics, setStatistics] = useState<UserStatistics>({
    current_breeding: 0,
    total_matches: 0,
    success_rate: 0,
    income: 0,
  });
  const [activeTab, setActiveTab] = useState<"dashboard" | "pets" | "settings">(
    "dashboard"
  );
  const router = useRouter();
  const { signOut, user } = useSession();

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [profile, petsData, verification, stats] = await Promise.all([
        getUserProfile(),
        getPets(),
        user?.id ? getVerificationStatus(Number(user.id)) : Promise.resolve([]),
        getUserStatistics(),
      ]);
      setUserProfile(profile);
      setPets(petsData);
      setVerificationStatus(verification);
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load profile data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

  const getVerificationDisplay = () => {
    if (!verificationStatus || verificationStatus.length === 0)
      return { text: "Not Verified", color: "#6B7280", showButton: true, hasRejected: false, hasPending: false };
    
    const idVerification = verificationStatus.find((v) => v.auth_type === "id");
    const hasAnyRejected = verificationStatus.some((v) => v.status === "rejected");
    const hasAnyPending = verificationStatus.some((v) => v.status === "pending");
    const allApproved = verificationStatus.every((v) => v.status === "approved");
    
    // ID verification is the primary check
    if (!idVerification)
      return { text: "Not Verified", color: "#6B7280", showButton: true, hasRejected: false, hasPending: false };

    // Check for rejected documents first (highest priority)
    if (hasAnyRejected) {
      const rejectedCount = verificationStatus.filter((v) => v.status === "rejected").length;
      return {
        text: rejectedCount > 1 ? `${rejectedCount} Documents Rejected` : "Document Rejected",
        color: "#DC2626",
        showButton: true,
        hasRejected: true,
        hasPending: hasAnyPending,
      };
    }

    // Then check for pending
    if (hasAnyPending) {
      return {
        text: "Pending Verification",
        color: "#F59E0B",
        showButton: true,
        hasRejected: false,
        hasPending: true,
      };
    }

    // All approved
    if (allApproved && idVerification.status === "approved") {
      return { text: "Verified", color: "#16A34A", showButton: true, hasRejected: false, hasPending: false };
    }

    return { text: "Not Verified", color: "#6B7280", showButton: true, hasRejected: false, hasPending: false };
  };

  const handleVerifyPress = () => {
    // Always navigate to verification status screen
    router.push("/(verification)/verification-status");
  };

  const handleLogout = async () => {
    signOut?.();
  };

  // Check if user has approved ID verification
  const isIdVerified = () => {
    if (!verificationStatus || verificationStatus.length === 0) return false;
    const idVerification = verificationStatus.find((v) => v.auth_type === "id");
    return idVerification?.status === "approved";
  };

  // Handle add pet button - check verification first
  const handleAddPetPress = () => {
    if (!isIdVerified()) {
      const verification = getVerificationDisplay();
      showAlert({
        title: "Verification Required",
        message: verification.hasRejected 
          ? "Your verification was rejected. Please resubmit your document before adding a pet."
          : "You must complete identity verification before adding a pet",
        type: "warning",
        buttons: [
          {
            text: verification.hasRejected ? "View Status" : "Verify Now",
            onPress: handleVerifyPress,
          },
          { text: "Later" },
        ],
      });
      return;
    }
    router.push("/(verification)/add-pet");
  };

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return "";
    const birth = dayjs(birthdate);
    const now = dayjs();
    const years = now.diff(birth, "year");
    const months = now.diff(birth, "month") % 12;
    if (years > 0) return `${years}yr`;
    return `${months}m`;
  };

  const renderDashboard = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Breeding Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon="heart"
          label="Current Breeding"
          value={statistics.current_breeding}
          color="#FF6B4A"
        />
        <StatCard
          icon="people"
          label="Total Matches"
          value={statistics.total_matches}
          color="#3B82F6"
        />
        <StatCard
          icon="trending-up"
          label="Success Rate"
          value={`${statistics.success_rate}%`}
          color="#16A34A"
        />
        <StatCard
          icon="cash"
          label="Income"
          value={`₱${statistics.income.toFixed(2)}`}
          color="#F59E0B"
        />
      </View>
    </View>
  );

  const renderMyPets = () => {
    const statusStyles: Record<string, { label: string; style: string }> = {
      active: { label: "Available", style: "bg-green-500" },
      pending_verification: { label: "Pending", style: "bg-yellow-500" },
      disabled: { label: "Disabled", style: "bg-gray-400" },
      archived: { label: "Archived", style: "bg-red-500" },
    };

    return (
      <View style={styles.petsGrid}>
        {pets.map((pet, index) => {
          // Check if pet is on cooldown
          const isOnCooldown = pet.is_on_cooldown;
          const cooldownDaysRemaining = pet.cooldown_days_remaining;
          
          // Determine status badge to show
          let statusBadge;
          if (isOnCooldown) {
            statusBadge = {
              label: `Cooldown: ${cooldownDaysRemaining}d`,
              style: "bg-blue-500",
            };
          } else {
            statusBadge = statusStyles[pet.status] || {
              label: pet.status,
              style: "bg-gray-500",
            };
          }
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.petCardGrid}
              onPress={() => router.push(`/(pet)/pet-profile?id=${pet.pet_id}`)}
            >
<Image
                source={
                  pet.photos?.length > 0
                    ? {
                        uri: getStorageUrl(pet.photos.find((p: any) => p.is_primary)?.photo_url || pet.photos[0].photo_url),
                      }
                    : require("@/assets/images/icon.png")
                }
                style={styles.petImageGrid}
              />
              <View style={styles.petInfoGrid}>
                <View>
                  <Text style={styles.petNameTextGrid}>{pet.name}</Text>
                  <Text style={styles.petInfoTextGrid}>
                    {pet.breed} • {calculateAge(pet.birthdate)}
                  </Text>
                </View>
              </View>
              <View
                className={`absolute top-2 right-2 px-2 py-1 rounded-full ${statusBadge.style}`}
              >
                <Text className="text-white text-xs font-bold">
                  {statusBadge.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderSettings = () => {
    // Check if user has both Breeder and Shooter roles
    const hasBothRoles = userProfile?.roles && 
      userProfile.roles.some(r => r.role_type === "Breeder") &&
      userProfile.roles.some(r => r.role_type === "Shooter");

    return (
      <View style={styles.tabContent}>
        {hasBothRoles && (
          <SettingsCard title="Role">
            <View style={styles.roleSwitcher}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "Breeder" && styles.roleActive,
                ]}
                onPress={() => setRole("Breeder")}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "Breeder" && styles.roleTextActive,
                  ]}
                >
                  Breeder
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === "Shooter" && styles.roleActive]}
                onPress={() => setRole("Shooter")}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "Shooter" && styles.roleTextActive,
                  ]}
                >
                  Shooter
                </Text>
              </TouchableOpacity>
            </View>
          </SettingsCard>
        )}
        <SettingsItem
          icon="user"
          title="Account"
          description="Update personal information"
          onPress={() => router.push("/edit-profile")}
        />
        <SettingsItem
          icon="bell"
          title="Notifications"
          description="Manage notifications"
          onPress={() => router.push("/notifications")}
        />
        <SettingsItem
          icon="shield"
          title="Privacy & Security"
          description="Control your privacy"
          onPress={() => router.push("/privacy-security")}
        />
        <SettingsItem
          icon="log-out"
          title="Sign Out"
          description="Log out of your account"
          onPress={handleLogout}
          isDestructive
        />
      </View>
    );
  };

  const renderTabContent = () => {
    if (loading)
      return (
        <ActivityIndicator
          size="large"
          color="#FF6B4A"
          style={{ marginTop: 50 }}
        />
      );
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "pets":
        return renderMyPets();
      case "settings":
        return renderSettings();
      default:
        return null;
    }
  };

  const verification = getVerificationDisplay();

  return (
    <SafeAreaView style={styles.flex_1} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.flex_1}>
        <LinearGradient
          colors={["#FF6B4A", "#FF9A8B"]}
          style={styles.headerGradient}
        >
<Image
            source={
              userProfile?.profile_image
                ? {
                    uri: getStorageUrl(userProfile.profile_image),
                  }
                : require("@/assets/images/icon.png")
            }
            style={styles.profilePic}
          />
          <Text style={styles.userName}>
            {userProfile?.name || user?.name || "User"}
          </Text>
          <View style={styles.verificationBadge}>
            <Text
              style={[styles.verificationText, { color: verification.color }]}
            >
              {verification.text}
            </Text>
          </View>
          {verification.showButton && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyPress}
            >
              <Text style={styles.verifyButtonText}>
                {verification.hasRejected
                  ? "View Status"
                  : verification.text === "Verified"
                  ? "View Status"
                  : "Verify Now"}
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View style={styles.tabContainer}>
          <TabButton
            title="Dashboard"
            isActive={activeTab === "dashboard"}
            onPress={() => setActiveTab("dashboard")}
          />
          <TabButton
            title="My Pets"
            isActive={activeTab === "pets"}
            onPress={() => setActiveTab("pets")}
          />
          <TabButton
            title="Settings"
            isActive={activeTab === "settings"}
            onPress={() => setActiveTab("settings")}
          />
        </View>

        {renderTabContent()}
      </ScrollView>

      {activeTab === "pets" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddPetPress}
        >
          <Feather name="plus" size={30} color="white" />
        </TouchableOpacity>
      )}

      <AlertModal {...{ visible, ...alertOptions, onClose: hideAlert }} />
    </SafeAreaView>
  );
}

// Components
const TabButton = ({
  title,
  isActive,
  onPress,
}: {
  title: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.tabButton, isActive && styles.tabActive]}
  >
    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SettingsCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.settingsCard}>
    <Text style={styles.settingsCardTitle}>{title}</Text>
    {children}
  </View>
);

const SettingsItem = ({
  icon,
  title,
  description,
  onPress,
  isDestructive,
}: {
  icon: any;
  title: string;
  description: string;
  onPress: () => void;
  isDestructive?: boolean;
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <Feather
      name={icon}
      size={24}
      color={isDestructive ? "#DC2626" : "#FF6B4A"}
    />
    <View style={styles.settingsInfo}>
      <Text
        style={[styles.settingsTitle, isDestructive && { color: "#DC2626" }]}
      >
        {title}
      </Text>
      <Text style={styles.settingsDescription}>{description}</Text>
    </View>
    <Feather name="chevron-right" size={24} color="#9CA3AF" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  flex_1: { flex: 1, backgroundColor: "#F8F9FA", marginBottom: 40 },
  headerGradient: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "white",
    marginBottom: 12,
  },
  userName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  verificationBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verificationText: { fontWeight: "bold", fontSize: 14 },
  verifyButton: {
    marginTop: 12,
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  verifyButtonText: { color: "#FF6B4A", fontWeight: "bold" },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginTop: -25,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 6,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 20,
  },
  tabActive: { backgroundColor: "#FF6B4A" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#555" },
  tabTextActive: { color: "white" },
  tabContent: { padding: 20 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "white",
    width: "48%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#111" },
  statLabel: { fontSize: 14, color: "#666", marginTop: 4 },
  petsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  petCardGrid: {
    width: "48%",
    aspectRatio: 0.8,
    marginBottom: "4%",
    borderRadius: 20,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  petImageGrid: { width: "100%", height: "100%" },
  petInfoGrid: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  petNameTextGrid: { fontSize: 16, fontWeight: "bold", color: "white" },
  petInfoTextGrid: { fontSize: 13, color: "white", opacity: 0.9 },
  settingsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  settingsCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 12,
  },
  roleSwitcher: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: "center",
  },
  roleActive: { backgroundColor: "#FF6B4A" },
  roleText: { fontWeight: "bold", color: "#333" },
  roleTextActive: { color: "white" },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingsInfo: { flex: 1, marginLeft: 16 },
  settingsTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  settingsDescription: { fontSize: 13, color: "#777", marginTop: 2 },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B4A",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
});
