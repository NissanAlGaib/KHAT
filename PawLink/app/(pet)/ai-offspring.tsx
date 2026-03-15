import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AlertModal from "@/components/core/AlertModal";
import { getStorageUrl } from "@/utils/imageUrl";
import {
  generateOffspringImage,
  type SourceMode,
} from "@/services/aiImageService";
import { useAlert } from "@/hooks/useAlert";

const { width } = Dimensions.get("window");

const formatSourceModeLabel = (mode: SourceMode) => {
  return mode === "count" ? "Use Multiple Photos" : "Primary Photo";
};

export default function AIOffspringScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [generatedImage, setGeneratedImage] = React.useState<string | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [remainingGenerations, setRemainingGenerations] = React.useState<
    number | null
  >(null);
  const [selectedSourceMode, setSelectedSourceMode] = React.useState<SourceMode>(
    "primary",
  );
  const [selectedSourcePhotoCount, setSelectedSourcePhotoCount] = React.useState(2);
  const [effectiveSourceMode, setEffectiveSourceMode] = React.useState<SourceMode | null>(
    null,
  );
  const [effectiveSourcePhotoCount, setEffectiveSourcePhotoCount] = React.useState<
    number | null
  >(null);

  // Get pet data from params
  const pet1Id = parseInt(params.pet1Id as string, 10);
  const pet2Id = parseInt(params.pet2Id as string, 10);
  const pet1Name = (params.pet1Name as string) || "Pet 1";
  const pet2Name = (params.pet2Name as string) || "Pet 2";
  const pet1Photo = params.pet1Photo as string;
  const pet2Photo = params.pet2Photo as string;
  const pet1Breed = (params.pet1Breed as string) || "Unknown";
  const pet2Breed = (params.pet2Breed as string) || "Unknown";
  const compatibilityScore = (params.compatibilityScore as string) || "85";

  const adjustSourcePhotoCount = (delta: number) => {
    setSelectedSourcePhotoCount((currentCount) => {
      return Math.min(3, Math.max(1, currentCount + delta));
    });
  };

  const handleGenerate = async () => {
    if (!pet1Id || !pet2Id) {
      showAlert({
        title: "Error",
        message: "Missing pet information. Please try again.",
        type: "error",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateOffspringImage(pet1Id, pet2Id, {
        sourceMode: selectedSourceMode,
        sourcePhotoCount: selectedSourcePhotoCount,
      });

      if (response.success && response.image_url) {
        setGeneratedImage(response.image_url);
        if (response.remaining_generations !== undefined) {
          setRemainingGenerations(response.remaining_generations);
        }
        setEffectiveSourceMode(response.source_mode ?? selectedSourceMode);
        setEffectiveSourcePhotoCount(
          response.source_photo_count ??
            (selectedSourceMode === "count" ? selectedSourcePhotoCount : 1),
        );
      } else {
        const msg = response.message || "Failed to generate image.";
        setError(msg);
        if (response.remaining_generations !== undefined) {
          setRemainingGenerations(response.remaining_generations);
        }
        showAlert({
          title: "Generation Failed",
          message: msg,
          type: "error",
        });
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      showAlert({
        title: "Error",
        message: msg,
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Mock offspring traits - in a real app, this would come from an AI service
  const offspringTraits = {
    predictedBreed:
      pet1Breed === pet2Breed ? pet1Breed : `${pet1Breed} x ${pet2Breed} Mix`,
    coatColor: "Mixed patterns possible",
    size: "Medium",
    temperament: "Friendly & Active",
    healthPrediction: "Good genetic diversity",
    estimatedWeight: "8-12 kg",
  };

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    return getStorageUrl(path) ?? undefined;
  };

  const effectiveModeSummary =
    effectiveSourceMode && effectiveSourcePhotoCount
      ? `${formatSourceModeLabel(effectiveSourceMode)} • ${effectiveSourcePhotoCount} photo${effectiveSourcePhotoCount === 1 ? "" : "s"} per parent`
      : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with gradient */}
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
            <Text style={styles.headerTitle}>AI Offspring Prediction</Text>
            <View style={styles.headerButton} />
          </View>
        </LinearGradient>

        {/* Parents Section */}
        <View style={styles.parentsSection}>
          <Text style={styles.sectionLabel}>Parents</Text>
          <View style={styles.parentsContainer}>
            {/* Pet 1 */}
            <View style={styles.parentCard}>
              <View style={styles.parentImageContainer}>
                {pet1Photo ? (
                  <Image
                    source={{ uri: getImageUrl(pet1Photo) }}
                    style={styles.parentImage}
                  />
                ) : (
                  <View style={[styles.parentImage, styles.placeholderImage]}>
                    <MaterialCommunityIcons
                      name="paw"
                      size={24}
                      color="#9CA3AF"
                    />
                  </View>
                )}
              </View>
              <Text style={styles.parentName} numberOfLines={1}>
                {pet1Name}
              </Text>
              <Text style={styles.parentBreed} numberOfLines={1}>
                {pet1Breed}
              </Text>
            </View>

            {/* Heart icon in the middle */}
            <View style={styles.heartContainer}>
              <Ionicons name="heart" size={32} color="#FF6B4A" />
              <Text style={styles.compatibilityText}>
                {compatibilityScore}%
              </Text>
            </View>

            {/* Pet 2 */}
            <View style={styles.parentCard}>
              <View style={styles.parentImageContainer}>
                {pet2Photo ? (
                  <Image
                    source={{ uri: getImageUrl(pet2Photo) }}
                    style={styles.parentImage}
                  />
                ) : (
                  <View style={[styles.parentImage, styles.placeholderImage]}>
                    <MaterialCommunityIcons
                      name="paw"
                      size={24}
                      color="#9CA3AF"
                    />
                  </View>
                )}
              </View>
              <Text style={styles.parentName} numberOfLines={1}>
                {pet2Name}
              </Text>
              <Text style={styles.parentBreed} numberOfLines={1}>
                {pet2Breed}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.controlsSection}>
          <View style={styles.controlsCard}>
            <View style={styles.controlsHeader}>
              <View>
                <Text style={styles.controlsTitle}>Source Photos</Text>
                <Text style={styles.controlsSubtitle}>
                  Choose how the AI should pull parent references.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.historyNavButton}
                onPress={() => router.push("/(pet)/ai-offspring-history")}
              >
                <Ionicons name="time-outline" size={16} color="#FF6B4A" />
                <Text style={styles.historyNavButtonText}>History</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={[
                  styles.modeToggleButton,
                  selectedSourceMode === "primary" && styles.modeToggleButtonActive,
                ]}
                onPress={() => setSelectedSourceMode("primary")}
              >
                <Text
                  style={[
                    styles.modeToggleText,
                    selectedSourceMode === "primary" && styles.modeToggleTextActive,
                  ]}
                >
                  Primary Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeToggleButton,
                  selectedSourceMode === "count" && styles.modeToggleButtonActive,
                ]}
                onPress={() => setSelectedSourceMode("count")}
              >
                <Text
                  style={[
                    styles.modeToggleText,
                    selectedSourceMode === "count" && styles.modeToggleTextActive,
                  ]}
                >
                  Use Multiple Photos
                </Text>
              </TouchableOpacity>
            </View>

            {selectedSourceMode === "count" ? (
              <View style={styles.stepperCard}>
                <Text style={styles.stepperLabel}>Photos per parent</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      selectedSourcePhotoCount === 1 && styles.stepperButtonDisabled,
                    ]}
                    onPress={() => adjustSourcePhotoCount(-1)}
                    disabled={selectedSourcePhotoCount === 1}
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={selectedSourcePhotoCount === 1 ? "#C7C7C7" : "#FF6B4A"}
                    />
                  </TouchableOpacity>

                  <View style={styles.stepperValueContainer}>
                    <Text style={styles.stepperValue}>{selectedSourcePhotoCount}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      selectedSourcePhotoCount === 3 && styles.stepperButtonDisabled,
                    ]}
                    onPress={() => adjustSourcePhotoCount(1)}
                    disabled={selectedSourcePhotoCount === 3}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={selectedSourcePhotoCount === 3 ? "#C7C7C7" : "#FF6B4A"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <Text style={styles.controlsHelperText}>
              The server uses the same count for both parents and automatically
              adjusts based on available photos.
            </Text>
          </View>
        </View>

        {/* Offspring Preview Section */}
        <View style={styles.offspringSection}>
          <View style={styles.sectionHeader}>
            <Image
              source={require("@/assets/images/AI_Rec.png")}
              style={styles.aiIcon}
            />
            <Text style={styles.sectionTitle}>Predicted Offspring</Text>
          </View>

          {/* Offspring Image Area */}
          <View style={styles.offspringImageContainer}>
            <LinearGradient
              colors={["#FFE0D8", "#FFF4F0"]}
              style={styles.offspringImageWrapper}
            >
              {generatedImage ? (
                <View style={styles.generatedContentContainer}>
                  <Image
                    source={{ uri: getImageUrl(generatedImage) }}
                    style={styles.generatedImage}
                    resizeMode="cover"
                  />

                  <TouchableOpacity
                    style={styles.regenerateButton}
                    onPress={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.regenerateButtonText}>Generate Again</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.offspringImagePlaceholder}>
                  {isGenerating ? (
                    <>
                      <ActivityIndicator size="large" color="#FF6B4A" />
                      <Text style={styles.offspringImageText}>
                        Generating offspring preview...
                      </Text>
                      <Text style={styles.offspringImageSubtext}>
                        This may take a few moments
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={40} color="#FF6B4A" />
                      <Text style={styles.offspringImageText}>
                        AI Generated Preview
                      </Text>
                      <TouchableOpacity
                        style={styles.generateButton}
                        onPress={handleGenerate}
                        disabled={isGenerating}
                      >
                        <Text style={styles.generateButtonText}>
                          Generate Preview
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </LinearGradient>

            {generatedImage && effectiveModeSummary ? (
              <View style={styles.effectiveSourceCard}>
                <View style={styles.effectiveSourceBadge}>
                  <Ionicons name="sparkles-outline" size={16} color="#FF6B4A" />
                  <Text style={styles.effectiveSourceBadgeText}>Server Applied</Text>
                </View>
                <Text style={styles.effectiveSourceText}>{effectiveModeSummary}</Text>
              </View>
            ) : null}

            {remainingGenerations !== null && (
              <Text style={styles.remainingText}>
                {remainingGenerations} generations remaining today
              </Text>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* Predicted Traits */}
          <View style={styles.traitsCard}>
            <Text style={styles.traitsTitle}>Predicted Traits</Text>

            <TraitRow
              icon="paw-outline"
              label="Breed"
              value={offspringTraits.predictedBreed}
            />
            <TraitRow
              icon="color-palette-outline"
              label="Coat"
              value={offspringTraits.coatColor}
            />
            <TraitRow
              icon="resize-outline"
              label="Size"
              value={offspringTraits.size}
            />
            <TraitRow
              icon="happy-outline"
              label="Temperament"
              value={offspringTraits.temperament}
            />
            <TraitRow
              icon="fitness-outline"
              label="Weight Estimate"
              value={offspringTraits.estimatedWeight}
            />
            <TraitRow
              icon="shield-checkmark-outline"
              label="Health"
              value={offspringTraits.healthPrediction}
              isLast
            />
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#888"
            />
            <Text style={styles.disclaimerText}>
              This prediction is generated by AI and is for entertainment
              purposes only. Actual offspring characteristics may vary.
            </Text>
          </View>
        </View>
      </ScrollView>

      <AlertModal {...{ visible, ...alertOptions, onClose: hideAlert }} />
    </SafeAreaView>
  );
}

// Trait Row Component
const TraitRow = ({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) => (
  <View style={[styles.traitRow, !isLast && styles.traitRowBorder]}>
    <View style={styles.traitLabelContainer}>
      <Ionicons name={icon} size={20} color="#FF6B4A" />
      <Text style={styles.traitLabel}>{label}</Text>
    </View>
    <Text style={styles.traitValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF4F4",
  },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  headerButton: {
    padding: 8,
    width: 42,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  parentsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 12,
    textAlign: "center",
  },
  controlsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  controlsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  controlsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  controlsSubtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 3,
  },
  historyNavButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF1ED",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  historyNavButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF6B4A",
  },
  modeToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFD3C8",
    backgroundColor: "#FFF8F6",
  },
  modeToggleButtonActive: {
    backgroundColor: "#FF6B4A",
    borderColor: "#FF6B4A",
  },
  modeToggleText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#FF6B4A",
  },
  modeToggleTextActive: {
    color: "white",
  },
  stepperCard: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8F6",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFD3C8",
  },
  stepperButtonDisabled: {
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  stepperValueContainer: {
    minWidth: 42,
    alignItems: "center",
    marginHorizontal: 12,
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  controlsHelperText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#888",
    marginTop: 14,
  },
  parentsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  parentCard: {
    alignItems: "center",
    width: (width - 100) / 2,
  },
  parentImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 8,
  },
  parentImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  placeholderImage: {
    backgroundColor: "#FFE0D8",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 30,
  },
  parentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  parentBreed: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
  heartContainer: {
    alignItems: "center",
  },
  compatibilityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B4A",
    marginTop: 4,
  },
  offspringSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  aiIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  offspringImageContainer: {
    marginBottom: 20,
  },
  offspringImageWrapper: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  generatedContentContainer: {
    alignItems: "center",
  },
  offspringImagePlaceholder: {
    width: width - 80,
    height: 200,
    backgroundColor: "white",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE0D8",
    borderStyle: "dashed",
  },
  offspringImageText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B4A",
    marginTop: 12,
  },
  offspringImageSubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  traitsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  traitsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  traitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  traitRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  traitLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  traitLabel: {
    fontSize: 15,
    color: "#555",
    marginLeft: 10,
  },
  traitValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  disclaimerContainer: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
  },
  disclaimerText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  generatedImage: {
    width: width - 80,
    height: width - 80,
    borderRadius: 20,
  },
  regenerateButton: {
    marginTop: 14,
    backgroundColor: "#FF6B4A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 180,
    alignItems: "center",
  },
  regenerateButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  effectiveSourceCard: {
    marginTop: 14,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE0D8",
  },
  effectiveSourceBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF1ED",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  effectiveSourceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF6B4A",
  },
  effectiveSourceText: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: "#FF6B4A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 15,
  },
  generateButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  remainingText: {
    fontSize: 12,
    color: "#888",
    marginTop: 10,
    textAlign: "center",
  },
  errorText: {
    fontSize: 12,
    color: "red",
    marginTop: 8,
    textAlign: "center",
  },
});
