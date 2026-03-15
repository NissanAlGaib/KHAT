import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import BubbleBackgroundRe from "@/components/app/BubbleBackground";
import {
  getLitterDetail,
  type LitterDetail,
  type LitterOffspring,
} from "@/services/petService";
import { getStorageUrl } from "@/utils/imageUrl";

type StatusMeta = {
  bg: string;
  text: string;
};

function getStatusMeta(status: string): StatusMeta {
  const value = status.toLowerCase();

  if (value === "completed") {
    return { bg: "rgba(255,255,255,0.32)", text: "#FFFFFF" };
  }

  if (value === "active") {
    return { bg: "rgba(220, 247, 238, 0.95)", text: "#3EA48B" };
  }

  return { bg: "rgba(255,255,255,0.32)", text: "#FFFFFF" };
}

function formatBirthDate(litter: LitterDetail): string {
  if (litter.birth_date_full && litter.birth_date_full.trim().length > 0) {
    return litter.birth_date_full;
  }

  const parsed = dayjs(litter.birth_date);
  return parsed.isValid() ? parsed.format("MMM D, YYYY") : "Date unavailable";
}

function formatAgeLabel(litter: LitterDetail): string {
  if (typeof litter.age_in_weeks === "number" && litter.age_in_months < 1) {
    return `${Math.max(1, Math.round(litter.age_in_weeks))} weeks old`;
  }

  if (
    typeof litter.age_in_months !== "number" ||
    Number.isNaN(litter.age_in_months)
  ) {
    return "";
  }

  const rounded = Math.round(litter.age_in_months * 10) / 10;
  const value = Number.isInteger(rounded)
    ? rounded.toFixed(0)
    : rounded.toFixed(1);
  return `${value} months old`;
}

function getOffspringLabels(species?: string) {
  const value = (species || "").toLowerCase();

  if (value === "dog") {
    return { singular: "Puppy", plural: "Puppies" };
  }

  if (value === "cat") {
    return { singular: "Kitten", plural: "Kittens" };
  }

  return { singular: "Offspring", plural: "Offspring" };
}

export default function LitterDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const litterId = params.id as string;

  const [litter, setLitter] = useState<LitterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLitterDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLitterDetail(parseInt(litterId, 10));
      setLitter(data);
    } catch (error) {
      console.error("Error fetching litter detail:", error);
      setLitter(null);
    } finally {
      setLoading(false);
    }
  }, [litterId]);

  useEffect(() => {
    if (litterId) {
      fetchLitterDetail();
    }
  }, [fetchLitterDetail, litterId]);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined;
    return getStorageUrl(path) ?? undefined;
  };

  const birthDateLabel = useMemo(
    () => (litter ? formatBirthDate(litter) : ""),
    [litter],
  );
  const ageLabel = useMemo(
    () => (litter ? formatAgeLabel(litter) : ""),
    [litter],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={["top"]}>
        <ActivityIndicator size="large" color="#F98D67" />
        <Text style={styles.loadingText}>Loading litter details...</Text>
      </SafeAreaView>
    );
  }

  if (!litter) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={["top"]}>
        <Feather name="alert-circle" size={36} color="#B8B4C1" />
        <Text style={styles.loadingText}>Litter details unavailable.</Text>
      </SafeAreaView>
    );
  }

  const statusMeta = getStatusMeta(litter.status);
  const sire = litter.parents.sire;
  const dam = litter.parents.dam;
  const sireBreed = sire.breed || "Unknown Breed";
  const damBreed = dam.breed || "Unknown Breed";
  const offspringLabels = getOffspringLabels(sire.species || dam.species);
  const ownerLine = dam.owner?.name
    ? `${dam.name} owned by ${dam.owner.name}`
    : `${dam.name} owner unavailable`;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrap}>
          <View style={StyleSheet.absoluteFillObject}>
            <BubbleBackgroundRe
              backgroundColor="#F98D67"
              bubbleColor="rgba(255, 192, 170, 0.28)"
              bigCount={2}
              smallCount={4}
            />
          </View>

          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backCircle}
              onPress={() => router.back()}
            >
              <Feather name="chevron-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerBody}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {litter.title}
              </Text>
              <Text style={styles.headerSubTitle} numberOfLines={1}>
                {sire.name} x {dam.name} · {birthDateLabel}
              </Text>
              {ageLabel ? (
                <Text style={styles.headerSubTitle}>{ageLabel}</Text>
              ) : null}
            </View>

            <View
              style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}
            >
              <Text
                style={[styles.statusBadgeText, { color: statusMeta.text }]}
              >
                {litter.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.topSheet}>
          <View style={styles.summaryOuterCard}>
            <View style={styles.summaryHead}>
              <View style={styles.parentPairWrap}>
                <TouchableOpacity
                  style={styles.parentAvatarWrap}
                  onPress={() =>
                    router.push(`/(pet)/view-profile?id=${sire.pet_id}`)
                  }
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: getImageUrl(sire.photo) }}
                    style={styles.parentAvatar}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.parentAvatarWrap, styles.parentAvatarOverlap]}
                  onPress={() =>
                    router.push(`/(pet)/view-profile?id=${dam.pet_id}`)
                  }
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: getImageUrl(dam.photo) }}
                    style={styles.parentAvatar}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryTextWrap}>
                <Text style={styles.summaryPairTitle} numberOfLines={1}>
                  {sire.name} x {dam.name}
                </Text>
                <Text style={styles.summaryPairSub} numberOfLines={1}>
                  {sireBreed} x {damBreed}
                </Text>

                <View style={styles.summaryOwnerRow}>
                  <Ionicons
                    name="person-circle-outline"
                    size={16}
                    color="#6D677A"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.summaryOwnerText} numberOfLines={1}>
                    {ownerLine}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <MetricCell
                label={offspringLabels.plural}
                value={String(litter.statistics.total_offspring)}
              />
              <MetricCell
                label="Sex"
                value={`${litter.statistics.male_count}M ${litter.statistics.female_count}F`}
              />
              <MetricCell
                label="Alive"
                value={String(litter.statistics.alive_offspring)}
                valueColor="#54C5A7"
              />
              <MetricCell
                label="Died"
                value={String(litter.statistics.died_offspring)}
                valueColor="#FF8A66"
              />
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{offspringLabels.plural}</Text>

            {litter.offspring.length > 0 ? (
              litter.offspring.map((offspring) => (
                <OffspringCard
                  key={offspring.offspring_id}
                  offspring={offspring}
                  getImageUrl={getImageUrl}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="paw-outline" size={24} color="#AEA8B7" />
                <Text style={styles.emptyTitle}>
                  {`No ${offspringLabels.plural.toLowerCase()} recorded yet.`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCell({
  value,
  label,
  valueColor,
}: {
  value: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.metricCell}>
      <Text
        style={[styles.metricValue, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function OffspringCard({
  offspring,
  getImageUrl,
}: {
  offspring: LitterOffspring;
  getImageUrl: (path: string | null | undefined) => string | undefined;
}) {
  const isMale = offspring.sex === "male";
  const status = offspring.status?.trim() || "unknown";
  const ownerName = offspring.assigned_to?.name || "Unassigned";
  const isAssigned = Boolean(offspring.assigned_to?.name);

  return (
    <View style={styles.kittenRow}>
      <View style={styles.kittenAvatarWrap}>
        {offspring.photo_url ? (
          <Image
            source={{ uri: getImageUrl(offspring.photo_url) }}
            style={styles.kittenAvatar}
          />
        ) : (
          <View
            style={[
              styles.kittenAvatar,
              { backgroundColor: isMale ? "#DDEAFE" : "#FCE5F1" },
            ]}
          >
            <Ionicons
              name="paw"
              size={22}
              color={isMale ? "#4B81E4" : "#D45A9F"}
            />
          </View>
        )}
      </View>

      <View style={styles.kittenMain}>
        <View style={styles.kittenNameRow}>
          <Text style={styles.kittenName} numberOfLines={1}>
            {offspring.name || "Unnamed"}
          </Text>
          <View
            style={[
              styles.kittenSexBadge,
              { backgroundColor: isMale ? "#DDEAFE" : "#FCE5F1" },
            ]}
          >
            <Text
              style={[
                styles.kittenSexText,
                { color: isMale ? "#4B81E4" : "#D45A9F" },
              ]}
            >
              {isMale ? "M" : "F"}
            </Text>
          </View>
        </View>

        <Text style={styles.kittenMeta} numberOfLines={1}>
          {offspring.color ? `${offspring.color} coat` : "Color not set"} ·{" "}
          {status}
        </Text>
      </View>

      <View style={styles.kittenRight}>
        <View
          style={[
            styles.ownerBadge,
            isAssigned
              ? styles.ownerBadgeAssigned
              : styles.ownerBadgeUnassigned,
          ]}
        >
          <Text
            style={[
              styles.ownerBadgeText,
              isAssigned
                ? styles.ownerTextAssigned
                : styles.ownerTextUnassigned,
            ]}
            numberOfLines={1}
          >
            {ownerName}
          </Text>
        </View>
        <Text style={styles.ownerSub}>
          {isAssigned ? "now owned by" : "ownership pending"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5EFED",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F5EFED",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#8F8B97",
    fontSize: 13,
  },

  headerWrap: {
    height: 160,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.27)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBody: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubTitle: {
    marginTop: 1,
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 88,
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 24,
  },
  topSheet: {
    marginTop: -34,
    backgroundColor: "#F6EEEE",
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingHorizontal: 14,
    paddingTop: 44,
  },

  summaryOuterCard: {
    backgroundColor: "#F2E4DE",
    borderRadius: 22,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  summaryHead: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  parentPairWrap: {
    width: 92,
    position: "relative",
  },
  parentAvatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: "#EDE9EF",
  },
  parentAvatarOverlap: {
    position: "absolute",
    left: 38,
    top: 0,
  },
  parentAvatar: {
    width: "100%",
    height: "100%",
  },
  summaryTextWrap: {
    flex: 1,
    marginLeft: 8,
  },
  summaryPairTitle: {
    fontSize: 18,
    color: "#322D3C",
    fontWeight: "700",
  },
  summaryPairSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#7A7486",
  },
  summaryOwnerRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryOwnerIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  summaryOwnerText: {
    flex: 1,
    fontSize: 11,
    color: "#6D677A",
    fontWeight: "600",
  },

  metricsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1D7CC",
  },
  metricCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: "#F1D7CC",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#312C3B",
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#9A95A4",
    fontWeight: "600",
    textTransform: "uppercase",
  },

  sectionWrap: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 20,
    color: "#2E2938",
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE7E4",
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 8,
    color: "#8A8594",
    fontSize: 13,
    fontWeight: "600",
  },

  kittenRow: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE7E4",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  kittenAvatarWrap: {
    marginRight: 10,
  },
  kittenAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  kittenPlaceholder: {
    fontSize: 20,
  },
  kittenMain: {
    flex: 1,
  },
  kittenNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  kittenName: {
    fontSize: 16,
    color: "#2E2938",
    fontWeight: "700",
    maxWidth: 120,
  },
  kittenSexBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 8,
  },
  kittenSexText: {
    fontSize: 11,
    fontWeight: "700",
  },
  kittenMeta: {
    marginTop: 3,
    fontSize: 12,
    color: "#7D7789",
    textTransform: "capitalize",
  },
  kittenRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  ownerBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 128,
  },
  ownerBadgeAssigned: {
    backgroundColor: "#FFE6D9",
  },
  ownerBadgeUnassigned: {
    backgroundColor: "#ECE9F0",
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  ownerTextAssigned: {
    color: "#FF8A66",
  },
  ownerTextUnassigned: {
    color: "#8C8798",
  },
  ownerSub: {
    marginTop: 3,
    fontSize: 10,
    color: "#8E8898",
  },
});
