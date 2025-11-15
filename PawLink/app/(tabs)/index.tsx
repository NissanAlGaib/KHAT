import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSession } from "@/context/AuthContext";
import { AnimatedSearchBar } from "@/components/app/AnimatedSearchBar";
import SettingsDropdown from "@/components/app/SettingsDropdown";

const { width: SCREEN_W } = Dimensions.get("window");

function BannerCarousel({ images }: { images: any[] }) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [index, setIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number>(SCREEN_W);

  const onMomentum = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const pageWidth = e.nativeEvent.layoutMeasurement?.width ?? containerWidth;
    const newIndex = Math.round(x / pageWidth);
    setIndex(newIndex);
  };

  return (
    <View
      className="w-full items-center"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w && w !== containerWidth) setContainerWidth(w);
      }}
    >
      
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentum}
        className="w-full"
      >
        {images.map((src, i) => (
          <View key={i} style={{ width: containerWidth, alignItems: "center" }}>
            <Image
              source={src}
              style={{
                width: Math.round(containerWidth * 0.9),
                height: 192,
                borderRadius: 16,
              }}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center justify-center mt-2 space-x-2 gap-2">
        {images.map((_, i) => (
          <View
            key={i}
            className={`rounded-full ${i === index ? "bg-[#ea5b3a]" : "bg-gray-300"}`}
            style={{
              width: i === index ? 8 : 6,
              height: i === index ? 8 : 6,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function TopMatches({
  matches,
}: {
  matches: { name: string; percent: number; img: any }[];
}) {
  return (
    <View className="w-[90%] mt-6 self-center bg-[#F9DCDC] rounded-2xl p-4 border-[2px] border-white">
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-full items-center justify-center mr-3">
          <Image
            source={require("@/assets/images/Heart_Icon.png")}
            className="w-15 h-15"
          />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-baloo text-[#ea5b3a]">
            Perfect Match Found!
          </Text>
          <Text className="text-gray-500 text-sm">
            Based on your profile pet and preference
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mt-4">
        <View className="flex-row -space-x-3">
          {matches.slice(0, 2).map((m, i) => (
            <Image
              key={i}
              source={m.img}
              className="w-12 h-12 rounded-full border-4 border-white"
              style={{ marginLeft: i === 0 ? 0 : -12 }}
            />
          ))}
        </View>

        <View className="flex-1 pl-4">
          <Text className="font-baloo text-base">Luna & Copper</Text>
          <Text className="text-sm text-gray-400">
            {matches[0]?.percent ?? 0}% compatibility
          </Text>
        </View>

        <View>
          <TouchableOpacity>
            <Image
              source={require("@/assets/images/AI_Rec.png")}
              className="w-15 h-15"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function Homepage() {
  const [selectedTab, setSelectedTab] = useState<"pets" | "shooters">("pets");
  const bannerImages = [
    require("../../assets/images/Homepage_Banner.png"),
    require("../../assets/images/Homepage_Banner.png"),
    require("../../assets/images/Homepage_Banner.png"),
  ];
  const topMatches = [
    { name: "Copper", percent: 95, img: require("@/assets/images/icon.png") },
    { name: "Ruckus", percent: 90, img: require("@/assets/images/icon.png") },
    { name: "Milo", percent: 88, img: require("@/assets/images/icon.png") },
  ];

  const PetsGrid = () => (
    <View className="px-4">
      <Text className="text-2xl font-baloo text-[#ea5b3a] mb-4">
        Potential Match
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {new Array(4).fill(0).map((_, i) => (
          <View
            key={i}
            className="w-[48%] mb-4 bg-white rounded-2xl overflow-hidden shadow"
            style={{ elevation: 4 }}
          >
            <Image
              source={require("@/assets/images/icon.png")}
              className="w-full h-36"
              resizeMode="cover"
            />
            <View className="p-3">
              <Text className="font-baloo text-lg text-[#111]">Copper</Text>
              <Text className="text-gray-400 text-sm">Oriental Shorthair</Text>
              <View className="flex-row gap-2 mt-3">
                <View className="bg-yellow-100 px-2 py-1 rounded-full">
                  <Text className="text-xs text-yellow-800">2 year old</Text>
                </View>
                <View className="bg-pink-100 px-2 py-1 rounded-full">
                  <Text className="text-xs text-pink-700">Female</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const ShootersList = () => {
    const IMAGE_HEIGHT = 160; // tailwind h-40 ~ 160
    return (
      <View className="px-4">
        <Text className="text-2xl font-baloo text-[#ea5b3a] mb-4">
          Shooters
        </Text>

        <View className="flex-row flex-wrap justify-between">
          {new Array(6).fill(0).map((_, i) => {
            const isPetOwner = i % 2 === 0; // sample flag — replace with real data field
            return (
              <TouchableOpacity
                key={i}
                onPress={() => console.log("Card pressed", i)}
                activeOpacity={0.85}
                className="w-[48%] mb-4 bg-white rounded-2xl overflow-hidden"
                style={{ elevation: 4 }}
              >
                {/* image container (position: relative) */}
                <View style={{ position: "relative", height: IMAGE_HEIGHT }}>
                  <Image
                    source={require("@/assets/images/icon.png")}
                    style={{
                      width: "100%",
                      height: IMAGE_HEIGHT,
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                    resizeMode="cover"
                  />

                  {/* Pet Owner label: non-pressable pill overlapping image bottom edge */}
                  {isPetOwner && (
                    <View
                      style={{
                        position: "absolute",
                        right: 12,
                        top: IMAGE_HEIGHT - 16, // places the pill overlapping image bottom edge
                        backgroundColor: "#ea5b3a",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 20,
                        elevation: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 12,
                          fontFamily: "Mulish",
                        }}
                      >
                        Pet Owner
                      </Text>
                    </View>
                  )}
                </View>

                {/* card body */}
                <View className="p-3 mt-0">
                  <Text className="font-baloo text-lg text-[#111]">
                    Shooter {i + 1}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    Golden Retriever
                  </Text>

                  <View className="flex-row gap-2 mt-3">
                    <View className="bg-yellow-100 px-2 py-1 rounded-full">
                      <Text className="text-xs text-yellow-800">
                        28 year old
                      </Text>
                    </View>
                    <View className="bg-emerald-100 px-2 py-1 rounded-full">
                      <Text className="text-xs text-emerald-800">Male</Text>
                    </View>
                  </View>

                  <View className="mt-3">
                    <Text className="text-sm text-gray-400">
                      3 years experience
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 items-center bg-[#FFE0D8] relative">
      <View className="bg-white w-full h-48 shadow-black shadow-2xl rounded-b-[40px] p-8 pt-16 flex-col gap-4 relative">
        <View className="flex-row items-center justify-between">
          <Text className="text-[#ea5b3a] opacity-60 text-4xl font-baloo shadow-lg drop-shadow-2xl drop-shadow-black/70">
            PAWLINK
          </Text>
          <View className="flex-row gap-6">
            <TouchableOpacity>
              <Image
                className=""
                source={require("../../assets/images/Subscription_Icon.png")}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image
                className=""
                source={require("../../assets/images/Notif_Icon.png")}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <AnimatedSearchBar />
          <View className="relative z-50">
            <SettingsDropdown />
          </View>
        </View>
      </View>

      <ScrollView
        className="w-full mt-4 px-2"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <BannerCarousel images={bannerImages} />
        <TopMatches matches={topMatches} />

        <View className="flex-row items-center justify-center my-6 gap-4">
          <TouchableOpacity
            onPress={() => setSelectedTab("pets")}
            className={`px-6 py-2 rounded-full ${
              selectedTab === "pets" ? "bg-[#ea5b3a]" : "bg-white"
            }`}
            style={selectedTab === "pets" ? { elevation: 6 } : { elevation: 0 }}
          >
            <Text
              className={`font-mulish ${
                selectedTab === "pets" ? "text-white" : "text-[#ea5b3a]"
              }`}
            >
              PETS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab("shooters")}
            className={`px-6 py-2 rounded-full ${
              selectedTab === "shooters" ? "bg-[#ea5b3a]" : "bg-white"
            }`}
            style={
              selectedTab === "shooters" ? { elevation: 6 } : { elevation: 0 }
            }
          >
            <Text
              className={`font-mulish ${
                selectedTab === "shooters" ? "text-white" : "text-[#ea5b3a]"
              }`}
            >
              SHOOTERS
            </Text>
          </TouchableOpacity>
        </View>
        {selectedTab === "pets" ? <PetsGrid /> : <ShootersList />}
      </ScrollView>
    </View>
  );
}
