import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants";
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

const PRECISION_OPTIONS: {
  key: Precision;
  label: string;
  description: string;
}[] = [
  {
    key: "city",
    label: "City Level",
    description: "~5 km accuracy. Other users see your general city area.",
  },
  {
    key: "barangay",
    label: "Barangay Level",
    description: "~500 m accuracy. Shows approximate neighborhood.",
  },
  {
    key: "exact",
    label: "Exact Location",
    description: "Precise pin. Best for nearby matching.",
  },
];

export default function LocationSettingsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const {
    latitude,
    longitude,
    loading: locLoading,
    error: locError,
    permissionStatus,
    requestLocation,
  } = useLocation();

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
      showAlert({
        title: "No Location",
        message: "Please detect your location first.",
        type: "warning",
      });
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
        buttons: [{ text: "OK", onPress: () => router.back() }],
      });
    } catch (error) {
      console.error("Error saving location:", error);
      showAlert({
        title: "Error",
        message: "Failed to save location settings.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <SettingsLayout headerTitle="Location Settings">
        <View className="flex-1 justify-center items-center">
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
        <View className="p-4">
          {currentLat && currentLng ? (
            <View className="flex-row items-center gap-2">
              <Feather name="check-circle" size={20} color={Colors.success} />
              <Text className="text-gray-800 text-sm">
                Location set ({currentLat.toFixed(4)}, {currentLng.toFixed(4)})
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <Feather name="alert-circle" size={20} color={Colors.warning} />
              <Text className="text-gray-400 text-sm">
                No location set — tap below to detect
              </Text>
            </View>
          )}
        </View>

        <SettingsButton
          title={locLoading ? "Detecting..." : "Update My Location"}
          onPress={handleDetectLocation}
          disabled={locLoading}
        />
      </SettingsSection>

      {/* Privacy Precision */}
      <SettingsSection title="Location Privacy">
        <View className="p-4 gap-2">
          <Text className="text-gray-400 text-[13px] mb-1">
            Choose how precisely others can see your location:
          </Text>
          {PRECISION_OPTIONS.map((opt) => {
            const isSelected = precision === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                className={`flex-row items-center p-3 rounded-xl border ${
                  isSelected
                    ? "border-primary bg-orange-50"
                    : "border-gray-200 bg-gray-50"
                }`}
                onPress={() => setPrecision(opt.key)}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    isSelected ? "border-primary" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800 text-sm">
                    {opt.label}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {opt.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
        <View className="px-4 pb-4">
          <Text className="text-gray-400 text-xs">
            When enabled, the matching algorithm will slightly favor pets from
            owners closer to you.
          </Text>
        </View>
      </SettingsSection>

      {/* Save */}
      <View className="p-4">
        <SettingsButton
          title={saving ? "Saving..." : "Save Location Settings"}
          onPress={handleSave}
          variant="primary"
          disabled={saving}
        />
      </View>
    </SettingsLayout>
  );
}
