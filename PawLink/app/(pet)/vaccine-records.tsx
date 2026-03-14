import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import BubbleBackgroundRe from "@/components/app/BubbleBackground";
import {
  getPetPublicProfile,
  type PublicVaccinationCard,
  type PublicVaccinationShot,
} from "@/services/petService";

type RowStatus = "up_to_date" | "due_soon" | "expired" | "no_record";

function getStatusMeta(status: RowStatus) {
  if (status === "no_record") {
    return {
      label: "No Record",
      badgeBg: "#F0EDF2",
      badgeText: "#8A8694",
      dot: "#B4AFBE",
    };
  }

  if (status === "expired") {
    return {
      label: "Expired",
      badgeBg: "#FFE4E1",
      badgeText: "#D24F4F",
      dot: "#F07A7A",
    };
  }

  if (status === "due_soon") {
    return {
      label: "Due Soon",
      badgeBg: "#FFF2D5",
      badgeText: "#BD8338",
      dot: "#E7A941",
    };
  }

  return {
    label: "Up to Date",
    badgeBg: "#DCF7EE",
    badgeText: "#3EA48B",
    dot: "#58BEA3",
  };
}

function mapDiseaseLabel(vaccineName: string) {
  const value = vaccineName.toLowerCase();

  if (value.includes("dhpp")) {
    return "Distemper, Adenovirus/Hepatitis, Parvovirus, Parainfluenza";
  }
  if (value.includes("rabies")) {
    return "Anti-rabies. Required by law";
  }
  if (value.includes("felv")) {
    return "Feline leukemia virus";
  }
  if (value.includes("fvr") || value.includes("rcp")) {
    return "Feline viral rhinotracheitis, calicivirus, panleukopenia";
  }

  return "Vaccination record";
}

function computeCardStatus(card: PublicVaccinationCard): RowStatus {
  if (card.status === "overdue") {
    return "expired";
  }

  const shots = card.shots || [];
  if (shots.length === 0) {
    return "no_record";
  }

  const hasExpired = shots.some((shot) => shot.is_expired);
  if (hasExpired) return "expired";

  const hasDueSoon = shots.some((shot) => shot.is_expiring_soon);
  if (hasDueSoon) return "due_soon";

  return "up_to_date";
}

function SummaryCell({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.summaryCell}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function VaccineRecordsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.petId as string;

  const [loading, setLoading] = useState(true);
  const [petName, setPetName] = useState("");
  const [cards, setCards] = useState<PublicVaccinationCard[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const profile = await getPetPublicProfile(parseInt(petId, 10));
        if (!mounted) return;

        setPetName(profile.name);
        setCards([
          ...(profile.vaccination_cards?.required ?? []),
          ...(profile.vaccination_cards?.optional ?? []),
        ]);
      } catch {
        if (!mounted) return;
        setCards([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (petId) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [petId]);

  const stats = useMemo(() => {
    const statusList = cards.map((card) => computeCardStatus(card));

    return {
      dueSoon: statusList.filter((status) => status === "due_soon").length,
      completed: statusList.filter((status) => status === "up_to_date").length,
      expired: statusList.filter((status) => status === "expired").length,
    };
  }, [cards]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#F98961" />
          <Text style={styles.loadingText}>Loading vaccine records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerWrap}>
        <View style={StyleSheet.absoluteFillObject}>
          <BubbleBackgroundRe
            backgroundColor="#F98D67"
            bubbleColor="rgba(255, 192, 170, 0.35)"
            bigCount={3}
            smallCount={6}
          />
        </View>

        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => router.back()}
          >
            <Feather name="chevron-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Vaccine Records</Text>
            <Text style={styles.headerSubTitle}>{petName || "Pet"}</Text>
          </View>

          <View style={styles.iconCircleGhost} />
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <SummaryCell
            value={stats.dueSoon}
            label="Expire Soon"
            color="#E7A941"
          />
          <View style={styles.summaryDivider} />
          <SummaryCell
            value={stats.completed}
            label="Completed"
            color="#58BEA3"
          />
          <View style={styles.summaryDivider} />
          <SummaryCell value={stats.expired} label="Expired" color="#F07A7A" />
        </View>

        <View style={styles.listCard}>
          {cards.length > 0 ? (
            cards.map((card) => {
              const rowStatus = computeCardStatus(card);
              const statusMeta = getStatusMeta(rowStatus);
              const expanded = expandedCardId === card.card_id;

              return (
                <View key={card.card_id}>
                  <TouchableOpacity
                    style={styles.recordRow}
                    onPress={() =>
                      setExpandedCardId(expanded ? null : card.card_id)
                    }
                  >
                    <View
                      style={[styles.dot, { backgroundColor: statusMeta.dot }]}
                    />

                    <View style={styles.recordContent}>
                      <Text style={styles.recordName}>{card.vaccine_name}</Text>
                      <Text style={styles.recordSub}>
                        {mapDiseaseLabel(card.vaccine_name)}
                      </Text>
                    </View>

                    <View style={styles.recordRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusMeta.badgeBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: statusMeta.badgeText },
                          ]}
                        >
                          {statusMeta.label}
                        </Text>
                      </View>

                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color="#9D9AA5"
                      />
                    </View>
                  </TouchableOpacity>

                  {expanded ? (
                    <View style={styles.expandedBody}>
                      <Text style={styles.expandedTitle}>Shots</Text>
                      {(card.shots || []).length > 0 ? (
                        (card.shots || []).map(
                          (shot: PublicVaccinationShot) => (
                            <View key={shot.shot_id} style={styles.shotRow}>
                              <View>
                                <Text style={styles.shotName}>
                                  Shot {shot.shot_number}
                                </Text>
                                <Text style={styles.shotDate}>
                                  Given: {shot.date_administered_display}
                                </Text>
                                <Text style={styles.shotDate}>
                                  Expires: {shot.expiration_date_display}
                                </Text>
                              </View>

                              <Text
                                style={[
                                  styles.shotState,
                                  {
                                    color: shot.is_expired
                                      ? "#D24F4F"
                                      : shot.is_expiring_soon
                                        ? "#BD8338"
                                        : "#3EA48B",
                                  },
                                ]}
                              >
                                {shot.is_expired
                                  ? "Expired"
                                  : shot.is_expiring_soon
                                    ? "Due Soon"
                                    : "Valid"}
                              </Text>
                            </View>
                          ),
                        )
                      ) : (
                        <Text style={styles.noShotsText}>
                          No shots recorded yet.
                        </Text>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name="medkit-outline" size={32} color="#B6B3BE" />
              <Text style={styles.emptyText}>No vaccine cards found.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F1EF",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#7E7B87",
  },
  headerWrap: {
    height: 120,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.27)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleGhost: {
    width: 34,
    height: 34,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubTitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    marginTop: -12,
  },
  summaryCard: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  summaryCell: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 10,
    color: "#A6A2AF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryDivider: {
    width: 1,
    height: 46,
    backgroundColor: "#F0ECEA",
  },
  listCard: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0ECEA",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 10,
  },
  recordContent: {
    flex: 1,
  },
  recordName: {
    fontSize: 14,
    color: "#34303F",
    fontWeight: "700",
  },
  recordSub: {
    marginTop: 2,
    fontSize: 11,
    color: "#9996A3",
  },
  recordRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  expandedBody: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  expandedTitle: {
    fontSize: 12,
    color: "#8A8694",
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  shotRow: {
    borderRadius: 10,
    backgroundColor: "#FAF7F6",
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shotName: {
    fontSize: 12,
    color: "#3B3746",
    fontWeight: "700",
  },
  shotDate: {
    marginTop: 1,
    fontSize: 11,
    color: "#9C98A5",
  },
  shotState: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 8,
  },
  noShotsText: {
    fontSize: 12,
    color: "#9592A0",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },
  emptyText: {
    marginTop: 8,
    color: "#9B97A4",
    fontSize: 13,
  },
});
