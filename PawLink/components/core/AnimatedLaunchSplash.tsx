import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/colors";

const BUBBLES = [
  { size: 186, x: 0.66, y: 0.28, alpha: 0.22 },
  { size: 162, x: 0.02, y: 0.73, alpha: 0.2 },
  { size: 138, x: 0.17, y: 0.87, alpha: 0.2 },
  { size: 116, x: 0.74, y: 0.64, alpha: 0.18 },
  { size: 84, x: 0.06, y: 0.32, alpha: 0.2 },
  { size: 72, x: 0.76, y: 0.84, alpha: 0.22 },
  { size: 62, x: 0.26, y: 0.16, alpha: 0.2 },
  { size: 58, x: 0.74, y: 0.45, alpha: 0.2 },
  { size: 46, x: 0.31, y: 0.74, alpha: 0.2 },
  { size: 36, x: 0.21, y: 0.64, alpha: 0.24 },
  { size: 34, x: 0.52, y: 0.62, alpha: 0.18 },
  { size: 32, x: 0.36, y: 0.29, alpha: 0.24 },
  { size: 30, x: 0.13, y: 0.43, alpha: 0.24 },
  { size: 28, x: 0.75, y: 0.13, alpha: 0.24 },
  { size: 28, x: 0.02, y: 0.77, alpha: 0.24 },
  { size: 26, x: 0.69, y: 0.92, alpha: 0.24 },
];

const TOES = [
  { top: 2, left: 24 },
  { top: 10, left: 86 },
  { top: 52, left: 8 },
  { top: 56, left: 102 },
];

export default function AnimatedLaunchSplash() {
  const toeOpacity = useRef(
    TOES.map(() => new Animated.Value(0.25)),
  ).current;
  const pawPulse = useRef(new Animated.Value(1)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const toeBlink = Animated.loop(
      Animated.stagger(
        160,
        toeOpacity.map((value) =>
          Animated.sequence([
            Animated.timing(value, {
              toValue: 1,
              duration: 240,
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 0.3,
              duration: 240,
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    );

    const pawBreath = Animated.loop(
      Animated.sequence([
        Animated.timing(pawPulse, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pawPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    const logoDrift = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -5,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );

    toeBlink.start();
    pawBreath.start();
    logoDrift.start();

    return () => {
      toeBlink.stop();
      pawBreath.stop();
      logoDrift.stop();
    };
  }, [logoFloat, pawPulse, toeOpacity]);

  const { width, height } = useMemo(() => Dimensions.get("window"), []);

  return (
    <View style={styles.container}>
      {BUBBLES.map((bubble, index) => (
        <View
          key={`bubble-${index}`}
          style={[
            styles.bubble,
            {
              width: bubble.size,
              height: bubble.size,
              borderRadius: bubble.size / 2,
              left: bubble.x * width,
              top: bubble.y * height,
              opacity: bubble.alpha,
            },
          ]}
        />
      ))}

      <View style={styles.centerWrap}>
        <Animated.View
          style={{
            transform: [{ translateY: logoFloat }],
          }}
        >
          <Image
            source={require("@/assets/images/splash-brand.jpg")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.pawWrap,
            {
              transform: [{ scale: pawPulse }],
            },
          ]}
        >
          {TOES.map((toe, index) => (
            <Animated.View
              key={`toe-${index}`}
              style={[
                styles.toe,
                {
                  top: toe.top,
                  left: toe.left,
                  opacity: toeOpacity[index],
                },
              ]}
            />
          ))}

          <View style={styles.pad} />
        </Animated.View>

        <Text style={styles.title}>PAWLINK</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EB4F33",
    overflow: "hidden",
  },
  bubble: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingBottom: 36,
  },
  logo: {
    width: 178,
    height: 178,
  },
  pawWrap: {
    width: 142,
    height: 126,
    position: "relative",
    marginTop: 6,
  },
  toe: {
    position: "absolute",
    width: 34,
    height: 42,
    backgroundColor: Colors.white,
    borderRadius: 20,
  },
  pad: {
    position: "absolute",
    width: 84,
    height: 72,
    backgroundColor: Colors.white,
    left: 29,
    top: 44,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    transform: [{ rotate: "-2deg" }],
  },
  title: {
    color: Colors.white,
    fontFamily: "Baloo-Regular",
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: 2.6,
    textShadowColor: "rgba(0, 0, 0, 0.22)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 4,
    marginTop: -4,
  },
});
