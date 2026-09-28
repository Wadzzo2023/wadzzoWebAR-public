import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowUpRight, Camera, Check, ChevronLeft, Compass, MapPin, Settings, X, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { AppState, Linking, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { ArButton } from "~/components/ui/ArButton";
import { Grid } from "~/components/ui/surfaces";
import { Dialog } from "~/components/ui/Dialog";
import { Text } from "~/components/ui/Text";
import { useFeedback } from "~/lib/ar/feedback";
import { checkPermissions, PERMISSION_INFO, requestPermissions, type PermCheck, type PermKey } from "~/lib/camera/permissions";
import { useColors } from "~/theme/theme";
import type { TokenName } from "~/theme/tokens";

import { CAMERA_MODES, cameraMode, type CameraModeDef, type CameraModeId } from "./modes";
import { PermissionRow } from "./PermissionRow";

const PERM_ICONS: Record<PermKey, LucideIcon> = { camera: Camera, location: MapPin, motion: Compass };
const PRESS = { stiffness: 520, damping: 30 };

/** The brighter tone of an accent, for icons and small type. */
const hot = (accent: TokenName): TokenName => (accent === "ar-green" ? "ar-green-hot" : accent);

type Step = { kind: "pick" } | { kind: "perms"; mode: CameraModeId };
type Checks = Partial<Record<CameraModeId, PermCheck>>;

/**
 * ── CameraLauncher ─────────────────────────────────────────────────────────
 *
 * What the AR button opens: a centred dialog with a bento of the camera's
 * three ways in (AR, QR, Murals). Each card shows up front whether its
 * permissions are already allowed. Picking one that's ready goes straight
 * in; otherwise the dialog steps to what it needs and why, asks, and then
 * goes in. Coming back from Settings re-reads the permissions, so it's never
 * stale.
 */
export function CameraLauncher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [checks, setChecks] = useState<Checks>({});
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Where to go once the dialog has finished closing (navigating under a
  // closing Modal drops the push on iOS).
  const pending = useRef<NonNullable<CameraModeDef["href"]> | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    const refresh = () =>
      readChecks().then((next) => {
        if (live) setChecks(next);
      });
    void refresh();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void refresh();
    });
    return () => {
      live = false;
      sub.remove();
    };
  }, [open]);

  const go = (mode: CameraModeDef) => {
    pending.current = mode.href;
    onClose();
  };

  const pick = async (mode: CameraModeDef) => {
    if (!mode.href) return;
    setError(null);
    const check = checks[mode.id] ?? (await checkPermissions(mode.needs));
    if (check.ready) go(mode);
    else setStep({ kind: "perms", mode: mode.id });
  };

  const allow = async (mode: CameraModeDef) => {
    if (checks[mode.id]?.blocked) {
      void Linking.openSettings();
      return;
    }
    setRequesting(true);
    setError(null);
    const next = await requestPermissions(mode.needs);
    setChecks((c) => ({ ...c, [mode.id]: next }));
    setRequesting(false);
    if (next.ready) go(mode);
    else if (next.states.camera !== "granted") setError(`${mode.title} needs the camera to work.`);
    else setError("Without location, drops can't be placed around you. You can still look around.");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onClosed={() => {
        const href = pending.current;
        pending.current = null;
        setStep({ kind: "pick" });
        setError(null);
        if (href) router.push(href);
      }}
    >
      {step.kind === "pick" ? (
        <PickStep checks={checks} onPick={(m) => void pick(m)} onClose={onClose} />
      ) : (
        <PermsStep
          mode={cameraMode(step.mode)}
          check={checks[step.mode]}
          requesting={requesting}
          error={error}
          onBack={() => {
            setError(null);
            setStep({ kind: "pick" });
          }}
          onAllow={(m) => void allow(m)}
          onContinue={go}
        />
      )}
    </Dialog>
  );
}

/** Current permission state of every openable mode (no prompting). */
async function readChecks(): Promise<Checks> {
  const entries = await Promise.all(CAMERA_MODES.filter((m) => m.href).map(async (m) => [m.id, await checkPermissions(m.needs)] as const));
  return Object.fromEntries(entries) as Checks;
}

/* ── Step 1: the bento ──────────────────────────────────────────────────── */

function PickStep({ checks, onPick, onClose }: { checks: Checks; onPick: (m: CameraModeDef) => void; onClose: () => void }) {
  const { c } = useColors();
  const [ar, qr, murals] = CAMERA_MODES as [CameraModeDef, CameraModeDef, CameraModeDef];
  return (
    <Animated.View entering={FadeIn.duration(180)} className="px-4">
      <View className="flex-row items-start gap-3 px-1 pb-4">
        <View className="flex-1">
          <Text className="font-hud text-[9.5px] font-semibold uppercase tracking-[2.4px] text-ar-faint">Camera</Text>
          <Text className="font-hud mt-1 text-[21px] font-bold leading-7 text-ar-text">How do you want to collect?</Text>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full border border-ar-line bg-ar-surface-2">
          <X size={16} strokeWidth={2.4} color={c("ar-text-dim")} />
        </Pressable>
      </View>
      <View style={{ gap: 12 }}>
        <BentoCard mode={ar} check={checks.ar} size="hero" index={0} onPress={onPick} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <BentoCard mode={qr} check={checks.qr} size="tile" index={1} onPress={onPick} />
          <BentoCard mode={murals} size="tile" index={2} onPress={onPick} />
        </View>
      </View>
    </Animated.View>
  );
}

function BentoCard({ mode, check, size, index, onPress }: { mode: CameraModeDef; check?: PermCheck; size: "hero" | "tile"; index: number; onPress: (m: CameraModeDef) => void }) {
  const { c } = useColors();
  const { tap } = useFeedback();
  const soon = mode.href === null;
  const hero = size === "hero";
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const Icon = mode.icon;

  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 60).springify().stiffness(380).damping(30)} style={hero ? undefined : { flex: 1 }}>
      <Pressable
        disabled={soon}
        onPressIn={() => scale.set(withSpring(0.97, PRESS))}
        onPressOut={() => scale.set(withSpring(1, PRESS))}
        onPress={() => {
          tap();
          onPress(mode);
        }}
        accessibilityRole="button"
        accessibilityLabel={soon ? `${mode.title}, coming soon` : `${mode.title}. ${mode.blurb}`}
        accessibilityState={{ disabled: soon }}
      >
        <Animated.View
          style={[
            pressStyle,
            {
              minHeight: hero ? 178 : 176,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: c(mode.accent, soon ? 0.2 : 0.38),
              backgroundColor: c("ar-surface-2"),
              overflow: "hidden",
              padding: hero ? 18 : 14,
            },
          ]}
        >
          <LinearGradient colors={[c(mode.accent, soon ? 0.08 : 0.2), c(mode.accent, 0.02)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Grid size={hero ? 26 : 22} opacity={0.06} />
          {/* Oversized mark bleeding off the corner — the card's texture. */}
          <View pointerEvents="none" style={{ position: "absolute", right: hero ? -18 : -14, bottom: hero ? -22 : -16, transform: [{ rotate: "-10deg" }] }}>
            <Icon size={hero ? 132 : 92} strokeWidth={1.2} color={c(mode.accent, soon ? 0.07 : 0.13)} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View
              style={{
                width: hero ? 46 : 40,
                height: hero ? 46 : 40,
                borderRadius: 13,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: c(mode.accent, soon ? 0.25 : 0.5),
                backgroundColor: c(mode.accent, soon ? 0.08 : 0.18),
              }}
            >
              <Icon size={hero ? 22 : 19} strokeWidth={2.2} color={c(hot(mode.accent), soon ? 0.55 : 1)} />
            </View>
            {soon ? (
              <View style={{ borderRadius: 999, borderWidth: 1, borderColor: c(mode.accent, 0.4), backgroundColor: c(mode.accent, 0.14), paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text className="font-hud text-[9px] font-bold uppercase tracking-[1.6px]" style={{ color: c(hot(mode.accent)) }}>
                  Soon
                </Text>
              </View>
            ) : (
              <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: c(hot(mode.accent)) }}>
                <ArrowUpRight size={16} strokeWidth={2.6} color={c("ar-void")} />
              </View>
            )}
          </View>

          <View style={{ flex: 1, justifyContent: "flex-end", marginTop: hero ? 18 : 14, opacity: soon ? 0.6 : 1 }}>
            <Text className={hero ? "font-hud text-[20px] font-bold text-ar-text" : "font-hud text-[15px] font-bold text-ar-text"} numberOfLines={1} adjustsFontSizeToFit>
              {mode.title}
            </Text>
            <Text className={hero ? "mt-1 max-w-[16rem] text-[12.5px] leading-5 text-ar-dim" : "mt-1 text-[11.5px] leading-[17px] text-ar-dim"} numberOfLines={hero ? 2 : 3}>
              {mode.blurb}
            </Text>
            {!soon && <Readiness mode={mode} check={check} />}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** Which permissions this mode uses, each ticked once allowed, plus a one-word verdict. */
function Readiness({ mode, check }: { mode: CameraModeDef; check?: PermCheck }) {
  const { c } = useColors();
  // Motion rides on location, so it isn't its own chip here.
  const shown = mode.needs.filter((k) => k !== "motion");
  const ready = check?.ready;
  return (
    <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
      {shown.map((k) => {
        const granted = check?.states[k] === "granted";
        const I = PERM_ICONS[k];
        return (
          <View
            key={k}
            accessibilityLabel={`${PERMISSION_INFO[k].title} ${granted ? "allowed" : "not allowed yet"}`}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: granted ? c("ar-green", 0.5) : c("ar-line"),
              backgroundColor: granted ? c("ar-green", 0.14) : c("ar-surface", 0.8),
            }}
          >
            <I size={12} strokeWidth={2.3} color={granted ? c("ar-green-hot") : c("ar-text-faint")} />
            {granted && (
              <View style={{ position: "absolute", right: -3, bottom: -3, width: 12, height: 12, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: c("ar-green-hot") }}>
                <Check size={8} strokeWidth={4} color={c("ar-void")} />
              </View>
            )}
          </View>
        );
      })}
      {check && (
        <Text className="font-hud ml-1 text-[9.5px] font-semibold uppercase tracking-[1.4px]" style={{ color: ready ? c("ar-green-hot") : c("ar-text-faint") }}>
          {ready ? "Ready" : "Needs access"}
        </Text>
      )}
    </View>
  );
}

/* ── Step 2: what this mode needs ───────────────────────────────────────── */

function PermsStep({
  mode,
  check,
  requesting,
  error,
  onBack,
  onAllow,
  onContinue,
}: {
  mode: CameraModeDef;
  check?: PermCheck;
  requesting: boolean;
  error: string | null;
  onBack: () => void;
  onAllow: (m: CameraModeDef) => void;
  onContinue: (m: CameraModeDef) => void;
}) {
  const { c } = useColors();
  const Icon = mode.icon;
  const cameraOk = check?.states.camera === "granted";
  // Location said no but the camera is fine: AR still opens (empty scene), so offer it.
  const canContinue = cameraOk && !check?.ready && mode.id === "ar";

  return (
    <Animated.View entering={FadeInRight.springify().stiffness(380).damping(32)} className="px-5">
      <View className="flex-row items-center gap-3 pb-4 pt-1">
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to camera modes" hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full border border-ar-line bg-ar-surface-2">
          <ChevronLeft size={18} strokeWidth={2.4} color={c("ar-text-dim")} />
        </Pressable>
        <View className="flex-1 flex-row items-center gap-2">
          <View style={{ width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c(mode.accent, 0.5), backgroundColor: c(mode.accent, 0.18) }}>
            <Icon size={13} strokeWidth={2.4} color={c(hot(mode.accent))} />
          </View>
          <Text className="font-hud text-[10px] font-semibold uppercase tracking-[2px] text-ar-faint">{mode.title}</Text>
        </View>
      </View>

      <Text className="font-hud text-[22px] font-bold text-ar-text">{check?.blocked ? "Turn on access" : "Allow access"}</Text>
      <Text className="mt-1.5 text-[13px] leading-5 text-ar-dim">
        {check?.blocked
          ? "Wadzzo was told no earlier, so your phone won't ask again. Switch it on in Settings, then come back — this updates on its own."
          : `${mode.title} needs these to work. You'll only be asked once.`}
      </Text>

      <View className="mt-4 gap-2">
        {mode.needs.map((k) => (
          <PermissionRow key={k} perm={k} state={check?.states[k] ?? "pending"} />
        ))}
      </View>

      {error && <Text className="mt-3 text-center text-[12px] leading-5 text-ar-danger">{error}</Text>}

      <View className="mt-5 gap-2">
        {check?.ready ? (
          <ArButton variant="primary" size="lg" block icon={Icon} onPress={() => onContinue(mode)}>
            {`Open ${mode.label}`}
          </ArButton>
        ) : (
          <ArButton variant="primary" size="lg" block icon={check?.blocked ? Settings : Camera} busy={requesting} onPress={() => onAllow(mode)}>
            {requesting ? "Asking…" : check?.blocked ? "Open Settings" : `Allow & open ${mode.label}`}
          </ArButton>
        )}
        {canContinue && (
          <ArButton variant="ghost" block onPress={() => onContinue(mode)}>
            Continue without location
          </ArButton>
        )}
      </View>
    </Animated.View>
  );
}
