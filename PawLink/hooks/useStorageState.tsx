import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const storage = {
  get: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === "web") {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error("Error getting item from storage", e);
      return null;
    }
  },
  set: async (key: string, value: string | null): Promise<void> => {
    try {
      if (Platform.OS === "web") {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
        }
      } else {
        if (value === null) {
          await SecureStore.deleteItemAsync(key);
        } else {
          await SecureStore.setItemAsync(key, value);
        }
      }
    } catch (e) {
      console.error("Error setting item in storage", e);
    }
  },
};

type StorageState<T> = [[boolean, T | null], (value: T | null) => void];

export function useStorageState<T = string>(key: string): StorageState<T> {
  const [isLoading, setIsLoading] = useState(true);
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    let mounted = true;
    storage.get(key).then((raw) => {
      if (!mounted) return;
      if (raw === null) {
        setValue(null);
      } else {
        try {
          const parsed = JSON.parse(raw) as T;
          setValue(parsed);
        } catch {
          // not JSON, return raw as T (useful for plain strings)
          setValue(raw as unknown as T);
        }
      }
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [key]);

  const updateValue = useCallback(
    (newValue: T | null) => {
      setValue(newValue);
      try {
        const raw = newValue === null ? null : JSON.stringify(newValue);
        storage.set(key, raw);
      } catch (e) {
        console.error("Error serializing value for storage", e);
      }
    },
    [key]
  );

  return [[isLoading, value], updateValue];
}
