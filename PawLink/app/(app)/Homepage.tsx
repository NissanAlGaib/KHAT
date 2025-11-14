import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useSession } from "@/context/AuthContext";
import { AnimatedSearchBar } from "@/components/app/AnimatedSearchBar";

export default function Homepage() {
  return (
    <View className="flex-1 items-center bg-[#FFE0D8]">
      <View className="bg-white w-full h-48 shadow-black shadow-2xl rounded-b-[40px] p-8 pt-16 flex-col gap-4">
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

          <TouchableOpacity className="p-2">
            <Image source={require("../../assets/images/Settings_Icon.png")} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-4">
          <Image
            source={require("../../assets/images/Homepage_Banner.png")}
            className="rounded-3xl"
          />
        </View>

        <View className="my-6 bg-[#F2C7BE] border-white border-[4px] rounded-3xl p-4 flex-col items-center h-56 relative">
          <View className="w-full relative">
            <Image
              source={require("../../assets/images/Heart_Icon.png")}
              className="absolute -top-0"
            />
          </View>
          <View className="flex-col mt-6 ml-8">
            <Text className="text-2xl font-baloo text-[#ea5b3a]">
              Perfect Match Found!
            </Text>
            <Text className="text-gray-500 text-sm font-mulish">
              Based on your profile pet and preference
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
