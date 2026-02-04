import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getPet } from "@/services/petService";
import { getStorageUrl } from "@/utils/imageUrl";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";

// Document status type used by rows and helpers in this screen
type DocumentStatus = "valid" | "expired" | "expiring";

// Determine a document status from an expiration date.
// - returns 'expired' when expiration date is in the past
// - returns 'expiring' when expiration is within 30 days
// - returns 'valid' otherwise
const getDocumentStatus = (expirationDate?: string | null): DocumentStatus => {
  if (!expirationDate) return "valid";
  const exp = dayjs(expirationDate);
  const now = dayjs();
  if (exp.isBefore(now, "day")) return "expired";
  const daysDiff = exp.diff(now, "day");
  if (daysDiff <= 30) return "expiring";
  return "valid";
};

// Count documents by the normalized statuses used in this file
const countDocumentsByStatus = (
  documents: any[] | undefined,
  expirationDateField: string = "expiration_date"
): { expired: number; expiringSoon: number } => {
  let expired = 0;
  let expiringSoon = 0;

  if (documents) {
    documents.forEach((doc: any) => {
      const expirationDate = doc[expirationDateField];
      const status = getDocumentStatus(expirationDate);
      if (status === "expired") expired++;
      else if (status === "expiring") expiringSoon++;
    });
  }

  return { expired, expiringSoon };
};

// Map status to a simple color used for the small status dot
const getStatusColor = (status: DocumentStatus) => {
  switch (status) {
    case "expired":
      return "#EF4444"; // red-500
    case "expiring":
      return "#F59E0B"; // amber-500
    case "valid":
    default:
      return "#22C55E"; // green-500
  }
};

// Return tailwind-like class strings for badge background/text so existing className usage keeps working
const getStatusBadge = (status: DocumentStatus) => {
  switch (status) {
    case "expired":
      return { label: "Expired", bg: "bg-red-100", text: "text-red-700" };
    case "expiring":
      return {
        label: "Expiring",
        bg: "bg-yellow-100",
        text: "text-yellow-800",
      };
    case "valid":
    default:
      return { label: "Valid", bg: "bg-green-100", text: "text-green-700" };
  }
};

export default function PetProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.id as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const [isEnabled, setIsEnabled] = useState(true);
  const [petData, setPetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "health" | "gallery">(
    "about"
  );

  const fetchPetData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPet(parseInt(petId));
      setPetData(data);
      setIsEnabled(data.status === "active");
    } catch (error) {
      console.error("Error fetching pet data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load pet data.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [petId, showAlert]);

  useEffect(() => {
    if (petId) fetchPetData();
  }, [petId, fetchPetData]);

  const documentStats = useMemo(() => {
    if (!petData) return { expiredCount: 0, expiringSoonCount: 0 };
    const vaccinationStats = countDocumentsByStatus(petData.vaccinations);
    const healthRecordStats = countDocumentsByStatus(petData.health_records);
    return {
      expiredCount: vaccinationStats.expired + healthRecordStats.expired,
      expiringSoonCount:
        vaccinationStats.expiringSoon + healthRecordStats.expiringSoon,
    };
  }, [petData]);

  const calculateAge = (birthdate: string) => {
    const birth = dayjs(birthdate);
    const now = dayjs();
    const years = now.diff(birth, "year");
    const months = now.diff(birth, "month") % 12;
    if (years > 0) return `${years} Year${years > 1 ? "s" : ""}`;
    return `${months} Month${months > 1 ? "s" : ""}`;
  };

  const handleEditInfo = () => console.log("Navigate to edit pet info");
  const handleVaccinationPress = (vaccinationName: string) => {
    router.push(
      `/(pet)/(history)/vaccination-history?vaccine=${vaccinationName}&petId=${petId}`
    );
  };
  const handleHealthRecordPress = (recordType: string) => {
    router.push(
      `/(pet)/(history)/health-history?type=${recordType}&petId=${petId}`
    );
  };
  const handleResubmitVaccination = (vaccination: any) => {
    router.push(
      `/(verification)/resubmit-document?type=vaccination&petId=${petId}&petName=${petData.name}&vaccinationId=${vaccination.vaccination_id}&vaccineName=${vaccination.vaccine_name}`
    );
  };
  const handleResubmitHealthRecord = (record: any) => {
    router.push(
      `/(verification)/resubmit-document?type=health_record&petId=${petId}&petName=${petData.name}&healthRecordId=${record.health_record_id}&recordType=${record.record_type}`
    );
  };
  const handleAddPhoto = () => {
    console.log("Add photo");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.flex_1} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B4A" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!petData) {
    return (
      <SafeAreaView style={styles.flex_1} edges={["top"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Pet not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderAbout = () => (
    <View style={styles.tabContent}>
      {/* Description */}
      <InfoCard icon="information-circle-outline" title="About Me">
        <Text style={styles.cardText}>
          {petData.description || "No description available."}
        </Text>
      </InfoCard>

      {/* Details */}
      <InfoCard icon="paw-outline" title="Details">
        <DetailRow label="Breed" value={petData.breed} />
        <DetailRow label="Age" value={calculateAge(petData.birthdate)} />
        <DetailRow label="Sex" value={petData.sex} />
        <DetailRow label="Weight" value={`${petData.weight} kg`} />
        <DetailRow label="Height" value={`${petData.height} cm`} />
        {petData.microchip_id && (
          <DetailRow label="Microchip ID" value={petData.microchip_id} />
        )}
      </InfoCard>

      {/* Behavior */}
      <InfoCard icon="happy-outline" title="Behavior">
        {petData.behaviors && petData.behaviors.length > 0 ? (
          <View style={styles.tagContainer}>
            {petData.behaviors.map((item: string, index: number) => (
              <Tag key={`beh-${index}`} label={item} color="blue" />
            ))}
          </View>
        ) : (
          <Text style={styles.cardText}>No behaviors listed.</Text>
        )}
      </InfoCard>

      {/* Attributes */}
      <InfoCard icon="color-palette-outline" title="Attributes">
        {petData.attributes && petData.attributes.length > 0 ? (
          <View style={styles.tagContainer}>
            {petData.attributes.map((item: string, index: number) => (
              <Tag key={`attr-${index}`} label={item} color="red" />
            ))}
          </View>
        ) : (
          <Text style={styles.cardText}>No attributes listed.</Text>
        )}
      </InfoCard>
    </View>
  );

  const renderHealth = () => (
    <View style={styles.tabContent}>
      {/* Health Status Summary */}
      <InfoCard icon="shield-checkmark-outline" title="Health Overview">
        <StatusSummaryRow
          label="Microchipped"
          status={petData.microchip_id ? "valid" : "missing"}
        />
        <StatusSummaryRow
          label="Expired Documents"
          count={documentStats.expiredCount}
          status="expired"
        />
        <StatusSummaryRow
          label="Expiring Soon"
          count={documentStats.expiringSoonCount}
          status="expiring"
        />
      </InfoCard>

      {/* Vaccinations */}
      <InfoCard icon="eyedrop-outline" title="Vaccinations">
        {petData.vaccinations && petData.vaccinations.length > 0 ? (
          petData.vaccinations.map((v: any, i: number) => {
            const status = getDocumentStatus(v.expiration_date);
            return (
              <DocumentRow
                key={`vacc-${i}`}
                item={v}
                title={v.vaccine_name}
                expiry={v.expiration_date}
                status={status}
                onPress={() => handleVaccinationPress(v.vaccine_name)}
                onResubmit={() => handleResubmitVaccination(v)}
              />
            );
          })
        ) : (
          <Text style={styles.cardText}>No vaccination records.</Text>
        )}
      </InfoCard>

      {/* Health Records */}
      <InfoCard icon="document-text-outline" title="Health Records">
        {petData.health_records && petData.health_records.length > 0 ? (
          petData.health_records.map((r: any, i: number) => {
            const status = r.expiration_date
              ? getDocumentStatus(r.expiration_date)
              : "valid";
            return (
              <DocumentRow
                key={`rec-${i}`}
                item={r}
                title={r.record_type}
                expiry={r.expiration_date}
                status={status}
                onPress={() => handleHealthRecordPress(r.record_type)}
                onResubmit={
                  r.expiration_date
                    ? () => handleResubmitHealthRecord(r)
                    : undefined
                }
              />
            );
          })
        ) : (
          <Text style={styles.cardText}>No health records.</Text>
        )}
      </InfoCard>
    </View>
  );

  const renderGallery = () => (
    <View style={styles.galleryContainer}>
      {petData.photos && petData.photos.length > 0 ? (
        <View style={styles.photoGrid}>
          {petData.photos.map((photo: any, index: number) => (
            <View key={`photo-${index}`} style={styles.photoContainer}>
              <Image
                source={{ uri: getStorageUrl(photo.photo_url)! }}
                style={styles.photo}
              />
            </View>
          ))}
          <TouchableOpacity
            onPress={handleAddPhoto}
            style={[styles.photoContainer, styles.addPhotoBtn]}
          >
            <Feather name="plus" size={40} color="#FF6B4A" />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.center}>
          <TouchableOpacity
            onPress={handleAddPhoto}
            style={styles.emptyGalleryBtn}
          >
            <Feather name="camera" size={50} color="#999" />
            <Text style={styles.emptyGalleryText}>
              No photos yet. Tap to add one!
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "about":
        return renderAbout();
      case "health":
        return renderHealth();
      case "gallery":
        return renderGallery();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.flex_1} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.flex_1}>
        {/* Header */}
        <LinearGradient
          colors={["#FF6B4A", "#FF9A8B"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Feather name="arrow-left" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEditInfo}
              style={styles.headerButton}
            >
              <Feather name="edit" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Profile Pic & Name */}
        <View style={styles.profileHeader}>
          <View style={styles.profilePicContainer}>
            <Image
              source={
                petData.profile_image
                  ? { uri: getStorageUrl(petData.profile_image)! }
                  : require("@/assets/images/icon.png")
              }
              style={styles.profilePic}
            />
          </View>
          <Text style={styles.petName}>{petData.name}</Text>
          
          {/* Status and Cooldown Indicators */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                !isEnabled && styles.statusDisabled,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  !isEnabled && styles.statusTextDisabled,
                ]}
              >
                {isEnabled ? "Active" : "Disabled"}
              </Text>
            </View>
            
            {/* Cooldown Badge */}
            {petData.is_on_cooldown && (
              <View style={styles.cooldownIndicator}>
                <Ionicons name="time-outline" size={14} color="#1D4ED8" />
                <Text style={styles.cooldownText}>
                  Cooldown: {petData.cooldown_days_remaining} days
                </Text>
              </View>
            )}
          </View>
          
          {/* Cooldown Info Card */}
          {petData.is_on_cooldown && petData.cooldown_until && (
            <View style={styles.cooldownCard}>
              <Ionicons name="information-circle-outline" size={20} color="#1D4ED8" />
              <View style={styles.cooldownCardContent}>
                <Text style={styles.cooldownCardTitle}>Breeding Cooldown Active</Text>
                <Text style={styles.cooldownCardText}>
                  This pet cannot be matched until {dayjs(petData.cooldown_until).format("MMMM D, YYYY")}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TabButton
            title="About"
            isActive={activeTab === "about"}
            onPress={() => setActiveTab("about")}
          />
          <TabButton
            title="Health"
            isActive={activeTab === "health"}
            onPress={() => setActiveTab("health")}
          />
          <TabButton
            title="Gallery"
            isActive={activeTab === "gallery"}
            onPress={() => setActiveTab("gallery")}
          />
        </View>

        {renderTabContent()}
      </ScrollView>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const InfoCard = ({
  icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Ionicons name={icon} size={22} color="#FF6B4A" />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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

const Tag = ({ label, color }: { label: string; color: "blue" | "red" }) => {
  const baseStyle = "rounded-full px-3 py-1.5 border";
  const colorStyle =
    color === "blue"
      ? "bg-blue-100 border-blue-200"
      : "bg-red-100 border-red-200";
  const textStyle = color === "blue" ? "text-blue-800" : "text-red-800";

  return (
    <View className={`${baseStyle} ${colorStyle}`}>
      <Text className={`${textStyle} text-xs font-medium`}>{label}</Text>
    </View>
  );
};

const StatusSummaryRow = ({
  label,
  count,
  status,
}: {
  label: string;
  count?: number;
  status: "valid" | "missing" | "expired" | "expiring";
}) => {
  const statusInfo: {
    [key: string]: { icon: any; color: string; text: string };
  } = {
    valid: { icon: "checkmark-circle", color: "#22C55E", text: "Yes" },
    missing: { icon: "close-circle", color: "#6B7280", text: "No" },
    expired: {
      icon: "alert-circle",
      color: "#EF4444",
      text: `${count} Document${count !== 1 ? "s" : ""}`,
    },
    expiring: {
      icon: "time",
      color: "#F59E0B",
      text: `${count} Document${count !== 1 ? "s" : ""}`,
    },
  };
  const current = statusInfo[status];

  return (
    <View style={styles.summaryRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.summaryStatus}>
        <Ionicons name={current.icon} size={20} color={current.color} />
        <Text style={[styles.summaryStatusText, { color: current.color }]}>
          {current.text}
        </Text>
      </View>
    </View>
  );
};

const DocumentRow = ({
  item,
  title,
  expiry,
  status,
  onPress,
  onResubmit,
}: {
  item: any;
  title: string;
  expiry?: string;
  status: DocumentStatus;
  onPress: () => void;
  onResubmit?: () => void;
}) => {
  const isExpired = status === "expired";
  const badge = getStatusBadge(status);
  return (
    <View style={styles.documentRow}>
      <TouchableOpacity onPress={onPress} style={styles.documentTouchable}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(status) },
          ]}
        />
        <View style={styles.flex_1}>
          <Text style={styles.documentTitle}>{title}</Text>
          {expiry && (
            <Text style={styles.documentSubtitle}>
              Expires: {dayjs(expiry).format("MMMM D, YYYY")}
            </Text>
          )}
        </View>
        <View className={`${badge.bg} rounded-full px-3 py-1`}>
          <Text className={`${badge.text} text-xs font-semibold`}>
            {badge.label}
          </Text>
        </View>
      </TouchableOpacity>
      {isExpired && onResubmit && (
        <TouchableOpacity onPress={onResubmit} style={styles.resubmitButton}>
          <Feather name="upload" size={16} color="white" />
          <Text style={styles.resubmitText}>Resubmit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex_1: { flex: 1, backgroundColor: "#FDF4F4" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  loadingText: { marginTop: 10, color: "#555" },
  errorText: { color: "#B91C1C" },
  headerGradient: {
    height: 160,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  headerButton: { padding: 8 },
  profileHeader: {
    alignItems: "center",
    marginTop: -80, // Overlap with header
  },
  profilePicContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  profilePic: { width: 130, height: 130, borderRadius: 65 },
  petName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C2C2C",
    marginTop: 12,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  statusIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#D1FAE5", // green-100
  },
  statusDisabled: {
    backgroundColor: "#F3F4F6", // gray-100
  },
  statusText: {
    color: "#065F46", // green-800
    fontWeight: "600",
  },
  statusTextDisabled: {
    color: "#374151", // gray-700
  },
  cooldownIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#DBEAFE", // blue-100
    gap: 4,
  },
  cooldownText: {
    color: "#1D4ED8", // blue-700
    fontWeight: "600",
    fontSize: 13,
  },
  cooldownCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF", // blue-50
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE", // blue-200
  },
  cooldownCardContent: {
    marginLeft: 8,
    flex: 1,
  },
  cooldownCardTitle: {
    color: "#1E40AF", // blue-800
    fontWeight: "bold",
    fontSize: 14,
  },
  cooldownCardText: {
    color: "#1D4ED8", // blue-700
    fontSize: 13,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: "#FF6B4A",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  tabTextActive: {
    color: "white",
  },
  tabContent: {
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  cardText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 15,
    color: "#555",
  },
  detailValue: {
    fontSize: 15,
    color: "#111",
    fontWeight: "bold",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryStatusText: {
    marginLeft: 8,
    fontWeight: "600",
  },
  documentRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  documentTouchable: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  documentSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  resubmitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
  },
  resubmitText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  galleryContainer: {
    padding: 10,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  photoContainer: {
    width: "48%",
    aspectRatio: 1,
    marginBottom: "4%",
    borderRadius: 15,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  addPhotoBtn: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD1C9",
    borderStyle: "dashed",
  },
  addPhotoText: {
    color: "#FF6B4A",
    marginTop: 8,
    fontWeight: "bold",
  },
  emptyGalleryBtn: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyGalleryText: {
    marginTop: 15,
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
});
