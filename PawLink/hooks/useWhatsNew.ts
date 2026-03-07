import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { releases, ReleaseEntry } from "@/constants/changelog";

const STORAGE_KEY_DISMISSED = "@pawlink/whats_new_dismissed_version";

/**
 * Hook that controls the "What's New" modal visibility.
 *
 * Logic:
 *  - The latest release is `releases[0]` from changelog.ts.
 *  - On mount, checks AsyncStorage for the last *dismissed* version.
 *  - If the dismissed version matches the current release version → stay hidden.
 *  - Otherwise the modal is shown every launch until the user taps
 *    "Don't show again", which persists the version in AsyncStorage.
 *  - Tapping "Got it!" hides the modal for this session only.
 *  - Works for both store version bumps and OTA updates (you update the
 *    `version` field in changelog.ts alongside each release).
 */
export function useWhatsNew() {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  const latestRelease: ReleaseEntry | undefined = releases[0];

  useEffect(() => {
    if (!latestRelease) {
      setReady(true);
      return;
    }

    (async () => {
      try {
        const dismissed = await AsyncStorage.getItem(STORAGE_KEY_DISMISSED);
        // Show only if user hasn't permanently dismissed this version
        if (dismissed !== latestRelease.version) {
          setVisible(true);
        }
      } catch (err) {
        console.warn("[useWhatsNew] Error reading storage:", err);
        // Fail open — show the modal anyway
        setVisible(true);
      } finally {
        setReady(true);
      }
    })();
  }, [latestRelease?.version]);

  /** Hide the modal for this session only ("Got it!") */
  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  /** Permanently dismiss this version ("Don't show again") */
  const dontShowAgain = useCallback(async () => {
    setVisible(false);
    if (latestRelease) {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY_DISMISSED,
          latestRelease.version,
        );
      } catch (err) {
        console.warn("[useWhatsNew] Error saving dismissal:", err);
      }
    }
  }, [latestRelease?.version]);

  return {
    /** Whether the modal should be shown right now */
    visible: ready && visible,
    /** The release entry to display (may be undefined if changelog is empty) */
    release: latestRelease,
    /** Dismiss for this session */
    dismiss,
    /** Permanently dismiss for this version */
    dontShowAgain,
  };
}
