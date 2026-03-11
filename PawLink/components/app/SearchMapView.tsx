import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius } from "@/constants";
import {
  searchService,
  MapMarker,
  MapFilterType,
} from "@/services/searchService";

const FILTER_OPTIONS: {
  key: MapFilterType;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "breeders", label: "Breeders", icon: "users", color: Colors.info },
  { key: "shooters", label: "Shooters", icon: "camera", color: Colors.warning },
  { key: "pets", label: "Pets", icon: "heart", color: Colors.primary },
];

interface SearchMapViewProps {
  onClose: () => void;
}

function buildLeafletHtml(
  markers: MapMarker[],
  center: { latitude: number; longitude: number },
) {
  const markerColor = (type: string) => {
    switch (type) {
      case "breeder":
        return "#3B82F6";
      case "shooter":
        return "#F59E0B";
      case "pet":
        return "#6C63FF";
      default:
        return "#888";
    }
  };

  const markerJs = markers
    .map((m) => {
      const color = markerColor(m.type);
      const subtitle =
        m.type === "pet"
          ? m.breed || m.species || "Pet"
          : m.type === "breeder"
            ? `${m.pet_count || 0} pets`
            : "Shooter";
      const distLine = m.distance_label
        ? `<br/><span style="color:${color};font-size:11px">${m.distance_label}</span>`
        : "";
      // Sanitize name to prevent XSS in popup
      const safeName = (m.name || "").replace(/[<>"'&]/g, "");
      const safeSubtitle = subtitle.replace(/[<>"'&]/g, "");
      return `L.circleMarker([${m.latitude},${m.longitude}],{radius:8,fillColor:'${color}',color:'#fff',weight:2,fillOpacity:0.9}).addTo(map).bindPopup('<b>${safeName}</b><br/>${safeSubtitle}${distLine}',{closeButton:false}).on('click',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'${m.type}',id:${m.id}}))});`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  body{margin:0;padding:0;}
  #map{width:100%;height:100vh;}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map',{zoomControl:false}).setView([${center.latitude},${center.longitude}],11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; OpenStreetMap'
  }).addTo(map);
  L.control.zoom({position:'bottomright'}).addTo(map);
  ${markerJs}
</script>
</body>
</html>`;
}

export default function SearchMapView({ onClose }: SearchMapViewProps) {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<MapFilterType[]>([
    "breeders",
    "shooters",
    "pets",
  ]);
  const [center, setCenter] = useState({
    latitude: 14.5995,
    longitude: 120.9842,
  });

  const loadMarkers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchService.mapSearch({
        types: activeFilters,
        limit: 150,
      });
      setMarkers(result.markers || []);
      if (result.center?.latitude && result.center?.longitude) {
        setCenter(result.center);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load map data";
      console.error("Map search error:", msg, err?.response?.status);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    loadMarkers();
  }, [loadMarkers]);

  const toggleFilter = (key: MapFilterType) => {
    setActiveFilters((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((f) => f !== key);
      }
      return [...prev, key];
    });
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "pet") {
        router.push(`/(pet)/${data.id}`);
      } else if (data.type === "breeder") {
        router.push(`/(breeder)/${data.id}`);
      } else if (data.type === "shooter") {
        router.push(`/(shooter)/${data.id}`);
      }
    } catch {}
  };

  const html = buildLeafletHtml(markers, center);

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
                active && {
                  backgroundColor: opt.color + "18",
                  borderColor: opt.color,
                },
              ]}
              onPress={() => toggleFilter(opt.key)}
            >
              <Feather
                name={opt.icon as any}
                size={14}
                color={active ? opt.color : Colors.textMuted}
              />
              <Text
                style={[styles.filterChipText, active && { color: opt.color }]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={32} color={Colors.warning} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadMarkers} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html }}
            style={styles.map}
            onMessage={handleMessage}
            onLoadEnd={() => setMapReady(true)}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!error && (loading || !mapReady) && (
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  retryText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
});
