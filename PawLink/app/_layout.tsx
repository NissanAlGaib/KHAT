import { Stack, Redirect, useSegments } from "expo-router";
import { SessionProvider, useSession } from "@/context/AuthContext";
import { PetProvider } from "@/context/PetContext";
import { RoleProvider } from "@/context/RoleContext";
import { NotificationProvider } from "@/context/NotificationContext";
import * as SplashScreen from "expo-splash-screen";
import { useLoadFonts } from "@/hooks/useLoadFonts";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { WarningChecker } from "@/components/core/WarningChecker";
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

  return (
    <>
      <WarningChecker />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(chat)" />
        <Stack.Screen name="(pet)" />
        <Stack.Screen name="(shooter)" />
        <Stack.Screen name="(verification)" />
        <Stack.Screen name="search" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="privacy-security" />
        <Stack.Screen name="banned" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}


export default function RootLayout() {
  const fontsLoaded = useLoadFonts();
  
  // Check for OTA updates
  useUpdateChecker();

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
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <SessionProvider>
            <PetProvider>
              <RoleProvider>
                <NotificationProvider>
                  <RootNavigator />
                </NotificationProvider>
              </RoleProvider>
            </PetProvider>
          </SessionProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  } catch (error) {
    console.error("RootLayout error:", error);
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
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
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }
}
