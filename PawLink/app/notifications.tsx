import { useEffect } from "react";
import { useRouter } from "expo-router";

/**
 * Legacy notifications route — redirects to the Activity tab
 * with the Verification filter pre-selected.
 *
 * All verification features (summary badges, grouped sections,
 * resubmit buttons, admin warnings) now live in the unified
 * Activity tab at /(tabs)/activity.
 */
export default function NotificationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Replace so the user can't "go back" to a blank screen
    router.replace("/(tabs)/activity");
  }, [router]);

  return null;
}
