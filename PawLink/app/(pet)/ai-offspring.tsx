import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "@/config/env";

const { width } = Dimensions.get("window");

export default function AIOffspringScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get pet data from params
  const pet1Name = params.pet1Name as string || "Pet 1";
  const pet2Name = params.pet2Name as string || "Pet 2";
  const pet1Photo = params.pet1Photo as string;
  const pet2Photo = params.pet2Photo as string;
  const pet1Breed = params.pet1Breed as string || "Unknown";
  const pet2Breed = params.pet2Breed as string || "Unknown";
  const compatibilityScore = params.compatibilityScore as string || "85";

  // Mock offspring traits - in a real app, this would come from an AI service
  const offspringTraits = {
    predictedBreed: pet1Breed === pet2Breed ? pet1Breed : `${pet1Breed} x ${pet2Breed} Mix`,
    coatColor: "Mixed patterns possible",
    size: "Medium",
    temperament: "Friendly & Active",
    healthPrediction: "Good genetic diversity",
    estimatedWeight: "8-12 kg",
  };

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}/storage/${path}`;
  };

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
                    <Text style={styles.placeholderText}>🐾</Text>
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
                    <Text style={styles.placeholderText}>🐾</Text>
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

        {/* Offspring Preview Section */}
        <View style={styles.offspringSection}>
          <View style={styles.sectionHeader}>
            <Image
              source={require("@/assets/images/AI_Rec.png")}
              style={styles.aiIcon}
            />
            <Text style={styles.sectionTitle}>Predicted Offspring</Text>
          </View>

          {/* Offspring Image Placeholder */}
          <View style={styles.offspringImageContainer}>
            <LinearGradient
              colors={["#FFE0D8", "#FFF4F0"]}
              style={styles.offspringImageWrapper}
            >
              <View style={styles.offspringImagePlaceholder}>
                <Ionicons name="sparkles" size={40} color="#FF6B4A" />
                <Text style={styles.offspringImageText}>
                  AI Generated Preview
                </Text>
                <Text style={styles.offspringImageSubtext}>
                  Coming Soon
                </Text>
              </View>
            </LinearGradient>
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
            <Ionicons name="information-circle-outline" size={20} color="#888" />
            <Text style={styles.disclaimerText}>
              This prediction is generated by AI and is for entertainment purposes only.
              Actual offspring characteristics may vary.
            </Text>
          </View>
        </View>
      </ScrollView>
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
});
