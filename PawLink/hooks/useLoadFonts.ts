import { useFonts } from "expo-font";
import { useEffect } from "react";

export function useLoadFonts() {
  const [fontsLoaded, error] = useFonts({
    // 🟣 Baloo
    "Baloo-Regular": require("@/assets/fonts/Baloo-Regular.ttf"),

    // 🔵 Mulish
    "Mulish-Regular": require("@/assets/fonts/Mulish-Regular.ttf"),
    "Mulish-Medium": require("@/assets/fonts/Mulish-Medium.ttf"),
    "Mulish-Bold": require("@/assets/fonts/Mulish-Bold.ttf"),
    "Mulish-Italic": require("@/assets/fonts/Mulish-Italic.ttf"),

    // 🟢 Roboto
    "Roboto-Regular": require("@/assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Bold": require("@/assets/fonts/Roboto-Bold.ttf"),
    "RobotoCondensed-Regular": require("@/assets/fonts/Roboto_Condensed-Regular.ttf"),
    "RobotoSemiCondensed-Regular": require("@/assets/fonts/Roboto_SemiCondensed-Regular.ttf"),
  });

  useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
    }
  }, [error]);

  return fontsLoaded;
}
