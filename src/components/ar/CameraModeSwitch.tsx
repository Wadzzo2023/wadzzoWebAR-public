import { router } from "expo-router";
import { QrCode, ScanLine } from "lucide-react-native";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";

import { Glass } from "~/components/ui/surfaces";
import { Text } from "~/components/ui/Text";
import { useColors } from "~/theme/theme";

const MODES = [
  { id: "ar", href: "/ar", label: "AR", icon: ScanLine },
  { id: "qr", href: "/scan", label: "QR", icon: QrCode },
] as const;

export type CameraMode = (typeof MODES)[number]["id"];

/**
 * Port of the web's AR | QR switch: one camera behind the AR tab, two ways
 * to use it. `router.replace` so switching isn't a place you went — Exit
 * still returns to wherever the camera was opened from.
 */
export function CameraModeSwitch({ mode }: { mode: CameraMode }) {
  const { c } = useColors();
  const index = MODES.findIndex((m) => m.id === mode);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: withSpring(index * 60, { stiffness: 460, damping: 34, mass: 0.7 }) }] }));
  return (
    <Glass style={{ height: 36, borderRadius: 18, padding: 3, flexDirection: "row", gap: 2 }}>
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", top: 3, left: 3, width: 58, height: 28, borderRadius: 14, borderWidth: 1, borderColor: c("ar-green", 0.5), backgroundColor: c("ar-green", 0.2) }, pill]}
      />
      {MODES.map((m) => {
        const active = m.id === mode;
        const Icon = m.icon;
        return (
          <Pressable
            key={m.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => !active && router.replace(m.href)}
            style={{ width: 58, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}
          >
            <Icon size={12} strokeWidth={2.5} color={active ? c("ar-green-hot") : c("ar-text-faint")} />
            <Text className="font-hud text-[11px] font-bold tracking-[1.3px]" style={{ color: active ? c("ar-text") : c("ar-text-faint") }}>
              {m.label}
            </Text>
          </Pressable>
        );
      })}
    </Glass>
  );
}

export function CameraModeSwitchBar({ mode, top }: { mode: CameraMode; top: number }) {
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top, left: 0, right: 0, alignItems: "center", zIndex: 40 }}>
      <CameraModeSwitch mode={mode} />
    </View>
  );
}
