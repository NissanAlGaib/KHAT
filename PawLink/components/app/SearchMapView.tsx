import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from "react-native-maps";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius } from "@/constants";
import {
  searchService,
  MapMarker,
  MapMarkerType,
} from "@/services/searchService";
import { getStorageUrl } from "@/utils/imageUrl";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Default center: Manila, Philippines
const DEFAULT_REGION = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

const FILTER_OPTIONS: { key: MapMarkerType; label: string; icon: string; color: string }[] = [
  { key: "breeders", label: "Breeders", icon: "users", color: Colors.info },
  { key: "shooters", label: "Shooters", icon: "camera", color: Colors.warning },
  { key: "pets", label: "Pets", icon: "heart", color: Colors.primary },
];

interface SearchMapViewProps {
  onClose: () => void;
}

export default function SearchMapView({ onClose }: SearchMapViewProps) {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<MapMarkerType[]>([
    "breeders",
    "shooters",
    "pets",
  ]);
  const [center, setCenter] = useState(DEFAULT_REGION);

  const loadMarkers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchService.mapSearch({
        types: activeFilters,
        limit: 150,
      });
      setMarkers(result.markers);
      if (result.center.latitude && result.center.longitude) {
        const newRegion = {
          latitude: result.center.latitude,
          longitude: result.center.longitude,
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        };
        setCenter(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
      }
    } catch (error) {
      console.error("Map search error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    loadMarkers();
  }, [loadMarkers]);

  const toggleFilter = (key: MapMarkerType) => {
    setActiveFilters((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((f) => f !== key);
      }
      return [...prev, key];
    });
  };

  const getMarkerColor = (type: MapMarkerType): string => {
    switch (type) {
      case "breeder":
        return Colors.info;
      case "shooter":
        return Colors.warning;
      case "pet":
        return Colors.primary;
      default:
        return Colors.textMuted;
    }
  };

  const handleMarkerPress = (marker: MapMarker) => {
    if (marker.type === "pet") {
      router.push(`/(pet)/${marker.id}`);
    } else if (marker.type === "breeder") {
      router.push(`/(breeder)/${marker.id}`);
    } else if (marker.type === "shooter") {
      router.push(`/(shooter)/${marker.id}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Feather name="x" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby</Text>
        <TouchableOpacity onPress={loadMarkers} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => {
          const active = activeFilters.includes(opt.key);
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.filterChip,
                active && { backgroundColor: opt.color + "18", borderColor: opt.color },
              ]}
              onPress={() => toggleFilter(opt.key)}
            >
              <Feather
                name={opt.icon as any}
                size={14}
                color={active ? opt.color : Colors.textMuted}
              />
              <Text
                style={[
                  styles.filterChipText,
                  active && { color: opt.color },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={center}
          showsUserLocation
          showsMyLocationButton
          mapType="standard"
        >
          {markers.map((marker, index) => (
            <Marker
              key={`${marker.type}-${marker.id}-${index}`}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              pinColor={getMarkerColor(marker.type as MapMarkerType)}
              onCalloutPress={() => handleMarkerPress(marker)}
            >
              <Callout tooltip={false}>
                <View style={styles.callout}>
                  {marker.profile_image && (
                    <Image
                      source={{ uri: getStorageUrl(marker.profile_image) || "" }}
                      style={styles.calloutImage}
                    />
                  )}
                  <View style={styles.calloutText}>
                    <Text style={styles.calloutName} numberOfLines={1}>
                      {marker.name}
                    </Text>
                    <Text style={styles.calloutType}>
                      {marker.type === "pet"
                        ? `${marker.breed || marker.species}`
                        : marker.type === "breeder"
                          ? `${marker.pet_count || 0} pets`
                          : "Shooter"}
                    </Text>
                    {marker.distance_label && (
                      <Text style={styles.calloutDistance}>
                        {marker.distance_label}
                      </Text>
                    )}
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Feather name="map-pin" size={14} color={Colors.textMuted} />
        <Text style={styles.countText}>
          {markers.length} result{markers.length !== 1 ? "s" : ""} found
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  refreshBtn: {
    padding: 6,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: Colors.white,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: Spacing.md,
    alignSelf: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    padding: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  callout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 200,
    padding: 4,
  },
  calloutImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  calloutText: {
    flex: 1,
  },
  calloutName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  calloutType: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  calloutDistance: {
    fontSize: 11,
    color: Colors.info,
    fontWeight: "500",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  countText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
