import { router } from "expo-router";
import { Camera, Check, Compass, MapPin, Minus, Settings, X } from "lucide-react-native";
import { useEffect } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient as SvgRadialGradient, Rect, Stop } from "react-native-svg";

import { ArButton } from "~/components/ui/ArButton";
import { Grid } from "~/components/ui/surfaces";
import { Text } from "~/components/ui/Text";
import { useDecorativeMotion } from "~/lib/motion";
import { useColors } from "~/theme/theme";

import { CameraModeSwitchBar } from "./CameraModeSwitch";

export type PermState = "pending" | "granted" | "denied" | "unsupported";

const FALLBACK: Partial<Record<PermState, string>> = {
  denied: "Turned off for Wadzzo. Open Settings to allow it.",
  unsupported: "Not available on this device.",
};

const ITEMS = [
  { key: "camera" as const, icon: Camera, title: "Camera", why: "The live view the pins are drawn over. Nothing is recorded or uploaded." },
  { key: "location" as const, icon: MapPin, title: "Location", why: "Works out which drops are within 75 m of you, and where to place them." },
  { key: "motion" as const, icon: Compass, title: "Motion & compass", why: "Tells us which way you're facing so a pin stays put when you turn." },
];

/**
 * Port of the web's ArPermissionGate: every permission says what it's for,
 * one tap asks for all of them. On native a denied permission can't be
 * re-asked in-app, so each denied row offers Settings.
 */
export function ArPermissionGate({ states, requesting, onRequest, error }: { states: Record<"camera" | "location" | "motion", PermState>; requesting: boolean; onRequest: () => void; error: string | null }) {
  const { c } = useColors();
  const insets = useSafeAreaInsets();
  const anyDenied = Object.values(states).some((s) => s === "denied");
  const livePulse = useDecorativeMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!livePulse) {
      cancelAnimation(pulse);
      return;
    }
    pulse.value = withRepeat(withSequence(withTiming(0.94, { duration: 1300, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) })), -1);
  }, [pulse, livePulse]);
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View className="flex-1 bg-ar-void">
      <Grid />
      {/* Static radial glow instead of an 80px blurred boxShadow. */}
      <View pointerEvents="none" style={{ position: "absolute", left: "50%", top: "26%", width: 560, height: 560, marginLeft: -280, marginTop: -280 }}>
        <Svg width={560} height={560}>
          <Defs>
            <SvgRadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={c("ar-green")} stopOpacity={0.22} />
              <Stop offset="0.55" stopColor={c("ar-green")} stopOpacity={0.110} />
              <Stop offset="1" stopColor={c("ar-green")} stopOpacity={0} />
            </SvgRadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#glow)" />
        </Svg>
      </View>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/map"))}
        accessibilityLabel="Close"
        className="absolute right-4 z-20 h-9 w-9 items-center justify-center rounded-full border border-ar-line bg-ar-surface"
        style={{ top: insets.top + 14 }}
      >
        <X size={17} strokeWidth={2.4} color={c("ar-text-dim")} />
      </Pressable>
      <CameraModeSwitchBar mode="ar" top={insets.top + 14} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: insets.top + 72, paddingBottom: insets.bottom + 40, flexGrow: 1, justifyContent: "center" }}>
        <Animated.View style={[{ alignSelf: "center", width: 88, height: 88, marginBottom: 28, alignItems: "center", justifyContent: "center" }, markStyle]}>
          <Svg width={88} height={88} viewBox="0 0 88 88" style={{ position: "absolute" }}>
            {["M2 24V10a8 8 0 0 1 8-8h14", "M64 2h14a8 8 0 0 1 8 8v14", "M86 64v14a8 8 0 0 1-8 8H64", "M24 86H10a8 8 0 0 1-8-8V64"].map((d) => (
              <Path key={d} d={d} stroke={c("ar-green-hot")} strokeWidth={2.5} strokeLinecap="round" fill="none" />
            ))}
          </Svg>
          <Camera size={30} strokeWidth={1.7} color={c("ar-green-hot")} />
        </Animated.View>
        <Text className="font-hud text-center text-[24px] font-bold text-ar-text">Enter AR</Text>
        <Text className="mx-auto mt-2 max-w-[19rem] text-center text-[13px] leading-5 text-ar-dim">Point your phone at the world and the drops around you appear where they actually are.</Text>

        <View className="mt-7 gap-2">
          {ITEMS.map(({ key, icon: Icon, title, why }) => {
            const state = states[key];
            const bad = state === "denied";
            const tone = state === "granted" ? { b: c("ar-green", 0.5), bg: c("ar-green", 0.15), fg: c("ar-green-hot") } : bad ? { b: c("ar-danger", 0.5), bg: c("ar-danger", 0.15), fg: c("ar-danger") } : { b: c("ar-line"), bg: c("ar-text", 0.04), fg: c("ar-text-faint") };
            const StateIcon = state === "granted" ? Check : bad ? X : state === "unsupported" ? Minus : Icon;
            return (
              <View key={key} className="flex-row items-start gap-3 rounded-ar border bg-ar-surface p-3.5" style={{ borderColor: state === "granted" ? c("ar-green", 0.45) : bad ? c("ar-danger", 0.45) : c("ar-line") }}>
                <View className="mt-px h-8 w-8 items-center justify-center rounded-[10px] border" style={{ borderColor: tone.b, backgroundColor: tone.bg }}>
                  <StateIcon size={15} strokeWidth={state === "pending" ? 2.2 : 3} color={tone.fg} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-hud text-[12.5px] font-bold uppercase tracking-[1.2px] text-ar-text">{title}</Text>
                  <Text className="mt-1 text-[11.5px] leading-5 text-ar-faint">{FALLBACK[state] ?? why}</Text>
                  {bad && (
                    <Pressable onPress={() => void Linking.openSettings()} className="mt-2 flex-row items-center gap-1.5 self-start">
                      <Settings size={12} strokeWidth={2.4} color={c("ar-green-hot")} />
                      <Text className="font-hud text-[10.5px] font-semibold uppercase tracking-[1.2px] text-ar-green-hot">Open Settings</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {error && <Text className="mt-4 text-center text-[12px] leading-5 text-ar-danger">{error}</Text>}

        <View className="mt-7 gap-2">
          <ArButton variant="primary" size="lg" block icon={Camera} busy={requesting} onPress={onRequest}>
            {requesting ? "Asking…" : anyDenied ? "Try again" : "Allow & enter AR"}
          </ArButton>
          <ArButton variant="ghost" block onPress={() => router.replace("/map")}>
            Back to the map
          </ArButton>
        </View>
      </ScrollView>
    </View>
  );
}
