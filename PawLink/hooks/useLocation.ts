import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
}

/**
 * Hook to request and manage device location via expo-location.
 * Does NOT auto-request on mount — call requestLocation() explicitly.
 */
export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
    permissionStatus: null,
  });

  // Check current permission status on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setState((prev) => ({ ...prev, permissionStatus: status }));
    })();
  }, []);

  const requestLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setState((prev) => ({ ...prev, permissionStatus: status }));

      if (status !== Location.PermissionStatus.GRANTED) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Location permission denied",
        }));
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setState((prev) => ({
        ...prev,
        ...coords,
        loading: false,
      }));

      return coords;
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: e.message || "Failed to get location",
      }));
      return null;
    }
  }, []);

  return {
    ...state,
    requestLocation,
  };
}
