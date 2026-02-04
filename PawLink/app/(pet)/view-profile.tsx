import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getPetPublicProfile,
  getPetLitters,
  type PetPublicProfile,
  type Litter,
} from "@/services/petService";
import { sendMatchRequest, createMatchPayment } from "@/services/matchRequestService";
import { verifyPayment } from "@/services/paymentService";
import { usePet } from "@/context/PetContext";\r
import { getStorageUrl } from "@/utils/imageUrl";\r
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

type DocumentStatus = "valid" | "expiring_soon" | "expired";

const getDocumentStatus = (status: string): DocumentStatus => {
  if (status === "expired") return "expired";
  if (status === "expiring_soon") return "expiring_soon";
  return "valid";
};

const getStatusColor = (status: DocumentStatus): string => {
  if (status === "expired") return "#EF4444"; // red-500
  if (status === "expiring_soon") return "#F59E0B"; // yellow-500
  return "#22C55E"; // green-500
};

const getStatusBadge = (status: DocumentStatus) => {
  if (status === "expired") return { bg: "bg-red-100", text: "text-red-700", label: "Expired" };
  if (status === "expiring_soon") return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Expiring" };
  return { bg: "bg-green-100", text: "text-green-700", label: "Valid" };
};

export default function ViewPetProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.id as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const { selectedPet } = usePet();

  const [petData, setPetData] = useState<PetPublicProfile | null>(null);
  const [litters, setLitters] = useState<Litter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "health" | "gallery" | "litters">("about");
  const [pendingPaymentId, setPendingPaymentId] = useState<number | null>(null);
  const [pendingMatchData, setPendingMatchData] = useState<{requesterPetId: number, targetPetId: number} | null>(null);

  const fetchPetData = useCallback(async () => {
    try {
      setLoading(true);
      const [profile, litterData] = await Promise.all([
        getPetPublicProfile(parseInt(petId)),
        getPetLitters(parseInt(petId)),
      ]);
      setPetData(profile);
      setLitters(litterData);
    } catch (error) {
      console.error("Error fetching pet data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load pet profile",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [petId, showAlert]);

  useEffect(() => {
    if (petId) {
      fetchPetData();
    }
  }, [petId, fetchPetData]);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined;
    return getStorageUrl(path) ?? undefined;
  };

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return "";
    const birth = dayjs(birthdate);
    const now = dayjs();
    const years = now.diff(birth, "year");
    const months = now.diff(birth, "month") % 12;
    if (years > 0) return `${years} Year${years > 1 ? "s" : ""}`;
    return `${months} Month${months > 1 ? "s" : ""}`;
  };

  const handlePaymentForMatch = async (requesterPetId: number, targetPetId: number, amount: number) => {
    try {
      // Show payment confirmation dialog
      showAlert({
        title: "Payment Required",
        message: `As a free tier user, you need to pay ₱${amount} to send a match request. This helps ensure quality matches.`,
        type: "info",
        buttons: [
          { 
            text: "Pay Now", 
            onPress: async () => {
              await initiateMatchPayment(requesterPetId, targetPetId);
            }
          },
          { 
            text: "Upgrade", 
            onPress: () => {
              router.push("/subscription");
            }
          },
          { text: "Cancel" },
        ],
      });
    } catch (error) {
      console.error("Payment error:", error);
      showAlert({
        title: "Error",
        message: "Failed to process payment. Please try again.",
        type: "error",
      });
    }
  };

  const initiateMatchPayment = async (requesterPetId: number, targetPetId: number) => {
    try {
      const successUrl = "https://pawlink.app/match/payment/success";
      const cancelUrl = "https://pawlink.app/match/payment/cancel";

      const paymentResult = await createMatchPayment(
        requesterPetId,
        targetPetId,
        successUrl,
        cancelUrl
      );

      if (paymentResult.success && paymentResult.data?.checkout_url) {
        setPendingPaymentId(paymentResult.data.payment_id);
        setPendingMatchData({ requesterPetId, targetPetId });
        
        const canOpen = await Linking.canOpenURL(paymentResult.data.checkout_url);
        if (canOpen) {
          await Linking.openURL(paymentResult.data.checkout_url);
          showAlert({
            title: "Complete Your Payment",
            message: "After completing payment, tap 'Verify Payment' to send your match request.",
            type: "info",
            buttons: [
              { 
                text: "Verify Payment", 
                onPress: () => verifyMatchPayment()
              },
              { text: "Cancel", onPress: () => {
                setPendingPaymentId(null);
                setPendingMatchData(null);
              }},
            ],
          });
        } else {
          throw new Error("Cannot open payment URL");
        }
      } else {
        showAlert({
          title: "Payment Error",
          message: paymentResult.message || "Failed to create payment session",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      showAlert({
        title: "Error",
        message: "Failed to initiate payment. Please try again.",
        type: "error",
      });
    }
  };

  const verifyMatchPayment = async (retryCount = 0) => {
    if (!pendingPaymentId || !pendingMatchData) return;

    try {
      const verifyResult = await verifyPayment(pendingPaymentId);
      
      console.log("Payment verification result:", verifyResult);
      
      if (verifyResult.success && verifyResult.data?.status === "paid") {
        // Payment successful, now send the match request
        console.log("Payment verified as paid, sending match request:", pendingMatchData);
        
        const matchResult = await sendMatchRequest(
          pendingMatchData.requesterPetId,
          pendingMatchData.targetPetId
        );

        console.log("Match request result:", matchResult);

        setPendingPaymentId(null);
        setPendingMatchData(null);

        showAlert({
          title: matchResult.success ? "Request Sent!" : "Request Failed",
          message: matchResult.success 
            ? "Payment verified and match request sent successfully!" 
            : matchResult.message,
          type: matchResult.success ? "success" : "error",
        });
      } else if (verifyResult.data?.status === "expired") {
        setPendingPaymentId(null);
        setPendingMatchData(null);
        showAlert({
          title: "Payment Expired",
          message: "The payment session has expired. Please try again.",
          type: "error",
        });
      } else {
        // Payment not yet confirmed - may need to wait for PayMongo to process
        if (retryCount < 3) {
          // Auto-retry after a short delay (PayMongo may take a few seconds to process)
          showAlert({
            title: "Verifying Payment...",
            message: "Please wait while we verify your payment.",
            type: "info",
          });
          
          setTimeout(() => {
            verifyMatchPayment(retryCount + 1);
          }, 2000);
        } else {
          showAlert({
            title: "Payment Pending",
            message: "We haven't received your payment confirmation yet. Please wait a moment and try again.",
            type: "info",
            buttons: [
              { text: "Check Again", onPress: () => verifyMatchPayment(0) },
              { text: "Cancel", onPress: () => {
                setPendingPaymentId(null);
                setPendingMatchData(null);
              }},
            ],
          });
        }
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      showAlert({
        title: "Error",
        message: "Failed to verify payment. Please try again.",
        type: "error",
        buttons: [
          { text: "Retry", onPress: () => verifyMatchPayment(0) },
          { text: "Cancel", onPress: () => {
            setPendingPaymentId(null);
            setPendingMatchData(null);
          }},
        ],
      });
    }
  };

  const handleMatchRequest = async () => {
    if (!selectedPet) {
      showAlert({
        title: "No Pet Selected",
        message: "Please select one of your pets to send a match request.",
        type: "warning",
      });
      return;
    }
    if (sendingRequest) return;
    setSendingRequest(true);
    try {
      const result = await sendMatchRequest(selectedPet.pet_id, parseInt(petId));
      
      // Check if payment is required (free tier user)
      if (result.requires_payment && result.payment_amount) {
        await handlePaymentForMatch(
          result.requester_pet_id!,
          result.target_pet_id!,
          result.payment_amount
        );
      } else {
        showAlert({
          title: result.success ? "Request Sent!" : "Request Failed",
          message: result.message,
          type: result.success ? "success" : "error",
        });
      }
    } catch {
      showAlert({
        title: "Error",
        message: "Failed to send match request. Please try again.",
        type: "error",
      });
    } finally {
      setSendingRequest(false);
    }
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
      <InfoCard icon="information-circle-outline" title="About Me">
        <Text style={styles.cardText}>{petData.description || "No description available."}</Text>
      </InfoCard>

      <InfoCard icon="person-outline" title="Owner">
        <View style={styles.ownerContainer}>
          <Image
            source={{ uri: getImageUrl(petData.owner.profile_image) }}
            style={styles.ownerImage}
          />
          <View>
            <Text style={styles.ownerName}>{petData.owner.name}</Text>
            <Text style={styles.cardText}>{petData.name}&apos;s Owner</Text>
          </View>
        </View>
      </InfoCard>

      <InfoCard icon="paw-outline" title="Details">
        <DetailRow label="Breed" value={petData.breed} />
        <DetailRow label="Age" value={calculateAge(petData.birthdate)} />
        <DetailRow label="Sex" value={petData.sex} />
        <DetailRow label="Weight" value={`${petData.weight} kg`} />
        <DetailRow label="Height" value={`${petData.height} cm`} />
      </InfoCard>
      
      <InfoCard icon="heart-outline" title="Preferences">
          {petData.preferences && petData.preferences.length > 0 ? (
              <View style={styles.tagContainer}>
                  {petData.preferences.map((item: string, index: number) => (
                      <Tag key={`pref-${index}`} label={item} color="green" />
                  ))}
              </View>
          ) : (
              <Text style={styles.cardText}>No preferences listed.</Text>
          )}
      </InfoCard>
    </View>
  );

  const renderHealth = () => (
    <View style={styles.tabContent}>
      <InfoCard icon="shield-checkmark-outline" title="Health Overview">
        <StatusSummaryRow
          label="Microchipped"
          status={petData.microchip_id ? 'valid' : 'missing'}
        />
      </InfoCard>
      
      <InfoCard icon="eyedrop-outline" title="Vaccinations">
        {(petData.vaccinations && petData.vaccinations.length > 0) ? (
          petData.vaccinations.map((v, i) => (
            <DocumentRow
              key={`vacc-${i}`}
              title={v.vaccine_name}
              expiry={v.expiration_date}
              status={getDocumentStatus(v.status)}
            />
          ))
        ) : (
          <Text style={styles.cardText}>No vaccination records available.</Text>
        )}
      </InfoCard>
      
      <InfoCard icon="document-text-outline" title="Health Records">
        {(petData.health_records && petData.health_records.length > 0) ? (
          petData.health_records.map((r, i) => (
            <DocumentRow
              key={`rec-${i}`}
              title={r.record_type}
              given={r.given_date}
              status="valid"
            />
          ))
        ) : (
          <Text style={styles.cardText}>No health records available.</Text>
        )}
      </InfoCard>
    </View>
  );

  const renderGallery = () => (
    <View style={styles.galleryContainer}>
      {(petData.photos && petData.photos.length > 0) ? (
          <View style={styles.photoGrid}>
              {petData.photos.map((photo, index) => (
                  <View key={`photo-${index}`} style={styles.photoContainer}>
                      <Image
                          source={{ uri: getImageUrl(photo.photo_url) }}
                          style={styles.photo}
                      />
                  </View>
              ))}
          </View>
      ) : (
        <View style={styles.center}>
          <Ionicons name="images-outline" size={50} color="#999" />
          <Text style={styles.emptyGalleryText}>This pet has no photos yet.</Text>
        </View>
      )}
    </View>
  );

  const renderLitters = () => (
    <View style={styles.tabContent}>
      {litters.length > 0 ? (
        litters.map((litter) => (
          <InfoCard key={litter.litter_id} icon="list-outline" title={litter.title}>
            <DetailRow label="Status" value={litter.status} />
            <DetailRow label="Birth Date" value={litter.birth_date} />
            <TouchableOpacity 
              style={styles.viewLitterButton}
              onPress={() => router.push(`/(pet)/litter-detail?id=${litter.litter_id}`)}
            >
              <Text style={styles.viewLitterText}>View Litter Details</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </InfoCard>
        ))
      ) : (
        <InfoCard icon="list-outline" title="Litters">
          <Text style={styles.cardText}>No litters to show.</Text>
        </InfoCard>
      )}
    </View>
  );
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "about": return renderAbout();
      case "health": return renderHealth();
      case "gallery": return renderGallery();
      case "litters": return renderLitters();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.flex_1} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.flex_1}>
        <LinearGradient colors={["#FF6B4A", "#FF9A8B"]} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Feather name="arrow-left" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Feather name="more-vertical" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.profileHeader}>
            <View style={styles.profilePicContainer}>
                <Image
                    source={{ uri: getImageUrl(petData.profile_image) }}
                    style={styles.profilePic}
                />
            </View>
            <Text style={styles.petName}>{petData.name}</Text>
            
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButton}>
                    <Feather name="star" size={24} color="#FF6B4A" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.mainActionButton]}
                  onPress={handleMatchRequest}
                  disabled={sendingRequest}
                >
                  {sendingRequest ? <ActivityIndicator size="small" color="white" /> : <Feather name="heart" size={28} color="white" />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    if (!selectedPet) {
                      showAlert({
                        title: "No Pet Selected",
                        message: "Please select one of your pets to see AI offspring prediction.",
                        type: "warning",
                      });
                      return;
                    }
                    const primaryPhoto = selectedPet.photos?.find((p) => p.is_primary) || selectedPet.photos?.[0];
                    router.push({
                      pathname: "/(pet)/ai-offspring",
                      params: {
                        pet1Name: selectedPet.name,
                        pet2Name: petData?.name || "Unknown",
                        pet1Photo: primaryPhoto?.photo_url || "",
                        pet2Photo: petData?.profile_image || "",
                        pet1Breed: selectedPet.breed || "Unknown",
                        pet2Breed: petData?.breed || "Unknown",
                        compatibilityScore: "85",
                      },
                    });
                  }}
                >
                  <Image
                    source={require("@/assets/images/AI_Rec.png")}
                    style={styles.aiRecButtonIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Feather name="message-circle" size={24} color="#4B5563" />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.tabContainer}>
          <TabButton title="About" isActive={activeTab === "about"} onPress={() => setActiveTab("about")} />
          <TabButton title="Health" isActive={activeTab === "health"} onPress={() => setActiveTab("health")} />
          <TabButton title="Gallery" isActive={activeTab === "gallery"} onPress={() => setActiveTab("gallery")} />
          <TabButton title="Litters" isActive={activeTab === "litters"} onPress={() => setActiveTab("litters")} />
        </View>
        
        {renderTabContent()}
      </ScrollView>

      <AlertModal {...{ visible, ...alertOptions, onClose: hideAlert }} />
    </SafeAreaView>
  );
}

// Reusable Components
const InfoCard = ({ icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
  <View style={styles.card}>
      <View style={styles.cardHeader}>
          <Ionicons name={icon} size={22} color="#FF6B4A" />
          <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
  </View>
);

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const TabButton = ({ title, isActive, onPress }: { title: string, isActive: boolean, onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={[styles.tabButton, isActive && styles.tabActive]}>
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{title}</Text>
  </TouchableOpacity>
);

const Tag = ({ label, color }: { label: string, color: 'blue' | 'red' | 'green' }) => {
  const colorStyles = {
    blue: "bg-blue-100 border-blue-200 text-blue-800",
    red: "bg-red-100 border-red-200 text-red-800",
    green: "bg-green-100 border-green-200 text-green-800",
  };
  const style = colorStyles[color] || colorStyles.blue;
  return (
    <View className={`rounded-full px-3 py-1.5 border ${style.split(' ')[0]} ${style.split(' ')[1]}`}>
      <Text className={`text-xs font-medium ${style.split(' ')[2]}`}>{label}</Text>
    </View>
  );
};

const StatusSummaryRow = ({ label, count, status }: { label: string, count?: number, status: 'valid' | 'missing' | 'expired' | 'expiring' }) => {
    const info = {
        valid: { icon: 'checkmark-circle', color: '#22C55E', text: 'Yes' },
        missing: { icon: 'close-circle', color: '#6B7280', text: 'Not Present' },
        expired: { icon: 'alert-circle', color: '#EF4444', text: `${count} Expired` },
        expiring: { icon: 'time', color: '#F59E0B', text: `${count} Expiring` },
    }[status];

    return (
        <View style={styles.summaryRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <View style={styles.summaryStatus}>
                <Ionicons name={info.icon as any} size={20} color={info.color} />
                <Text style={[styles.summaryStatusText, { color: info.color }]}>{info.text}</Text>
            </View>
        </View>
    );
};

const DocumentRow = ({ title, expiry, given, status }: { title: string, expiry?: string, given?: string, status: DocumentStatus }) => {
    const badge = getStatusBadge(status);
    return (
        <View style={styles.documentRow}>
            <View style={styles.documentTouchable}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                <View style={styles.flex_1}>
                    <Text style={styles.documentTitle}>{title}</Text>
                    {expiry && <Text style={styles.documentSubtitle}>Expires: {dayjs(expiry).format("MMMM D, YYYY")}</Text>}
                    {given && <Text style={styles.documentSubtitle}>Given: {dayjs(given).format("MMMM D, YYYY")}</Text>}
                </View>
                <View className={`${badge.bg} rounded-full px-3 py-1`}>
                    <Text className={`${badge.text} text-xs font-semibold`}>{badge.label}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  flex_1: { flex: 1, backgroundColor: "#FDF4F4" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: '#555' },
  errorText: { color: '#B91C1C' },
  headerGradient: { height: 160, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 40, paddingHorizontal: 20 },
  headerButton: { padding: 8 },
  profileHeader: { alignItems: "center", marginTop: -80 },
  profilePicContainer: { width: 140, height: 140, borderRadius: 70, backgroundColor: "white", justifyContent: "center", alignItems: "center", elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 5 },
  profilePic: { width: 130, height: 130, borderRadius: 65 },
  petName: { fontSize: 28, fontWeight: "bold", color: "#2C2C2C", marginTop: 12, marginBottom: 4 },
  actionButtonsContainer: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 12 },
  actionButton: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
  mainActionButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF6B4A' },
  tabContainer: { flexDirection: "row", justifyContent: "space-around", marginHorizontal: 20, marginTop: 10, backgroundColor: 'white', borderRadius: 25, padding: 6, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 20 },
  tabActive: { backgroundColor: "#FF6B4A" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#555" },
  tabTextActive: { color: "white" },
  tabContent: { padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  cardText: { fontSize: 15, color: '#666', lineHeight: 22 },
  ownerContainer: { flexDirection: 'row', alignItems: 'center' },
  ownerImage: { width: 60, height: 60, borderRadius: 15, marginRight: 12 },
  ownerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailLabel: { fontSize: 15, color: '#555' },
  detailValue: { fontSize: 15, color: '#111', fontWeight: 'bold' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  summaryStatus: { flexDirection: 'row', alignItems: 'center' },
  summaryStatusText: { marginLeft: 8, fontWeight: '600' },
  documentRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  documentTouchable: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  documentTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  documentSubtitle: { fontSize: 13, color: '#777', marginTop: 2 },
  galleryContainer: { padding: 10 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10 },
  photoContainer: { width: (width - 40) / 2 - 5, aspectRatio: 1, borderRadius: 15, backgroundColor: '#fff', elevation: 2, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  emptyGalleryText: { marginTop: 15, fontSize: 16, color: '#888', textAlign: 'center' },
  viewLitterButton: { backgroundColor: '#FF6B4A', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  viewLitterText: { color: 'white', fontWeight: 'bold', marginRight: 8 },
  aiRecButtonIcon: { width: 32, height: 32 }
});