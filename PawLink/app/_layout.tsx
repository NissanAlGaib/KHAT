import { Slot, Redirect, useSegments } from "expo-router";
import { SessionProvider, useSession } from "@/context/AuthContext";
import "./globals.css";

function RootNavigator() {
  const { session, isLoading } = useSession();
  const segments = useSegments();

  if (isLoading) return null;

  const inAuthGroup = segments[0] === "(auth)";

  if (!session && !inAuthGroup) {
    return <Redirect href="/Login" />;
  }
  if (session && inAuthGroup) {
    return <Redirect href="/Homepage" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}
