import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "@/constants";
import { useSession } from "@/context/AuthContext";
import { getUserProfile, updateUserProfile } from "@/services/userService";
import { useLocation } from "@/hooks/useLocation";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import {
  SettingsLayout,
  SettingsSection,
  SettingsButton,
  SettingsItem,
} from "@/components/settings";

type Precision = "city" | "barangay" | "exact";

const PRECISION_OPTIONS: { key: Precision; label: string; description: string }[] = [
  { key: "city", label: "City Level", description: "~5 km accuracy. Other users see your general city area." },
  { key: "barangay", label: "Barangay Level", description: "~500 m accuracy. Shows approximate neighborhood." },
  { key: "exact", label: "Exact Location", description: "Precise pin. Best for nearby matching." },
];

export default function LocationSettingsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const { latitude, longitude, loading: locLoading, error: locError, permissionStatus, requestLocation } = useLocation();

  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form state
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [precision, setPrecision] = useState<Precision>("city");
  const [preferNearby, setPreferNearby] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const data = await getUserProfile();
      setCurrentLat((data as any).latitude ?? null);
      setCurrentLng((data as any).longitude ?? null);
      setPrecision((data as any).location_precision || "city");
      setPreferNearby((data as any).prefer_nearby_matches || false);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    const coords = await requestLocation();
    if (coords) {
      setCurrentLat(coords.latitude);
      setCurrentLng(coords.longitude);
      showAlert({
        title: "Location Detected",
        message: "Your GPS location has been captured. Tap Save to apply.",
        type: "success",
      });
    } else if (locError) {
      showAlert({
        title: "Location Error",
        message: locError,
        type: "error",
      });
    }
  };

  const handleSave = async () => {
    if (!currentLat || !currentLng) {
      showAlert({ title: "No Location", message: "Please detect your location first.", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({
        latitude: currentLat,
        longitude: currentLng,
        location_precision: precision,
        prefer_nearby_matches: preferNearby,
      });
      showAlert({
        title: "Saved",
        message: "Your location settings have been updated.",
        type: "success",
        onClose: () => router.back(),
      });
    } catch (error) {
      console.error("Error saving location:", error);
      showAlert({ title: "Error", message: "Failed to save location settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <SettingsLayout headerTitle="Location Settings">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout headerTitle="Location Settings">
      <AlertModal visible={visible} {...alertOptions} onClose={hideAlert} />

      {/* Current Location Status */}
      <SettingsSection title="Your Location">
        <View style={{ padding: Spacing.md }}>
          {currentLat && currentLng ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="check-circle" size={20} color={Colors.success} />
              <Text style={{ color: Colors.textPrimary, fontSize: 14 }}>
                Location set ({currentLat.toFixed(4)}, {currentLng.toFixed(4)})
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="alert-circle" size={20} color={Colors.warning} />
              <Text style={{ color: Colors.textMuted, fontSize: 14 }}>
                No location set — tap below to detect
              </Text>
            </View>
          )}
        </View>

        <SettingsButton
          label={locLoading ? "Detecting..." : "Detect My Location"}
          icon="navigation"
          onPress={handleDetectLocation}
          disabled={locLoading}
        />
      </SettingsSection>

      {/* Privacy Precision */}
      <SettingsSection title="Location Privacy">
        <View style={{ padding: Spacing.md, gap: 8 }}>
          <Text style={{ color: Colors.textMuted, fontSize: 13, marginBottom: 4 }}>
            Choose how precisely others can see your location:
          </Text>
          {PRECISION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderRadius: 10,
                backgroundColor: precision === opt.key ? Colors.primary + "10" : "#F9FAFB",
                borderWidth: 1,
                borderColor: precision === opt.key ? Colors.primary : "#E5E7EB",
              }}
              onPress={() => setPrecision(opt.key)}
            >
              <View style={{
                width: 20, height: 20, borderRadius: 10,
                borderWidth: 2,
                borderColor: precision === opt.key ? Colors.primary : "#D1D5DB",
                alignItems: "center", justifyContent: "center",
                marginRight: 12,
              }}>
                {precision === opt.key && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: Colors.textPrimary, fontSize: 14 }}>
                  {opt.label}
                </Text>
                <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {opt.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </SettingsSection>

      {/* Matching Preference */}
      <SettingsSection title="Matching">
        <SettingsItem
          label="Prefer nearby matches"
          icon="map-pin"
          type="toggle"
          value={preferNearby}
          onPress={() => setPreferNearby((v) => !v)}
        />
        <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
          <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
            When enabled, the matching algorithm will slightly favor pets from owners closer to you.
          </Text>
        </View>
      </SettingsSection>

      {/* Save */}
      <View style={{ padding: Spacing.md }}>
        <SettingsButton
          label={saving ? "Saving..." : "Save Location Settings"}
          icon="save"
          onPress={handleSave}
          variant="primary"
          disabled={saving}
        />
      </View>
    </SettingsLayout>
  );
}
