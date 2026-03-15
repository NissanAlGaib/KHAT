import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import dayjs from "dayjs";

import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import BubbleBackgroundRe from "@/components/app/BubbleBackground";
import VaccinationCardComponent from "@/components/pet/VaccinationCard";
import AddShotModal from "@/components/pet/AddShotModal";
import {
  addVaccinationShot,
  getPet,
  getPetPublicProfile,
  getPetLitters,
  getVaccinationCards,
  type Litter,
  type PetPublicProfile,
  type VaccinationCard as VaccinationCardType,
  type VaccinationCardsResponse,
} from "@/services/petService";
import { getStorageUrl } from "@/utils/imageUrl";

type DocumentStatus = "valid" | "expired" | "expiring";
type TabKey = "overview" | "health" | "breeding" | "gallery";

const getDocumentStatus = (expirationDate?: string | null): DocumentStatus => {
  if (!expirationDate) return "valid";

  const exp = dayjs(expirationDate);
  const now = dayjs();

  if (exp.isBefore(now, "day")) return "expired";

  const daysDiff = exp.diff(now, "day");
  if (daysDiff <= 30) return "expiring";

  return "valid";
};

const countDocumentsByStatus = (
  documents: any[] | undefined,
  expirationDateField = "expiration_date",
) => {
  let expired = 0;
  let expiringSoon = 0;

  if (Array.isArray(documents)) {
    documents.forEach((doc: any) => {
      const status = getDocumentStatus(doc?.[expirationDateField]);
      if (status === "expired") expired += 1;
      if (status === "expiring") expiringSoon += 1;
    });
  }

  return { expired, expiringSoon };
};

const getStatusColor = (status: DocumentStatus) => {
  if (status === "expired") return "#EF4444";
  if (status === "expiring") return "#F59E0B";
  return "#22C55E";
};

const getStatusMeta = (status: DocumentStatus) => {
  if (status === "expired") {
    return {
      label: "Expired",
      container: styles.statusBadgeExpired,
      text: styles.statusBadgeTextExpired,
    };
  }

  if (status === "expiring") {
    return {
      label: "Expiring",
      container: styles.statusBadgeExpiring,
      text: styles.statusBadgeTextExpiring,
    };
  }

  return {
    label: "Valid",
    container: styles.statusBadgeValid,
    text: styles.statusBadgeTextValid,
  };
};

const formatOptionalDate = (value?: string | null, fallback = "Date unavailable") => {
  if (!value) return fallback;

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("MMMM D, YYYY") : fallback;
};

const getVerificationStatusLabel = (status?: string | null) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "approved" || normalized === "verified") return "Verified";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "expired") return "Expired";
  if (normalized === "pending") return "Pending Review";

  return "Pending Review";
};

const getExpiryMetaText = (expirationDate?: string | null) => {
  if (!expirationDate) return "No expiration date on file";

  const expiration = dayjs(expirationDate);
  if (!expiration.isValid()) return "Expiration date unavailable";

  const today = dayjs().startOf("day");
  const expiryDay = expiration.startOf("day");
  const dayDiff = expiryDay.diff(today, "day");

  if (dayDiff < 0) {
    const expiredDays = Math.abs(dayDiff);
    return `Expired ${expiredDays} day${expiredDays === 1 ? "" : "s"} ago`;
  }

  if (dayDiff === 0) return "Expires today";

  return `Expires in ${dayDiff} day${dayDiff === 1 ? "" : "s"}`;
};

type TimelineEventTone = "neutral" | "good" | "warn" | "bad";

type TimelineEvent = {
  label: string;
  date: string;
  tone: TimelineEventTone;
};

const getHealthTimelineEvents = (record: any): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  if (record?.created_at) {
    events.push({
      label: "Submitted",
      date: formatOptionalDate(record.created_at),
      tone: "neutral",
    });
  }

  if (record?.given_date) {
    events.push({
      label: "Issued",
      date: formatOptionalDate(record.given_date),
      tone: "neutral",
    });
  }

  if (record?.expiration_date) {
    const documentStatus = getDocumentStatus(record.expiration_date);
    events.push({
      label: "Expires",
      date: formatOptionalDate(record.expiration_date),
      tone: documentStatus === "expired" ? "bad" : "good",
    });
  }

  const verificationStatus = String(record?.status || "").toLowerCase();
  if (verificationStatus) {
    const isRejected = verificationStatus === "rejected";
    const isPending = verificationStatus === "pending";

    events.push({
      label: getVerificationStatusLabel(verificationStatus),
      date: formatOptionalDate(record?.updated_at || record?.created_at),
      tone: isRejected ? "bad" : isPending ? "warn" : "good",
    });
  }

  return events;
};

export default function PetProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.id as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [petData, setPetData] = useState<any>(null);
  const [publicProfile, setPublicProfile] = useState<PetPublicProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [litters, setLitters] = useState<Litter[]>([]);

  const [vaccinationCards, setVaccinationCards] =
    useState<VaccinationCardsResponse>({ required: [], optional: [] });
  const [showAddShotModal, setShowAddShotModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<VaccinationCardType | null>(
    null,
  );
  const [addingShotLoading, setAddingShotLoading] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const fetchVaccinationCards = useCallback(async () => {
    try {
      const cards = await getVaccinationCards(parseInt(petId, 10));
      setVaccinationCards(cards);
    } catch (error) {
      console.error("Error fetching vaccination cards:", error);
    }
  }, [petId]);

  const fetchPetData = useCallback(async () => {
    try {
      setLoading(true);
      const petIdNum = parseInt(petId, 10);

      const [pet, publicPet, litterData] = await Promise.all([
        getPet(petIdNum),
        getPetPublicProfile(petIdNum).catch(() => null),
        getPetLitters(petIdNum),
      ]);

      setPetData(pet);
      setPublicProfile(publicPet);
      setLitters(Array.isArray(litterData) ? litterData : []);
    } catch (error) {
      console.error("Error fetching pet data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load pet profile.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [petId, showAlert]);

  useEffect(() => {
    if (!petId) return;

    fetchPetData();
    fetchVaccinationCards();
  }, [petId, fetchPetData, fetchVaccinationCards]);

  useFocusEffect(
    useCallback(() => {
      if (!petId) return;
      fetchPetData();
    }, [petId, fetchPetData]),
  );

  const photos = useMemo(
    () => (Array.isArray(petData?.photos) ? petData.photos : []),
    [petData?.photos],
  );

  const galleryItems = useMemo<{ id: string; uri: string }[]>(
    () =>
      photos
        .map((photo: any, index: number) => ({
          id: `${photo?.photo_id ?? index}`,
          uri: getStorageUrl(photo?.photo_url),
        }))
        .filter(
          (photo: {
            id: string;
            uri: string | null;
          }): photo is {
            id: string;
            uri: string;
          } => !!photo.uri,
        ),
    [photos],
  );

  const behaviors = useMemo(
    () => (Array.isArray(petData?.behaviors) ? petData.behaviors : []),
    [petData?.behaviors],
  );

  const attributes = useMemo(
    () => (Array.isArray(petData?.attributes) ? petData.attributes : []),
    [petData?.attributes],
  );

  const breedingPartners = useMemo(
    () =>
      Array.isArray(publicProfile?.breeding_partners)
        ? publicProfile.breeding_partners
        : Array.isArray(petData?.breeding_partners)
          ? petData.breeding_partners
          : [],
    [publicProfile?.breeding_partners, petData?.breeding_partners],
  );

  const healthRecords = useMemo(
    () =>
      Array.isArray(petData?.health_records) ? petData.health_records : [],
    [petData?.health_records],
  );

  const sortedHealthRecords = useMemo(
    () =>
      [...healthRecords].sort((left: any, right: any) => {
        const leftDate = dayjs(left?.given_date).isValid()
          ? dayjs(left.given_date).valueOf()
          : 0;
        const rightDate = dayjs(right?.given_date).isValid()
          ? dayjs(right.given_date).valueOf()
          : 0;

        const leftCreated = dayjs(left?.created_at).isValid()
          ? dayjs(left.created_at).valueOf()
          : 0;
        const rightCreated = dayjs(right?.created_at).isValid()
          ? dayjs(right.created_at).valueOf()
          : 0;

        if (rightDate !== leftDate) return rightDate - leftDate;
        if (rightCreated !== leftCreated) return rightCreated - leftCreated;

        return (right?.health_record_id || 0) - (left?.health_record_id || 0);
      }),
    [healthRecords],
  );

  const matchingAvailable = useMemo(() => {
    if (typeof petData?.is_available_for_matching === "boolean") {
      return petData.is_available_for_matching;
    }
    return petData?.status === "active" && !petData?.is_on_cooldown;
  }, [
    petData?.is_available_for_matching,
    petData?.status,
    petData?.is_on_cooldown,
  ]);

  const documentStats = useMemo(() => {
    const latestShots = [
      ...vaccinationCards.required,
      ...vaccinationCards.optional,
    ]
      .map(
        (card) =>
          [...card.shots].sort((left, right) => {
            const leftDate = left.date_administered
              ? new Date(left.date_administered).getTime()
              : 0;
            const rightDate = right.date_administered
              ? new Date(right.date_administered).getTime()
              : 0;

            if (leftDate !== rightDate) return rightDate - leftDate;
            if (left.shot_number !== right.shot_number)
              return right.shot_number - left.shot_number;
            return right.shot_id - left.shot_id;
          })[0],
      )
      .filter((shot): shot is NonNullable<typeof shot> => !!shot);

    const shotExpired = latestShots.filter((s) => s.is_expired).length;
    const shotExpiringSoon = latestShots.filter(
      (s) => s.is_expiring_soon && !s.is_expired,
    ).length;

    const healthStats = countDocumentsByStatus(healthRecords);
    return {
      expiredCount: shotExpired + healthStats.expired,
      expiringSoonCount: shotExpiringSoon + healthStats.expiringSoon,
    };
  }, [vaccinationCards, healthRecords]);

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return "-";

    const birth = dayjs(birthdate);
    const now = dayjs();

    const years = now.diff(birth, "year");
    const months = now.diff(birth, "month") % 12;

    if (years > 0) return `${years} Year${years > 1 ? "s" : ""}`;
    return `${months} Month${months > 1 ? "s" : ""}`;
  };

  const formatLitterDate = (birthDate?: string, birthDateFull?: string) => {
    if (birthDateFull && birthDateFull.trim().length > 0) return birthDateFull;
    if (!birthDate) return "Date unavailable";

    const parsed = dayjs(birthDate);
    return parsed.isValid() ? parsed.format("MMM YYYY") : "Date unavailable";
  };

  const offspringLabels = useMemo(() => {
    const species = String(petData?.species || "").toLowerCase();
    if (species === "dog") return { singular: "puppy", plural: "puppies" };
    if (species === "cat") return { singular: "kitten", plural: "kittens" };
    return { singular: "offspring", plural: "offspring" };
  }, [petData?.species]);

  const handleEditInfo = () => {
    router.push(`/(pet)/edit-profile?id=${petId}` as never);
  };

  const handleManageVaccinations = () => {
    router.push(`/(pet)/vaccinations?petId=${petId}` as never);
  };

  const handleManageLitters = () => {
    router.push(`/(pet)/litters?petId=${petId}` as never);
  };

  const handleAddPhoto = () => {
    router.push(
      `/(pet)/manage-photos?petId=${petId}&petName=${encodeURIComponent(petData?.name ?? "")}` as never,
    );
  };

  const openGalleryViewer = (index: number) => {
    setGalleryIndex(index);
    setShowGalleryModal(true);
  };

  const showPreviousGalleryPhoto = () => {
    if (galleryItems.length <= 1) return;
    setGalleryIndex((prev) =>
      prev === 0 ? galleryItems.length - 1 : Math.max(0, prev - 1),
    );
  };

  const showNextGalleryPhoto = () => {
    if (galleryItems.length <= 1) return;
    setGalleryIndex((prev) =>
      prev === galleryItems.length - 1
        ? 0
        : Math.min(galleryItems.length - 1, prev + 1),
    );
  };

  const handleOpenAddShotModal = (cardId: number) => {
    const allCards = [
      ...vaccinationCards.required,
      ...vaccinationCards.optional,
    ];
    const found = allCards.find((card) => card.card_id === cardId) ?? null;
    setSelectedCard(found);
    setShowAddShotModal(!!found);
  };

  const handleAddShot = async (shotData: {
    vaccination_record: any;
    clinic_name: string;
    veterinarian_name: string;
    date_administered: string;
    expiration_date: string;
  }) => {
    if (!selectedCard) return;

    setAddingShotLoading(true);
    try {
      await addVaccinationShot(
        parseInt(petId, 10),
        selectedCard.card_id,
        shotData,
      );
      await fetchVaccinationCards();
      showAlert({
        title: "Success",
        message: "Shot record added successfully.",
        type: "success",
      });
    } catch (error: any) {
      showAlert({
        title: "Error",
        message: error?.response?.data?.message || "Failed to add shot record.",
        type: "error",
      });
      throw error;
    } finally {
      setAddingShotLoading(false);
    }
  };

  const handleResubmitHealthRecord = (record: any) => {
    router.push(
      `/(verification)/resubmit-document?type=health_record&petId=${petId}&petName=${petData?.name || "Pet"}&healthRecordId=${record.health_record_id}&recordType=${record.record_type}`,
    );
  };

  const handleOpenHealthCertificate = async (certificatePath?: string | null) => {
    const url = getStorageUrl(certificatePath || null);
    if (!url) {
      showAlert({
        title: "No Attachment",
        message: "No health certificate attachment was found for this record.",
        type: "warning",
      });
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      showAlert({
        title: "Unable to Open File",
        message: "We could not open this certificate. Please try again.",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.centeredBlock}>
          <ActivityIndicator size="large" color="#FF8C67" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!petData) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.centeredBlock}>
          <Text style={styles.errorText}>Pet not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverviewTab = () => {
    const details = [
      { label: "Age", value: calculateAge(petData.birthdate) },
      { label: "Sex", value: petData.sex || "-" },
      { label: "Weight", value: `${petData.weight || "-"} kg` },
      { label: "Height", value: `${petData.height || "-"} cm` },
      { label: "Has Been Bred", value: petData.has_been_bred ? "Yes" : "No" },
      { label: "Litters", value: String(litters.length) },
    ];

    return (
      <View style={styles.tabContent}>
        <SectionCard icon="information-circle-outline" title="About">
          <Text style={styles.cardBodyText}>
            {petData.description || "No description available."}
          </Text>
        </SectionCard>

        <SectionCard icon="list-outline" title="Details">
          <View style={styles.gridContainer}>
            {details.map((item) => (
              <View key={item.label} style={styles.gridItem}>
                <Text style={styles.gridLabel}>{item.label.toUpperCase()}</Text>
                <Text style={styles.gridValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard icon="leaf-outline" title="Behavior and Temperament">
          {behaviors.length > 0 ? (
            <TagWrap tags={behaviors} variant="mint" />
          ) : (
            <Text style={styles.cardBodyText}>No behavior tags.</Text>
          )}
        </SectionCard>

        <SectionCard icon="apps-outline" title="Physical Attributes">
          {attributes.length > 0 ? (
            <TagWrap tags={attributes} variant="sun" />
          ) : (
            <Text style={styles.cardBodyText}>No attribute tags.</Text>
          )}
        </SectionCard>

        <SectionCard icon="images-outline" title="Gallery Strip">
          {galleryItems.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryStripRow}
            >
              {galleryItems.slice(0, 8).map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  activeOpacity={0.9}
                  onPress={() => openGalleryViewer(index)}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.galleryStripImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.cardBodyText}>No gallery photos yet.</Text>
          )}
        </SectionCard>
      </View>
    );
  };

  const renderHealthTab = () => {
    const totalCards =
      vaccinationCards.required.length + vaccinationCards.optional.length;

    return (
      <View style={styles.tabContent}>
        <SectionCard icon="medkit-outline" title="Health Overview">
          <HealthSummaryRow
            label="Microchipped"
            value={petData.microchip_id ? "Yes" : "No"}
            ok={!!petData.microchip_id}
          />
          <HealthSummaryRow
            label="Expired Documents"
            value={`${documentStats.expiredCount} total`}
            ok={documentStats.expiredCount === 0}
          />
          <HealthSummaryRow
            label="Expiring Soon"
            value={`${documentStats.expiringSoonCount} total`}
            ok={documentStats.expiringSoonCount === 0}
          />
        </SectionCard>

        <SectionCard icon="shield-checkmark-outline" title="Vaccination Cards">
          {totalCards > 0 ? (
            <>
              <View style={styles.vaccinationCardsContainer}>
                {[...vaccinationCards.required, ...vaccinationCards.optional]
                  .slice(0, 3)
                  .map((card) => (
                    <VaccinationCardComponent
                      key={card.card_id}
                      card={card}
                      onAddShot={handleOpenAddShotModal}
                    />
                  ))}
              </View>

              <TouchableOpacity
                style={styles.inlineLinkButton}
                onPress={handleManageVaccinations}
              >
                <Text style={styles.inlineLinkText}>View All Vaccinations</Text>
                <Feather name="arrow-right" size={14} color="#FF8A66" />
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.cardBodyText}>
              No vaccination cards on file.
            </Text>
          )}
        </SectionCard>

        <SectionCard icon="receipt-outline" title="Health Records">
          {sortedHealthRecords.length > 0 ? (
            <>
              {sortedHealthRecords.map((record: any, index: number) => {
                const status = getDocumentStatus(record?.expiration_date);
                return (
                  <DocumentRow
                    key={`record-${index}`}
                    title={record?.record_type || "Health Record"}
                    expiry={record?.expiration_date}
                    issuedDate={record?.given_date}
                    expiryMetaText={getExpiryMetaText(record?.expiration_date)}
                    status={status}
                    clinicName={record?.clinic_name}
                    veterinarianName={record?.veterinarian_name}
                    verificationStatus={record?.status}
                    hasAttachment={!!record?.health_certificate}
                    onViewAttachment={
                      record?.health_certificate
                        ? () => handleOpenHealthCertificate(record.health_certificate)
                        : undefined
                    }
                    onResubmit={
                      status === "expired"
                        ? () => handleResubmitHealthRecord(record)
                        : undefined
                    }
                  />
                );
              })}

              <TouchableOpacity
                style={styles.inlineLinkButton}
                onPress={() => setShowRecordsModal(true)}
              >
                <Text style={styles.inlineLinkText}>Open Record Timeline</Text>
                <Feather name="arrow-right" size={14} color="#FF8A66" />
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.cardBodyText}>No health records.</Text>
          )}
        </SectionCard>
      </View>
    );
  };

  const renderBreedingTab = () => {
    return (
      <View style={styles.tabContent}>
        <SectionCard icon="heart-outline" title="Breeding Stats">
          <DetailRow
            label="Has Been Bred"
            value={petData.has_been_bred ? "Yes" : "No"}
          />
          <DetailRow
            label="Breeding Count"
            value={String(petData.breeding_count || 0)}
          />
          <DetailRow label="Total Litters" value={String(litters.length)} />
          <DetailRow
            label="Available for Matching"
            value={matchingAvailable ? "Yes" : "No"}
          />
        </SectionCard>

        <SectionCard icon="people-outline" title="Breeding Partners">
          {breedingPartners.length > 0 ? (
            breedingPartners.map((partner: any) => (
              <TouchableOpacity
                key={`partner-${partner.pet_id}`}
                style={styles.partnerRow}
                onPress={() =>
                  router.push(`/(pet)/view-profile?id=${partner.pet_id}`)
                }
              >
                <Image
                  source={{ uri: getStorageUrl(partner.photo) || undefined }}
                  style={styles.partnerAvatar}
                />

                <View style={styles.partnerBody}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  <Text style={styles.partnerMeta}>{partner.breed}</Text>
                </View>

                <View style={styles.partnerLitterBadge}>
                  <Text style={styles.partnerLitterText}>
                    {partner.litter_count} litter
                    {partner.litter_count === 1 ? "" : "s"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.cardBodyText}>No breeding partners yet.</Text>
          )}
        </SectionCard>

        <SectionCard icon="list-outline" title="Litter History">
          {litters.length > 0 ? (
            litters.map((litter, index) => {
              const offspringCount = litter.offspring.total;
              const offspringLabel = `${offspringCount} ${
                offspringCount === 1
                  ? offspringLabels.singular
                  : offspringLabels.plural
              }`;

              return (
                <TouchableOpacity
                  key={`${litter.litter_id}`}
                  style={styles.litterCard}
                  onPress={() =>
                    router.push(`/(pet)/litter-detail?id=${litter.litter_id}`)
                  }
                >
                  <View style={styles.litterHeaderBox}>
                    <View style={styles.litterHeaderLeftWrap}>
                      <View style={styles.litterOrderBadge}>
                        <Text style={styles.litterOrderBadgeText}>
                          {index + 1}
                        </Text>
                      </View>

                      <View style={styles.litterTopLeft}>
                        <Text style={styles.litterTitle}>{litter.title}</Text>
                        <Text style={styles.litterMeta}>
                          {`${formatLitterDate(litter.birth_date, litter.birth_date_full)} Â· ${offspringLabel}`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.litterBadge}>
                      <Text style={styles.litterBadgeText}>
                        {offspringLabel}
                      </Text>
                    </View>

                    <Feather name="chevron-right" size={18} color="#A8A2B3" />
                  </View>

                  <View style={styles.litterOffspringRow}>
                    {(Array.isArray(litter.offspring_details)
                      ? litter.offspring_details
                      : []
                    )
                      .slice(0, 5)
                      .map((off) => (
                        <View
                          key={`${litter.litter_id}-${off.offspring_id}`}
                          style={styles.offspringPreviewItem}
                        >
                          <View style={styles.offspringCircleWrap}>
                            {off.photo_url ? (
                              <Image
                                source={{
                                  uri:
                                    getStorageUrl(off.photo_url) || undefined,
                                }}
                                style={styles.offspringCircleImage}
                              />
                            ) : (
                              <View style={styles.offspringCircleFallback}>
                                <Ionicons
                                  name="paw"
                                  size={18}
                                  color="#D18C53"
                                />
                              </View>
                            )}
                          </View>

                          <Text
                            style={styles.offspringPreviewName}
                            numberOfLines={1}
                          >
                            {off.name || "Unnamed"}
                          </Text>

                          <View
                            style={[
                              styles.offspringSexBadge,
                              String(off.sex).toLowerCase() === "male"
                                ? styles.offspringSexBadgeMale
                                : styles.offspringSexBadgeFemale,
                            ]}
                          >
                            <Text
                              style={[
                                styles.offspringSexText,
                                String(off.sex).toLowerCase() === "male"
                                  ? styles.offspringSexTextMale
                                  : styles.offspringSexTextFemale,
                              ]}
                            >
                              {String(off.sex).toLowerCase() === "male"
                                ? "M"
                                : "F"}
                            </Text>
                          </View>
                        </View>
                      ))}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.cardBodyText}>No litters recorded yet.</Text>
          )}
        </SectionCard>
      </View>
    );
  };

  const renderGalleryTab = () => {
    return (
      <View style={styles.tabContent}>
        {galleryItems.length > 0 ? (
          <View style={styles.galleryGrid}>
            {galleryItems.map((photo, index) => (
              <TouchableOpacity
                key={`photo-${photo.id}`}
                style={styles.galleryTile}
                activeOpacity={0.9}
                onPress={() => openGalleryViewer(index)}
              >
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.galleryImage}
                />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.galleryAddTile}
              onPress={handleAddPhoto}
            >
              <Feather name="plus" size={30} color="#F98961" />
              <Text style={styles.galleryAddText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyStateBlock}>
            <Ionicons name="images-outline" size={38} color="#B8B8C3" />
            <Text style={styles.emptyStateTitle}>No Photos</Text>
            <Text style={styles.emptyStateText}>
              Add photos to build your pet story.
            </Text>
            <TouchableOpacity
              style={styles.inlineLinkButton}
              onPress={handleAddPhoto}
            >
              <Text style={styles.inlineLinkText}>Add First Photo</Text>
              <Feather name="arrow-right" size={14} color="#FF8A66" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    if (activeTab === "overview") return renderOverviewTab();
    if (activeTab === "health") return renderHealthTab();
    if (activeTab === "breeding") return renderBreedingTab();
    return renderGalleryTab();
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={styles.heroHeader}>
          <View style={StyleSheet.absoluteFillObject}>
            <BubbleBackgroundRe
              backgroundColor="#F98D67"
              bubbleColor="rgba(255, 192, 170, 0.35)"
              bigCount={4}
              smallCount={7}
            />
          </View>

          <View style={styles.heroTopRow}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => router.back()}
            >
              <Feather name="chevron-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircle}
              onPress={handleEditInfo}
            >
              <Feather name="edit-3" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroCenterContent}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri:
                    getStorageUrl(petData.profile_image) ||
                    getStorageUrl(
                      photos.find((p: any) => p?.is_primary)?.photo_url,
                    ) ||
                    galleryItems[0]?.uri ||
                    undefined,
                }}
                style={styles.avatar}
              />
              <View style={styles.verifyBadge}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.petName}>{petData.name}</Text>
            <Text style={styles.petSubTitle}>
              {petData.breed} - {petData.species}
            </Text>

            <View style={styles.chipsRow}>
              <HeaderChip
                icon="calendar-outline"
                text={calculateAge(petData.birthdate)}
              />
              <HeaderChip
                icon={petData.sex === "male" ? "male-outline" : "female-outline"}
                text={petData.sex}
              />
              {petData.microchip_id ? (
                <HeaderChip icon="checkmark-outline" text="Microchip" />
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.contentTopWrap}>
          <View style={styles.ownerActionCard}>
            <View style={styles.ownerActionHeader}>
              <View style={styles.ownerActionIcon}>
                <Ionicons name="construct-outline" size={14} color="#F98961" />
              </View>
              <Text style={styles.ownerActionTitle}>Owner Actions</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleEditInfo}
            >
              <Feather name="edit-2" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Edit Pet Profile</Text>
            </TouchableOpacity>

            <View style={styles.featureRow}>
              <TouchableOpacity
                style={styles.featureCard}
                onPress={handleManageVaccinations}
              >
                <View
                  style={[
                    styles.featureIconWrap,
                    { backgroundColor: "#E6F8F2" },
                  ]}
                >
                  <Ionicons name="medkit-outline" size={15} color="#58BEA3" />
                </View>
                <View style={styles.featureBody}>
                  <Text style={styles.featureTitle}>Manage Docs</Text>
                  <Text style={styles.featureSubTitle}>
                    Vaccines and health
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.featureCard}
                onPress={handleManageLitters}
              >
                <View
                  style={[
                    styles.featureIconWrap,
                    { backgroundColor: "#EFE8FF" },
                  ]}
                >
                  <Ionicons name="albums-outline" size={15} color="#8677E3" />
                </View>
                <View style={styles.featureBody}>
                  <Text style={styles.featureTitle}>Litter History</Text>
                  <Text style={styles.featureSubTitle}>View all records</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {petData.is_on_cooldown ? (
            <View style={styles.unavailableBanner}>
              <Ionicons name="time-outline" size={16} color="#A15A1B" />
              <Text style={styles.unavailableText}>
                On cooldown for {petData.cooldown_days_remaining || 0} more
                days.
              </Text>
            </View>
          ) : null}

          {!matchingAvailable && !petData.is_on_cooldown ? (
            <View style={styles.unavailableBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#A15A1B" />
              <Text style={styles.unavailableText}>
                This pet is not currently available for matching.
              </Text>
            </View>
          ) : null}

          <View style={styles.tabsWrap}>
            <TabPill
              label="Overview"
              active={activeTab === "overview"}
              onPress={() => setActiveTab("overview")}
            />
            <TabPill
              label="Health"
              active={activeTab === "health"}
              onPress={() => setActiveTab("health")}
            />
            <TabPill
              label="Breeding"
              active={activeTab === "breeding"}
              onPress={() => setActiveTab("breeding")}
            />
            <TabPill
              label="Gallery"
              active={activeTab === "gallery"}
              onPress={() => setActiveTab("gallery")}
            />
          </View>

          {renderTabContent()}
        </View>
      </ScrollView>

      <Modal
        visible={showGalleryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGalleryModal(false)}
      >
        <SafeAreaView
          style={styles.galleryModalOverlay}
          edges={["top", "bottom"]}
        >
          <View style={styles.galleryModalHeader}>
            <Text style={styles.galleryModalCounter}>
              {galleryItems.length > 0
                ? `${galleryIndex + 1}/${galleryItems.length}`
                : "0/0"}
            </Text>
            <TouchableOpacity
              style={styles.galleryModalCloseButton}
              onPress={() => setShowGalleryModal(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.galleryModalImageWrap}>
            {galleryItems[galleryIndex]?.uri ? (
              <Image
                source={{ uri: galleryItems[galleryIndex].uri }}
                style={styles.galleryModalImage}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {galleryItems.length > 1 ? (
            <View style={styles.galleryModalNavRow}>
              <TouchableOpacity
                style={styles.galleryModalNavButton}
                onPress={showPreviousGalleryPhoto}
              >
                <Feather name="chevron-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryModalNavButton}
                onPress={showNextGalleryPhoto}
              >
                <Feather name="chevron-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showRecordsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecordsModal(false)}
      >
        <Pressable
          style={styles.timelineOverlay}
          onPress={() => setShowRecordsModal(false)}
        >
          <Pressable style={styles.timelineSheet} onPress={() => {}}>
            <SafeAreaView edges={["bottom"]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Health Records</Text>
                <TouchableOpacity onPress={() => setShowRecordsModal(false)}>
                  <Ionicons name="close" size={22} color="#4F4C57" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
              >
                {sortedHealthRecords.length === 0 ? (
                  <View style={styles.recordItem}>
                    <Text style={styles.recordTitle}>No records yet</Text>
                    <Text style={styles.recordSub}>
                      Health record history will appear here once available.
                    </Text>
                  </View>
                ) : (
                  sortedHealthRecords.map((record: any, index: number) => {
                    const status = getDocumentStatus(record?.expiration_date);
                    const statusMeta = getStatusMeta(status);
                    const timelineEvents = getHealthTimelineEvents(record);

                    return (
                      <View key={`record-modal-${index}`} style={styles.recordItem}>
                        <View style={styles.recordHeaderRow}>
                          <View style={styles.recordHeaderBody}>
                            <Text style={styles.recordTitle}>
                              {record.record_type || "Health Record"}
                            </Text>
                            <Text style={styles.recordSub}>
                              {getExpiryMetaText(record?.expiration_date)}
                            </Text>
                          </View>

                          <View style={[styles.statusBadge, statusMeta.container]}>
                            <Text style={[styles.statusBadgeText, statusMeta.text]}>
                              {statusMeta.label}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.recordMetaGrid}>
                          <View style={styles.recordMetaItem}>
                            <Text style={styles.recordMetaLabel}>Issued</Text>
                            <Text style={styles.recordMetaValue}>
                              {formatOptionalDate(record?.given_date)}
                            </Text>
                          </View>
                          <View style={styles.recordMetaItem}>
                            <Text style={styles.recordMetaLabel}>Expires</Text>
                            <Text style={styles.recordMetaValue}>
                              {formatOptionalDate(record?.expiration_date)}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.recordMetaInline}>
                          Clinic: {record?.clinic_name || "Not provided"}
                        </Text>
                        <Text style={styles.recordMetaInline}>
                          Veterinarian: {record?.veterinarian_name || "Not provided"}
                        </Text>
                        <Text style={styles.recordMetaInline}>
                          Verification: {getVerificationStatusLabel(record?.status)}
                        </Text>

                        {record?.rejection_reason ? (
                          <View style={styles.rejectionBox}>
                            <Feather name="alert-circle" size={14} color="#B91C1C" />
                            <Text style={styles.rejectionText}>
                              Reason: {record.rejection_reason}
                            </Text>
                          </View>
                        ) : null}

                        <View style={styles.timelineBlock}>
                          {timelineEvents.map((event, eventIndex) => (
                            <View
                              key={`${record.health_record_id || index}-event-${eventIndex}`}
                              style={styles.timelineEventRow}
                            >
                              <View
                                style={[
                                  styles.timelineDot,
                                  event.tone === "good"
                                    ? styles.timelineDotGood
                                    : event.tone === "warn"
                                      ? styles.timelineDotWarn
                                      : event.tone === "bad"
                                        ? styles.timelineDotBad
                                        : styles.timelineDotNeutral,
                                ]}
                              />
                              <View style={styles.timelineEventBody}>
                                <Text style={styles.timelineEventLabel}>{event.label}</Text>
                                <Text style={styles.timelineEventDate}>{event.date}</Text>
                              </View>
                            </View>
                          ))}
                        </View>

                        <View style={styles.recordActionsRow}>
                          <TouchableOpacity
                            style={styles.recordActionButton}
                            onPress={() =>
                              handleOpenHealthCertificate(record.health_certificate)
                            }
                          >
                            <Feather name="file-text" size={14} color="#FF8A66" />
                            <Text style={styles.recordActionButtonText}>
                              View Attachment
                            </Text>
                          </TouchableOpacity>

                          {status === "expired" ? (
                            <TouchableOpacity
                              style={styles.recordActionPrimaryButton}
                              onPress={() => {
                                setShowRecordsModal(false);
                                handleResubmitHealthRecord(record);
                              }}
                            >
                              <Feather name="upload" size={14} color="#FFFFFF" />
                              <Text style={styles.recordActionPrimaryText}>
                                Resubmit
                              </Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>

      <AddShotModal
        visible={showAddShotModal}
        onClose={() => {
          setShowAddShotModal(false);
          setSelectedCard(null);
        }}
        card={selectedCard}
        onSubmit={handleAddShot}
        isLoading={addingShotLoading}
      />

      <AlertModal {...{ visible, ...alertOptions, onClose: hideAlert }} />
    </SafeAreaView>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIconBubble}>
          <Ionicons name={icon} size={15} color="#FF8A66" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function HeaderChip({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.headerChip}>
      <Ionicons name={icon} size={12} color="#FFFFFF" />
      <Text style={styles.headerChipText}>{text}</Text>
    </View>
  );
}

function TabPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
      {active ? <View style={styles.tabUnderline} /> : null}
    </TouchableOpacity>
  );
}

function TagWrap({
  tags,
  variant,
}: {
  tags: string[];
  variant: "mint" | "sun";
}) {
  return (
    <View style={styles.tagWrap}>
      {tags.map((tag, idx) => (
        <View
          key={`${tag}-${idx}`}
          style={[
            styles.tag,
            variant === "mint" ? styles.tagMint : styles.tagSun,
          ]}
        >
          <Text
            style={[
              styles.tagText,
              variant === "mint" ? styles.tagTextMint : styles.tagTextSun,
            ]}
          >
            {tag}
          </Text>
        </View>
      ))}
    </View>
  );
}

function HealthSummaryRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <View style={styles.healthSummaryRow}>
      <Text style={styles.healthSummaryLabel}>{label}</Text>
      <View style={styles.healthSummaryValueWrap}>
        <Ionicons
          name={ok ? "checkmark" : "alert"}
          size={12}
          color={ok ? "#58BEA3" : "#D16C6C"}
        />
        <Text
          style={[
            styles.healthSummaryValue,
            ok ? styles.healthSummaryValueOk : styles.healthSummaryValueBad,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function DocumentRow({
  title,
  expiry,
  issuedDate,
  expiryMetaText,
  status,
  clinicName,
  veterinarianName,
  verificationStatus,
  hasAttachment,
  onViewAttachment,
  onResubmit,
}: {
  title: string;
  expiry?: string;
  issuedDate?: string;
  expiryMetaText?: string;
  status: DocumentStatus;
  clinicName?: string;
  veterinarianName?: string;
  verificationStatus?: string;
  hasAttachment?: boolean;
  onViewAttachment?: () => void;
  onResubmit?: () => void;
}) {
  const statusMeta = getStatusMeta(status);

  return (
    <View style={styles.documentRow}>
      <View style={styles.documentRowTop}>
        <View style={styles.documentLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(status) },
            ]}
          />
          <View style={styles.documentTextWrap}>
            <Text style={styles.documentTitle}>{title}</Text>
            {expiry ? (
              <Text style={styles.documentSubtitle}>
                Expires: {formatOptionalDate(expiry)}
              </Text>
            ) : null}
            <Text style={styles.documentSubtitleMuted}>
              Issued: {formatOptionalDate(issuedDate)}
            </Text>
            {expiryMetaText ? (
              <Text style={styles.documentSubtitleAccent}>{expiryMetaText}</Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.statusBadge, statusMeta.container]}>
          <Text style={[styles.statusBadgeText, statusMeta.text]}>
            {statusMeta.label}
          </Text>
        </View>
      </View>

      <View style={styles.documentMetaRow}>
        <View style={styles.documentMetaPill}>
          <Text style={styles.documentMetaPillText}>
            Clinic: {clinicName || "N/A"}
          </Text>
        </View>
        <View style={styles.documentMetaPill}>
          <Text style={styles.documentMetaPillText}>
            Vet: {veterinarianName || "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.documentMetaRow}>
        <View style={styles.documentMetaPill}>
          <Text style={styles.documentMetaPillText}>
            Verification: {getVerificationStatusLabel(verificationStatus)}
          </Text>
        </View>

        {hasAttachment && onViewAttachment ? (
          <TouchableOpacity
            style={styles.documentAttachmentButton}
            onPress={onViewAttachment}
          >
            <Feather name="file-text" size={12} color="#FF8A66" />
            <Text style={styles.documentAttachmentButtonText}>View File</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {status === "expired" && onResubmit ? (
        <TouchableOpacity style={styles.resubmitButton} onPress={onResubmit}>
          <Feather name="upload" size={14} color="#FFFFFF" />
          <Text style={styles.resubmitButtonText}>Resubmit</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F1EF",
  },
  centeredBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#7E7B87",
  },
  errorText: {
    color: "#D15C5C",
    fontSize: 14,
    fontWeight: "600",
  },

  heroHeader: {
    height: 388,
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.27)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCenterContent: {
    marginTop: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  avatarWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    overflow: "visible",
    backgroundColor: "#FFFFFF",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
  },
  verifyBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4CCAA6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  petName: {
    textAlign: "center",
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    lineHeight: 46,
  },
  petSubTitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.98,
    marginTop: 4,
    textTransform: "capitalize",
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  headerChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginBottom: 6,
  },
  headerChipText: {
    marginLeft: 4,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  contentTopWrap: {
    marginTop: -10,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: "#F8F1EF",
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  ownerActionCard: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
  },
  ownerActionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  ownerActionIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#FFF1EB",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerActionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#2F2B3A",
  },

  unavailableBanner: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#FEF1D9",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  unavailableText: {
    marginLeft: 6,
    flex: 1,
    color: "#A15A1B",
    fontSize: 12,
    fontWeight: "600",
  },

  primaryButton: {
    borderRadius: 18,
    backgroundColor: "#F98961",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  featureRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  featureCard: {
    width: "48.5%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9E3E0",
    backgroundColor: "#FFFFFF",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  featureBody: {
    marginLeft: 9,
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2F2B3A",
    flexShrink: 1,
  },
  featureSubTitle: {
    fontSize: 11,
    marginTop: 1,
    color: "#7EA89A",
    flexShrink: 1,
  },

  tabsWrap: {
    marginTop: 13,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 66,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 12,
    color: "#8C8895",
    fontWeight: "700",
  },
  tabLabelActive: {
    color: "#F98961",
  },
  tabUnderline: {
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#F98961",
    marginTop: 6,
  },

  tabContent: {
    marginTop: 12,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionIconBubble: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#FFF1EB",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 18,
    color: "#2F2B3A",
    fontWeight: "700",
  },
  cardBodyText: {
    fontSize: 13,
    color: "#6E6B77",
    lineHeight: 19,
  },

  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "48.5%",
    borderRadius: 10,
    backgroundColor: "#FBF8F7",
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 10,
    color: "#AEAAB8",
    fontWeight: "700",
  },
  gridValue: {
    marginTop: 3,
    fontSize: 15,
    color: "#2F2B3A",
    fontWeight: "700",
    textTransform: "capitalize",
  },

  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 7,
    marginBottom: 7,
  },
  tagMint: {
    backgroundColor: "#DCF7EE",
  },
  tagSun: {
    backgroundColor: "#FFF2CF",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tagTextMint: {
    color: "#3CA58B",
  },
  tagTextSun: {
    color: "#A58B34",
  },

  galleryStripRow: {
    paddingVertical: 2,
  },
  galleryStripImage: {
    width: 82,
    height: 82,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: "#EEE7E6",
  },

  healthSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F2ECE9",
  },
  healthSummaryLabel: {
    fontSize: 14,
    color: "#3A3644",
    fontWeight: "600",
  },
  healthSummaryValueWrap: {
    borderRadius: 999,
    backgroundColor: "#F6FBF9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  healthSummaryValue: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "700",
  },
  healthSummaryValueOk: {
    color: "#58BEA3",
  },
  healthSummaryValueBad: {
    color: "#D16C6C",
  },

  vaccinationCardsContainer: {
    marginTop: 2,
  },
  inlineLinkButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FFD8CC",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  inlineLinkText: {
    fontSize: 13,
    color: "#FF8A66",
    fontWeight: "700",
    marginRight: 6,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F2ECE9",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6E6B77",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: "#302C3A",
    fontWeight: "700",
  },

  documentRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2ECE9",
    paddingVertical: 10,
  },
  documentRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  documentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  documentTextWrap: {
    flex: 1,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 10,
  },
  documentTitle: {
    fontSize: 14,
    color: "#302C3A",
    fontWeight: "700",
  },
  documentSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "#8E8A97",
  },
  documentSubtitleMuted: {
    marginTop: 2,
    fontSize: 11,
    color: "#9D99A8",
  },
  documentSubtitleAccent: {
    marginTop: 4,
    fontSize: 11,
    color: "#FF8A66",
    fontWeight: "700",
  },
  documentMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  documentMetaPill: {
    borderRadius: 999,
    backgroundColor: "#FFF6F2",
    borderWidth: 1,
    borderColor: "#FFE2D8",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  documentMetaPillText: {
    fontSize: 10,
    color: "#7D788A",
    fontWeight: "600",
  },
  documentAttachmentButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFD8CC",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  documentAttachmentButtonText: {
    marginLeft: 4,
    fontSize: 10,
    color: "#FF8A66",
    fontWeight: "700",
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeValid: {
    backgroundColor: "#DCFCE7",
  },
  statusBadgeExpiring: {
    backgroundColor: "#FEF3C7",
  },
  statusBadgeExpired: {
    backgroundColor: "#FEE2E2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadgeTextValid: {
    color: "#15803D",
  },
  statusBadgeTextExpiring: {
    color: "#A16207",
  },
  statusBadgeTextExpired: {
    color: "#B91C1C",
  },

  resubmitButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  resubmitButtonText: {
    marginLeft: 5,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F2ECE9",
    paddingVertical: 10,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  partnerBody: {
    flex: 1,
    marginLeft: 9,
  },
  partnerName: {
    fontSize: 14,
    color: "#302C3A",
    fontWeight: "700",
  },
  partnerMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#8E8A97",
  },
  partnerLitterBadge: {
    borderRadius: 999,
    backgroundColor: "#DCF7EE",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  partnerLitterText: {
    color: "#3FA58C",
    fontSize: 11,
    fontWeight: "700",
  },

  litterCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1DDD3",
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    overflow: "hidden",
  },
  litterHeaderBox: {
    backgroundColor: "#FFF3EE",
    borderBottomWidth: 1,
    borderBottomColor: "#F1DDD3",
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  litterHeaderLeftWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  litterOrderBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FF9A67",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  litterOrderBadgeText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  litterTopLeft: {
    flex: 1,
    marginRight: 6,
  },
  litterTitle: {
    fontSize: 16,
    color: "#3B3645",
    fontWeight: "700",
  },
  litterMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#9A97A3",
  },
  litterBadge: {
    borderRadius: 999,
    backgroundColor: "#DCF7EE",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  litterBadgeText: {
    color: "#3FA58C",
    fontSize: 12,
    fontWeight: "700",
  },
  litterOffspringRow: {
    minHeight: 106,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  offspringPreviewItem: {
    width: 86,
    marginRight: 8,
    alignItems: "center",
  },
  offspringCircleWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#FFD6C2",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF4EE",
  },
  offspringCircleImage: {
    width: "100%",
    height: "100%",
  },
  offspringCircleFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFDDBB",
    alignItems: "center",
    justifyContent: "center",
  },
  offspringPreviewName: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#5B5764",
    textAlign: "center",
  },
  offspringSexBadge: {
    marginTop: 5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minWidth: 50,
    alignItems: "center",
  },
  offspringSexBadgeMale: {
    backgroundColor: "#DDEAFE",
  },
  offspringSexBadgeFemale: {
    backgroundColor: "#FCE2EE",
    borderWidth: 1,
    borderColor: "#EC6BA5",
  },
  offspringSexText: {
    fontSize: 11,
    fontWeight: "700",
  },
  offspringSexTextMale: {
    color: "#6EA0D1",
  },
  offspringSexTextFemale: {
    color: "#E55C97",
  },

  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  galleryTile: {
    width: "48.8%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: "#EEE7E6",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryAddTile: {
    width: "48.8%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFD8CC",
    borderStyle: "dashed",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8F6",
  },
  galleryAddText: {
    marginTop: 6,
    color: "#F98961",
    fontWeight: "700",
    fontSize: 12,
  },

  emptyStateBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  emptyStateTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#4A4654",
  },
  emptyStateText: {
    marginTop: 5,
    color: "#8E8A97",
    fontSize: 12,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 18,
  },

  modalScreen: {
    flex: 1,
    backgroundColor: "#F8F1EF",
  },
  galleryModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(12, 9, 18, 0.96)",
  },
  galleryModalHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  galleryModalCounter: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  galleryModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryModalImageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  galleryModalImage: {
    width: "100%",
    height: "100%",
  },
  galleryModalNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  galleryModalNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    color: "#302C3A",
    fontWeight: "700",
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  modalBodyContent: {
    paddingBottom: 30,
  },
  timelineOverlay: {
    flex: 1,
    backgroundColor: "rgba(29, 24, 38, 0.4)",
    justifyContent: "flex-end",
  },
  timelineSheet: {
    maxHeight: "84%",
    backgroundColor: "#F8F1EF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  recordItem: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginBottom: 10,
  },
  recordHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordHeaderBody: {
    flex: 1,
    marginRight: 10,
  },
  recordTitle: {
    fontSize: 14,
    color: "#3B3645",
    fontWeight: "700",
  },
  recordSub: {
    marginTop: 3,
    fontSize: 12,
    color: "#9693A0",
  },
  recordMetaGrid: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  recordMetaItem: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#FBF8F7",
    borderWidth: 1,
    borderColor: "#F1EBE8",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  recordMetaLabel: {
    fontSize: 10,
    color: "#A39EAD",
    fontWeight: "700",
  },
  recordMetaValue: {
    marginTop: 2,
    fontSize: 12,
    color: "#4A4554",
    fontWeight: "700",
  },
  recordMetaInline: {
    marginTop: 6,
    fontSize: 12,
    color: "#6E6B77",
    fontWeight: "600",
  },
  rejectionBox: {
    marginTop: 9,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rejectionText: {
    marginLeft: 6,
    flex: 1,
    fontSize: 12,
    color: "#991B1B",
    fontWeight: "600",
  },
  timelineBlock: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE8E5",
    backgroundColor: "#FFFCFB",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  timelineEventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 5,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 8,
  },
  timelineDotNeutral: {
    backgroundColor: "#94A3B8",
  },
  timelineDotGood: {
    backgroundColor: "#22C55E",
  },
  timelineDotWarn: {
    backgroundColor: "#F59E0B",
  },
  timelineDotBad: {
    backgroundColor: "#EF4444",
  },
  timelineEventBody: {
    flex: 1,
  },
  timelineEventLabel: {
    fontSize: 12,
    color: "#4A4554",
    fontWeight: "700",
  },
  timelineEventDate: {
    marginTop: 1,
    fontSize: 11,
    color: "#8C8895",
    fontWeight: "600",
  },
  recordActionsRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  recordActionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFD8CC",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  recordActionButtonText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#FF8A66",
    fontWeight: "700",
  },
  recordActionPrimaryButton: {
    borderRadius: 999,
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  recordActionPrimaryText: {
    marginLeft: 5,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
