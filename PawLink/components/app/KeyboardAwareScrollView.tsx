import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  ScrollView,
  ScrollViewProps,
  Platform,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import type {
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

type ScrollToInputFn = (input: TextInput) => void;

const KeyboardScrollCtx = createContext<ScrollToInputFn | null>(null);

/**
 * Hook for child components (e.g., CustomInput) to trigger auto-scroll
 * when they receive focus. Returns null if not inside a KeyboardAwareScrollView.
 */
export function useKeyboardScroll(): ScrollToInputFn | null {
  return useContext(KeyboardScrollCtx);
}

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  /** Extra offset for iOS KeyboardAvoidingView (accounts for headers, etc.) */
  iosOffset?: number;
}

/**
 * KeyboardAwareScrollView
 *
 * Drop-in ScrollView replacement that ensures focused TextInputs are visible
 * when the keyboard opens.
 *
 * - iOS: Wraps in KeyboardAvoidingView with behavior="padding"
 * - Android: Monitors keyboard + focus events and auto-scrolls to the focused input
 *
 * Child components using `useKeyboardScroll()` get auto-scroll on focus.
 */
export default function KeyboardAwareScrollView({
  children,
  iosOffset = 0,
  onScroll,
  scrollEventThrottle,
  keyboardShouldPersistTaps,
  ...rest
}: KeyboardAwareScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const lastFocusedRef = useRef<TextInput | null>(null);

  /**
   * Measure the input's position in the window and scroll if it's
   * near/below the bottom edge (i.e., behind the keyboard).
   */
  const performScroll = useCallback((input: TextInput | null) => {
    if (!input || !scrollRef.current) return;

    // Delay to let keyboard animation + layout settle
    setTimeout(() => {
      try {
        (input as any).measureInWindow?.(
          (x: number, y: number, _w: number, h: number) => {
            if (y === undefined || y === null) return;

            const windowH = Dimensions.get("window").height;
            const inputBottom = y + h;

            // If the input's bottom edge is within 60px of the window bottom,
            // scroll up so the input has 120px of breathing room above the keyboard
            if (inputBottom > windowH - 60) {
              const scrollBy = inputBottom - windowH + 120;
              scrollRef.current?.scrollTo({
                y: Math.max(0, scrollOffsetRef.current + scrollBy),
                animated: true,
              });
            }
          }
        );
      } catch {
        // Silently ignore measurement errors
      }
    }, 300);
  }, []);

  /**
   * Called by child inputs (CustomInput) on focus.
   * Stores the ref and triggers scroll on Android.
   */
  const scrollToInput = useCallback<ScrollToInputFn>(
    (input) => {
      lastFocusedRef.current = input;
      if (Platform.OS === "android") {
        performScroll(input);
      }
    },
    [performScroll]
  );

  // When keyboard shows on Android, also scroll to the last focused input.
  // This handles the case where the keyboard animates in after focus.
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const sub = Keyboard.addListener("keyboardDidShow", () => {
      performScroll(lastFocusedRef.current);
    });

    return () => sub.remove();
  }, [performScroll]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
      onScroll?.(e);
    },
    [onScroll]
  );

  const contextValue = useMemo(() => scrollToInput, [scrollToInput]);

  const scrollView = (
    <ScrollView
      ref={scrollRef}
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle ?? 16}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? "handled"}
      {...rest}
    >
      {children}
    </ScrollView>
  );

  // iOS: also wrap in KeyboardAvoidingView for proper padding
  if (Platform.OS === "ios") {
    return (
      <KeyboardScrollCtx.Provider value={contextValue}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={iosOffset}
        >
          {scrollView}
        </KeyboardAvoidingView>
      </KeyboardScrollCtx.Provider>
    );
  }

  // Android: just the scroll view — native resize handles the space,
  // our performScroll handles scrolling to the focused input.
  return (
    <KeyboardScrollCtx.Provider value={contextValue}>
      {scrollView}
    </KeyboardScrollCtx.Provider>
  );
}
