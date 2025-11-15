import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const DEFAULT_HEADER_HEIGHT = 140;

export default function Profile() {
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState<number>(
    DEFAULT_HEADER_HEIGHT
  );
  const headerRef = useRef<View | null>(null);

  const handleEditProfile = () => {
    // router.push("/profile/edit");
  };

  const handleAddPet = () => {
    // router.push("/pets/add");
  };

  const handlePetPress = (idx: number) => {
    // router.push(`/pets/${idx}`);
  };

  // sample data (replace with real data)
  const user = {
    name: "Precious Marie...",
    avatar: require("@/assets/images/icon.png"),
    verified: true,
    roleLabel: "Pet Owner",
  };

  const pets = [
    {
      name: "Luna",
      img: require("@/assets/images/icon.png"),
      status: "Available",
    },
  ];

  const stats = [
    { title: "Current breeding", value: "1", subtitle: "Active pairs" },
    { title: "Total Matches", value: "1", subtitle: "All time" },
    { title: "Success Rate", value: "0", subtitle: "Average" },
    { title: "Income", value: "₱0.00", subtitle: "Total" },
  ];

  const CARD_GAP = 12;
  const H_PADDING = 24;
  const cardWidth = Math.floor((width - H_PADDING * 2 - CARD_GAP) / 2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFEFF0" }}>
      {/* measured header attached to absolute top */}
      <View
        ref={headerRef}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h && h !== headerHeight) setHeaderHeight(h);
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          paddingHorizontal: 0,
          paddingTop: 0,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            paddingVertical: 36,
            paddingHorizontal: 24,
            flexDirection: "row",
            alignItems: "center",
            elevation: 10,
          }}
        >
          <Image
            source={user.avatar}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: "#fff",
            }}
          />
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#111",
                  fontFamily: "Baloo",
                }}
              >
                {user.name}
              </Text>

              <TouchableOpacity
                onPress={handleEditProfile}
                style={{
                  backgroundColor: "#ea5b3a",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "600",
                    fontFamily: "Mulish",
                  }}
                >
                  {user.roleLabel}
                </Text>
              </TouchableOpacity>
            </View>

            {user.verified && (
              <View style={{ marginTop: 8 }}>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "#fff",
                    borderColor: "#F4C9C7",
                    borderWidth: 1,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 20,
                    elevation: 1,
                  }}
                >
                  <Text style={{ color: "#ea5b3a", fontSize: 12 }}>
                    Verified
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* content: use measured headerHeight to avoid overlap */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40,
          paddingTop: Math.max(0, headerHeight - 12),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pets Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 2 }}>
          <Text className="font-baloo text-3xl text-[#ea5b3a] mb-4">PETS</Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {pets.map((p, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handlePetPress(i)}
                activeOpacity={0.9}
                style={{ marginRight: 16, alignItems: "center" }}
              >
                <Image
                  source={p.img}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 4,
                    borderColor: "#fff",
                  }}
                />
                <Text style={{ marginTop: 8 }}>{p.name}</Text>
                <View
                  style={{
                    marginTop: 6,
                    backgroundColor: "#DFF3E8",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#2B8A5A", fontSize: 12 }}>
                    {p.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add pet button */}
            <TouchableOpacity
              onPress={handleAddPet}
              activeOpacity={0.8}
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#E5E5E5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 28, color: "#9A9A9A" }}>+</Text>
              </View>
              <Text style={{ marginTop: 8 }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Breeding Overview */}

        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          <Text
            style={{
              fontSize: 22,
              fontFamily: "Baloo",
              color: "#111",
              marginBottom: 12,
            }}
          >
            Breeding Overview
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {stats.map((s, i) => (
              <View
                key={i}
                style={{
                  width: cardWidth,
                  marginBottom: 12,
                  backgroundColor: "#FFE4E2",
                  borderWidth: 3,
                  borderColor: "#EA5B3A",
                  borderRadius: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  elevation: 6,
                  shadowColor: "#EA5B3A",
                  shadowOpacity: 0.08,
                  shadowOffset: { width: 0, height: 6 },
                  shadowRadius: 8,
                }}
              >
                <Text
                  style={{ fontSize: 28, fontWeight: "700", color: "#ea5b3a" }}
                >
                  {s.value}
                </Text>
                <View style={{ marginTop: 10 }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: "#111" }}
                  >
                    {s.title}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#8A8A8A", marginTop: 6 }}
                  >
                    {s.subtitle}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Settings-like action card */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            marginBottom: 28,
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 16,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Baloo",
              color: "#111",
              marginBottom: 12,
            }}
          >
            Account Settings
          </Text>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F3F3",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#FFF6F6",
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ color: "#ea5b3a" }}>⚙️</Text>
              </View>
              <View>
                <Text style={{ fontWeight: "700" }}>Account</Text>
                <Text style={{ color: "#8A8A8A", fontSize: 12 }}>
                  Update your personal information
                </Text>
              </View>
            </View>
            <Text style={{ color: "#E0E0E0" }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F3F3",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#FFFDF2",
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ color: "#F0C04A" }}>🔔</Text>
              </View>
              <View>
                <Text style={{ fontWeight: "700" }}>Notification</Text>
                <Text style={{ color: "#8A8A8A", fontSize: 12 }}>
                  Notification settings
                </Text>
              </View>
            </View>
            <Text style={{ color: "#E0E0E0" }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F3F3",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#FFF6F6",
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ color: "#EA5B3A" }}>🔒</Text>
              </View>
              <View>
                <Text style={{ fontWeight: "700" }}>Privacy & Security</Text>
                <Text style={{ color: "#8A8A8A", fontSize: 12 }}>
                  Control your privacy setting
                </Text>
              </View>
            </View>
            <Text style={{ color: "#E0E0E0" }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => console.log("Sign out")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingVertical: 12,
              marginTop: 8,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#FFF6F6",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ color: "#EA5B3A" }}>⎋</Text>
            </View>
            <View>
              <Text style={{ fontWeight: "700", color: "#D9534F" }}>
                Sign out
              </Text>
              <Text style={{ color: "#8A8A8A", fontSize: 12 }}>
                Log out your account
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
