import { Slot, Redirect, useSegments } from "expo-router";
import { SessionProvider, useSession } from "@/context/AuthContext";
import { PetProvider } from "@/context/PetContext";
import { RoleProvider } from "@/context/RoleContext";
import { NotificationProvider } from "@/context/NotificationContext";
import * as SplashScreen from "expo-splash-screen";
import { useLoadFonts } from "@/hooks/useLoadFonts";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./globals.css";

SplashScreen.preventAutoHideAsync().catch((err) => {
  console.warn("SplashScreen.preventAutoHideAsync error:", err);
});

function RootNavigator() {
  const { session, isLoading } = useSession();
  const segments = useSegments();

  const inAuthGroup = useMemo(() => segments[0] === "(auth)", [segments]);

  useEffect(() => {
    console.log(
      "RootNavigator - isLoading:",
      isLoading,
      "session:",
      !!session,
      "segments:",
      segments,
      "inAuthGroup:",
      inAuthGroup
    );
  }, [isLoading, session, segments, inAuthGroup]);

  if (isLoading) {
    return null;
  }

  if (!session && !inAuthGroup) {
    return <Redirect href="/login" />;
  }
  if (session && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const fontsLoaded = useLoadFonts();

  useEffect(() => {
    console.log("RootLayout - fontsLoaded:", fontsLoaded);
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch((err) => {
        console.warn("SplashScreen.hideAsync error:", err);
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    console.log("Waiting for fonts to load...");
    return null;
  }

  try {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SessionProvider>
          <PetProvider>
            <RoleProvider>
              <NotificationProvider>
                <RootNavigator />
              </NotificationProvider>
            </RoleProvider>
          </PetProvider>
        </SessionProvider>
      </GestureHandlerRootView>
    );
  } catch (error) {
    console.error("RootLayout error:", error);
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ color: "red", textAlign: "center" }}>
            Error loading app: {String(error)}
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }
}
