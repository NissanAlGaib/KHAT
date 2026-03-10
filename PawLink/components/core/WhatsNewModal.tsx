import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { ChangelogItem, ReleaseEntry } from "@/constants/changelog";

/* ─── category config ──────────────────────────────────────────── */
const CATEGORY_META: Record<
  ChangelogItem["category"],
  {
    icon: keyof typeof Feather.glyphMap;
    color: string;
    bg: string;
    label: string;
  }
> = {
  new: {
    icon: "star",
    color: "#16A34A",
    bg: "#F0FDF4",
    label: "New",
  },
  improved: {
    icon: "trending-up",
    color: "#2563EB",
    bg: "#EFF6FF",
    label: "Improved",
  },
  fixed: {
    icon: "tool",
    color: "#D97706",
    bg: "#FFFBEB",
    label: "Fixed",
  },
};

/* ─── props ─────────────────────────────────────────────────────── */
interface WhatsNewModalProps {
  visible: boolean;
  release: ReleaseEntry;
  onDismiss: () => void;
  /** If true the user can permanently hide with "Don't show again" */
  onDontShowAgain?: () => void;
}

const { height: SCREEN_H } = Dimensions.get("window");

/* ─── component ─────────────────────────────────────────────────── */
export default function WhatsNewModal({
  visible,
  release,
  onDismiss,
  onDontShowAgain,
}: WhatsNewModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  /* group items by category */
  const grouped = release.items.reduce(
    (acc, item) => {
      (acc[item.category] ??= []).push(item);
      return acc;
    },
    {} as Record<ChangelogItem["category"], ChangelogItem[]>,
  );

  /* deterministic order: new → improved → fixed */
  const categoryOrder: ChangelogItem["category"][] = [
    "new",
    "improved",
    "fixed",
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            width: "88%",
            maxHeight: SCREEN_H * 0.78,
          }}
          className="bg-white rounded-3xl overflow-hidden"
        >
          {/* ── header ─────────────────────────────────────────── */}
          <View className="bg-[#FF6B4A] px-6 pt-7 pb-5">
            {/* sparkle icon */}
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3">
                <Feather name="gift" size={22} color="#FFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                  What's New
                </Text>
                <Text
                  className="text-white text-xl font-bold"
                  numberOfLines={1}
                >
                  {release.title}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center bg-white/15 px-3 py-1 rounded-full">
                <Feather name="tag" size={12} color="#FFF" />
                <Text className="text-white text-xs font-medium ml-1.5">
                  v{release.version}
                </Text>
              </View>
              <Text className="text-white/60 text-xs">{release.date}</Text>
            </View>
          </View>

          {/* ── scrollable body ─────────────────────────────────── */}
          <ScrollView
            className="px-5 py-4"
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {categoryOrder.map((cat) => {
              const items = grouped[cat];
              if (!items?.length) return null;
              const meta = CATEGORY_META[cat];

              return (
                <View key={cat} className="mb-5">
                  {/* category header */}
                  <View className="flex-row items-center mb-2.5">
                    <View
                      className="w-7 h-7 rounded-lg items-center justify-center mr-2"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <Feather name={meta.icon} size={14} color={meta.color} />
                    </View>
                    <Text
                      className="text-sm font-bold uppercase tracking-wide"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </Text>
                    <View
                      className="ml-2 px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <Text
                        className="text-[10px] font-bold"
                        style={{ color: meta.color }}
                      >
                        {items.length}
                      </Text>
                    </View>
                  </View>

                  {/* item cards */}
                  {items.map((item, idx) => (
                    <View
                      key={idx}
                      className="flex-row items-start mb-2 rounded-xl px-3 py-3"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <View
                        className="w-5 h-5 rounded-full items-center justify-center mt-0.5 mr-3"
                        style={{ backgroundColor: `${meta.color}22` }}
                      >
                        <Feather name="check" size={12} color={meta.color} />
                      </View>
                      <Text className="flex-1 text-sm text-gray-800 leading-5">
                        {item.text}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </ScrollView>

          {/* ── footer ──────────────────────────────────────────── */}
          <View className="px-5 pb-5 pt-1">
            {/* primary dismiss */}
            <TouchableOpacity
              className="bg-[#FF6B4A] rounded-2xl py-3.5 items-center"
              activeOpacity={0.8}
              onPress={onDismiss}
            >
              <Text className="text-white font-bold text-base">Got it!</Text>
            </TouchableOpacity>

            {/* don't show again */}
            {onDontShowAgain && (
              <TouchableOpacity
                className="mt-3 py-2 items-center"
                activeOpacity={0.6}
                onPress={onDontShowAgain}
              >
                <Text className="text-gray-400 text-xs">Don't show again</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
