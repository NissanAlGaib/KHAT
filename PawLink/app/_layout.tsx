import { Slot, Redirect, useSegments } from "expo-router";
import { SessionProvider, useSession } from "@/context/AuthContext";
import { PetProvider } from "@/context/PetContext";
import * as SplashScreen from "expo-splash-screen";
import { useLoadFonts } from "@/hooks/useLoadFonts";
import { useEffect } from "react";
import "./globals.css";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading } = useSession();
  const segments = useSegments();

  if (isLoading || session === undefined) {
    return null;
  }

  const inAuthGroup = segments[0] === "(auth)";

  if (!session && !inAuthGroup) {
    return <Redirect href="/Login" />;
  }
  if (session && inAuthGroup) {
    return <Redirect href="/" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const fontsLoaded = useLoadFonts();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SessionProvider>
      <PetProvider>
        <RootNavigator />
      </PetProvider>
    </SessionProvider>
  );
}
