import React, {
  useRef,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  FontSize,
} from "@/constants";
import type { VaccineProtocol } from "@/services/petService";

interface AddVaccineSheetProps {
  visible: boolean;
  onClose: () => void;
  protocols: VaccineProtocol[];
  onAdd: (protocolId: number) => Promise<void>;
}

/**
 * AddVaccineSheet - Bottom sheet for adding optional vaccines to a pet's schedule.
 * Features: swipe-to-dismiss, search/filter, polished protocol cards.
 */
export default function AddVaccineSheet({
  visible,
  onClose,
  protocols,
  onAdd,
}: AddVaccineSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);

  const snapPoints = useMemo(() => ["70%", "90%"], []);

  // Filter protocols by search query
  const filteredProtocols = useMemo(() => {
    if (!searchQuery.trim()) return protocols;
    const query = searchQuery.toLowerCase();
    return protocols.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.species.toLowerCase().includes(query) ||
        (p.description?.toLowerCase().includes(query) ?? false)
    );
  }, [protocols, searchQuery]);

  // Open/close sheet based on visibility prop
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
      setSearchQuery("");
      setAddingId(null);
    }
  }, [visible]);

  // Sync parent state when user swipes sheet closed
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const handleAdd = async (protocolId: number) => {
    setAddingId(protocolId);
    try {
      await onAdd(protocolId);
    } catch {
      // Parent handles error display via alert
    } finally {
      setAddingId(null);
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const getProtocolIcon = (
    type: string
  ): React.ComponentProps<typeof Ionicons>["name"] => {
    switch (type) {
      case "series_only":
        return "layers-outline";
      case "series_with_booster":
        return "shield-checkmark-outline";
      case "recurring":
        return "repeat-outline";
      default:
        return "medical-outline";
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      {/* Gradient Header */}
      <LinearGradient colors={[...Gradients.header]} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="add-circle" size={22} color={Colors.white} />
            <Text style={styles.headerTitle}>Add Vaccine</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Feather name="x" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          Select from available vaccine protocols
        </Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={Colors.textDisabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vaccines..."
            placeholderTextColor={Colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x-circle" size={16} color={Colors.textDisabled} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.resultCount}>
          {filteredProtocols.length} vaccine
          {filteredProtocols.length !== 1 ? "s" : ""} available
        </Text>
      </View>

      {/* Protocol List */}
      <BottomSheetScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredProtocols.length > 0 ? (
          filteredProtocols.map((protocol) => {
            const isThisAdding = addingId === protocol.id;
            const isAnyAdding = addingId !== null;

            return (
              <View key={protocol.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={getProtocolIcon(protocol.protocol_type)}
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{protocol.name}</Text>
                    <View style={styles.badges}>
                      <View style={styles.speciesBadge}>
                        <Ionicons name="paw" size={10} color="#1E40AF" />
                        <Text style={styles.speciesBadgeText}>
                          {protocol.species.charAt(0).toUpperCase() +
                            protocol.species.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {protocol.protocol_type_label}
                        </Text>
                      </View>
                      {protocol.series_doses != null &&
                        protocol.series_doses > 0 && (
                          <View style={styles.dosesBadge}>
                            <Text style={styles.dosesBadgeText}>
                              {protocol.series_doses} dose
                              {protocol.series_doses > 1 ? "s" : ""}
                            </Text>
                          </View>
                        )}
                    </View>
                  </View>
                </View>

                {protocol.description && (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {protocol.description}
                  </Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    isAnyAdding && styles.addButtonDisabled,
                  ]}
                  onPress={() => handleAdd(protocol.id)}
                  disabled={isAnyAdding}
                  activeOpacity={0.7}
                >
                  {isThisAdding ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="add" size={18} color={Colors.white} />
                      <Text style={styles.addButtonText}>Add to Schedule</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={48}
              color={Colors.textDisabled}
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No vaccines found" : "No vaccines available"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No vaccines matching "${searchQuery}"`
                : "All available vaccines have been added to this pet."}
            </Text>
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: Colors.borderMedium,
    width: 40,
  },
  sheetBackground: {
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius: BorderRadius["3xl"],
    borderTopRightRadius: BorderRadius["3xl"],
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.white,
  },
  closeButton: {
    padding: Spacing.xs,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: BorderRadius.md,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.85)",
    marginTop: Spacing.xs,
    marginLeft: 30,
  },
  searchSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    padding: 0,
  },
  resultCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  card: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.coralSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  speciesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  speciesBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: "#1E40AF",
  },
  typeBadge: {
    backgroundColor: Colors.bgTertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  dosesBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  dosesBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: "#166534",
  },
  cardDescription: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: Spacing.sm,
    marginLeft: 56,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
});
