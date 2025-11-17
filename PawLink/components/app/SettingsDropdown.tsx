import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  TouchableOpacity,
  View,
  Text,
  Platform,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../../context/AuthContext";

const ANIM_DURATION = 140;

export default function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { signOut } = useSession();

  // added: ref + layout state to position menu below trigger
  const triggerRef = useRef<any>(null);
  const [triggerLayout, setTriggerLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: ANIM_DURATION,
      useNativeDriver: true,
    }).start();
  }, [open, anim]);

  const handleNavigate = (path: Parameters<typeof router.push>[0]) => {
    setOpen(false);
    setTimeout(() => router.push("/settings"), ANIM_DURATION); // use absolute root path
  };

  const handleLogout = async () => {
    setOpen(false);
    try {
      await signOut?.();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const opacity = anim;

  // helper to measure trigger and open menu positioned correctly
  const openMenu = () => {
    if (triggerRef.current?.measureInWindow) {
      triggerRef.current.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          setTriggerLayout({ x, y, width, height });
          setOpen(true);
        }
      );
    } else {
      setOpen(true);
    }
  };

  // menu width used for horizontal placement
  const MENU_WIDTH = 160;
  const MENU_VERTICAL_OFFSET = 24;
  const menuLeft =
    triggerLayout != null
      ? Math.max(8, triggerLayout.x + triggerLayout.width - MENU_WIDTH)
      : undefined;
  const menuTop =
    triggerLayout != null
      ? triggerLayout.y + triggerLayout.height + 8
      : Platform.OS === "android"
        ? 44
        : 50;

  return (
    <View style={{ zIndex: 999 }}>
      <Pressable
        // attach ref and openMenu so we measure before showing
        ref={triggerRef}
        onPress={() => openMenu()}
        hitSlop={8}
        style={{ padding: 6 }}
      >
        <Image
          source={require("@/assets/images/Settings_Icon.png")}
          style={{ width: 24, height: 24 }}
        />
      </Pressable>

      <Modal
        transparent
        visible={open}
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={{ flex: 1, backgroundColor: "transparent" }}>
            {/* prevent closing when tapping inside the menu */}
            <TouchableWithoutFeedback>
              <Animated.View
                style={{
                  position: "absolute",
                  top: menuTop,
                  left: menuLeft,
                  marginTop: MENU_VERTICAL_OFFSET,
                  backgroundColor: "white",
                  borderRadius: 8,
                  shadowColor: "#000",
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  elevation: 8,
                  transform: [{ scale }],
                  opacity,
                  width: MENU_WIDTH,
                  overflow: "hidden",
                }}
              >
                <TouchableOpacity
                  onPress={() => handleNavigate("/settings")}
                  activeOpacity={0.6}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#eee",
                  }}
                >
                  <Text style={{ fontSize: 14 }}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogout}
                  activeOpacity={0.6}
                  style={{ padding: 12 }}
                >
                  <Text style={{ fontSize: 14, color: "#d9534f" }}>Logout</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
