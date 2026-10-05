import { Camera, LineLayer, MapView, MarkerView, ShapeSource } from "@rnmapbox/maps";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowUp, Bike, Bus, Car, CornerUpLeft, CornerUpRight, Flag, Footprints, MapPin, Merge, Navigation, RotateCcw, Split, type LucideIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackButton } from "~/components/shell/ScreenHeader";
import { LocationGate } from "~/components/shell/LocationGate";
import { ArButton, ArLinkButton } from "~/components/ui/ArButton";
import { Skeleton } from "~/components/ui/Skeleton";
import { Bevel } from "~/components/ui/surfaces";
import { Text } from "~/components/ui/Text";
import { usePinQuery } from "~/lib/api/queries";
import { useMural } from "~/lib/murals/api";
import { AR_CAPTURE_RADIUS, distanceMeters, formatDistance } from "~/lib/ar/geo";
import { useGeolocation } from "~/lib/ar/location";
import type { TravelMode } from "~/lib/ar/types";
import { PROFILE_LABEL, useDirections, type RouteStep } from "~/lib/ar/useDirections";
import { MAP_STYLE, useColors, useResolvedTheme } from "~/theme/theme";

const MODES: { id: TravelMode; icon: LucideIcon; label: string }[] = [
  { id: "walk", icon: Footprints, label: "Walk" },
  { id: "cycle", icon: Bike, label: "Cycle" },
  { id: "transit", icon: Bus, label: "Transit" },
  { id: "drive", icon: Car, label: "Drive" },
];
const isMode = (v: unknown): v is TravelMode => typeof v === "string" && ["walk", "cycle", "transit", "drive"].includes(v);

function stepIcon(step: RouteStep): LucideIcon {
  if (step.type === "arrive") return MapPin;
  if (step.type === "depart") return ArrowUp;
  if (step.type === "roundabout" || step.type === "rotary") return RotateCcw;
  if (step.type === "merge") return Merge;
  if (step.type === "fork") return Split;
  const m = step.modifier ?? "";
  if (m.includes("left")) return CornerUpLeft;
  if (m.includes("right")) return CornerUpRight;
  if (m === "uturn") return RotateCcw;
  return ArrowUp;
}

/** Murals are scannable from this far (matches MuralSheet). */
const MURAL_SCAN_FROM_M = 100;

/**
 * Port of wadzzoAR's /directions/[id]: route map on top, steps below.
 * `?kind=mural` routes to a mural instead of a drop (same screen, purple).
 */
export default function DirectionsScreen() {
  const { c, rarity: rc } = useColors();
  const theme = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; mode?: string; kind?: string }>();
  const isMural = params.kind === "mural";
  const [mode, setMode] = useState<TravelMode>(isMode(params.mode) ? params.mode : "walk");
  const { fix, status, reason, retry } = useGeolocation();
  const { data: pin, isLoading: pinLoading } = usePinQuery(isMural ? null : (params.id ?? null));
  const muralQuery = useMural(isMural ? (params.id ?? "") : "");
  const mural = muralQuery.data?.mural;
  const target = isMural
    ? mural
      ? { lat: mural.latitude, lng: mural.longitude, title: mural.title, subtitle: mural.artist ? `by ${mural.artist}` : "Mural", imageUrl: mural.coverUrl }
      : null
    : pin
      ? { lat: pin.lat, lng: pin.lng, title: pin.title, subtitle: pin.brandName, imageUrl: pin.imageUrl }
      : null;
  const targetLoading = isMural ? muralQuery.isLoading : pinLoading;

  const origin = useMemo(() => (fix ? { lat: Math.round(fix.lat * 1e4) / 1e4, lng: Math.round(fix.lng * 1e4) / 1e4 } : null), [fix]);
  const { route, isLoading: routeLoading, error: routeError } = useDirections({
    from: origin,
    to: target ? { lat: target.lat, lng: target.lng } : null,
    mode,
    token: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
  });

  const crowFlies = target && fix ? distanceMeters(fix, target) : 0;
  const distance = route?.distance ?? crowFlies;
  const minutes = route ? Math.max(1, Math.round(route.duration / 60)) : null;
  const line = useMemo(
    () => (route ? { type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: route.coordinates } } : null),
    [route],
  );

  const openInMaps = () => {
    if (!target) return;
    const q = `${target.lat},${target.lng}`;
    const flag = mode === "drive" ? "d" : mode === "transit" ? "r" : mode === "cycle" ? "b" : "w";
    void Linking.openURL(Platform.OS === "ios" ? `http://maps.apple.com/?daddr=${q}&dirflg=${flag}` : `google.navigation:q=${q}&mode=${flag === "b" ? "b" : flag === "d" ? "d" : "w"}`);
  };

  if (!fix) return <LocationGate status={status} reason={reason} onRetry={() => void retry()} />;
  if (!target) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-ar-bg px-8">
        {targetLoading ? (
          <Skeleton className="h-6 w-40 rounded-full" />
        ) : (
          <>
            <Text className="font-hud text-[15px] font-bold uppercase tracking-[1.8px] text-ar-dim">{isMural ? "Mural not found" : "Pin not found"}</Text>
            <ArLinkButton href="/map" variant="primary">
              Back to the map
            </ArLinkButton>
          </>
        )}
      </View>
    );
  }

  const ring = isMural ? c("rarity-epic") : rc(pin!.rarity);
  const ringSoft = isMural ? c("rarity-epic", 0.55) : rc(pin!.rarity, 0.55);

  return (
    <View className="flex-1 bg-ar-bg">
      <View style={{ height: "46%" }}>
        <MapView style={StyleSheet.absoluteFill} styleURL={MAP_STYLE[theme]} logoEnabled={false} scaleBarEnabled={false} compassEnabled={false} attributionPosition={{ bottom: 30, left: 8 }}>
          <Camera
            defaultSettings={{ centerCoordinate: [(fix.lng + target.lng) / 2, (fix.lat + target.lat) / 2], zoomLevel: 14.6, pitch: 40 }}
            bounds={{ ne: [Math.max(fix.lng, target.lng), Math.max(fix.lat, target.lat)], sw: [Math.min(fix.lng, target.lng), Math.min(fix.lat, target.lat)] }}
            padding={{ paddingTop: insets.top + 70, paddingBottom: 60, paddingLeft: 50, paddingRight: 50 }}
            animationDuration={600}
          />
          {line && (
            <ShapeSource id="route" shape={line}>
              <LineLayer id="route-glow" style={{ lineColor: "hsl(115,68%,52%)", lineWidth: 12, lineOpacity: 0.22, lineBlur: 6, lineCap: "round", lineJoin: "round" }} />
              <LineLayer id="route-line" style={{ lineColor: "hsl(110,90%,64%)", lineWidth: 3.5, lineCap: "round", lineJoin: "round" }} />
            </ShapeSource>
          )}
          <MarkerView coordinate={[fix.lng, fix.lat]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c("ar-green-hot"), borderWidth: 3, borderColor: "rgba(255,255,255,0.9)" }} />
          </MarkerView>
          <MarkerView coordinate={[target.lng, target.lat]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
            <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: ring, backgroundColor: c("ar-void", 0.85), alignItems: "center", justifyContent: "center" }}>
              <Flag size={13} strokeWidth={2.6} color={ring} />
            </View>
          </MarkerView>
        </MapView>
        <LinearGradient pointerEvents="none" colors={["rgba(6,16,10,0.6)", "rgba(6,16,10,0)", c("ar-bg", 0), c("ar-bg")]} locations={[0, 0.3, 0.7, 1]} style={StyleSheet.absoluteFill} />
        <View style={{ position: "absolute", left: 16, top: insets.top + 14 }}>
          <BackButton />
        </View>
      </View>

      <ScrollView className="-mt-6 flex-1 rounded-t-ar-xl border-t border-ar-line bg-ar-bg" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 20 }}>
        <View className="mb-3 flex-row items-start gap-3">
          <View className="h-[52px] w-[38px] overflow-hidden rounded-[9px] border" style={{ borderColor: ringSoft, borderStyle: isMural && mural?.status !== "APPROVED" ? "dashed" : "solid" }}>
            <Image source={{ uri: target.imageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          </View>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-hud text-[16px] font-bold text-ar-text">{target.title}</Text>
            <Text numberOfLines={1} className="mt-0.5 text-[11.5px] text-ar-faint">{target.subtitle}</Text>
          </View>
        </View>

        <View className="flex-row gap-1.5">
          {MODES.map(({ id: m, icon: Icon, label }) => {
            const active = mode === m;
            const fg = active ? c("ar-green-hot") : c("ar-text-faint");
            return (
              <Pressable key={m} onPress={() => setMode(m)} accessibilityState={{ selected: active }} className="flex-1 items-center gap-1 rounded-[12px] border px-1 py-2.5" style={{ borderColor: active ? c("ar-green", 0.6) : c("ar-line"), backgroundColor: active ? c("ar-green", 0.12) : c("ar-text", 0.03) }}>
                <Icon size={17} strokeWidth={2.1} color={fg} />
                <Text className="font-hud text-[13px] font-bold" style={{ color: fg, fontVariant: ["tabular-nums"] }}>
                  {active && minutes !== null ? `${minutes} min` : "·"}
                </Text>
                <Text className="font-hud text-[8px] uppercase tracking-[1px]" style={{ color: fg }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Bevel className="mt-3.5 flex-row items-center justify-between rounded-ar px-4 py-3" style={{ borderRadius: 16 }}>
          {routeLoading && !route ? (
            <>
              <View>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="mt-2 h-2.5 w-24 rounded-full" />
              </View>
              <View className="items-end">
                <Skeleton className="h-3.5 w-14 rounded-full" />
                <Skeleton className="mt-2 h-2.5 w-10 rounded-full" />
              </View>
            </>
          ) : (
            <>
              <View>
                <Text className="font-hud text-[22px] font-bold text-ar-green-hot">
                  {minutes ?? "—"}
                  <Text className="font-hud text-[12px] font-medium text-ar-dim"> min</Text>
                </Text>
                <Text className="font-hud mt-1 text-[9.5px] uppercase tracking-[1.5px] text-ar-faint">
                  {formatDistance(distance)}
                  {route ? " by road" : " direct"}
                  {route && mode === "transit" ? ` · ${PROFILE_LABEL[route.profile]}` : ""}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-hud text-[12px] font-bold text-ar-text">
                  {minutes !== null ? new Date(Date.now() + minutes * 60_000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}
                </Text>
                <Text className="font-hud mt-1 text-[9.5px] uppercase tracking-[1.5px] text-ar-faint">Arrive</Text>
              </View>
            </>
          )}
        </Bevel>

        {routeError && (
          <View className="mt-3 rounded-ar border border-ar-danger/40 bg-ar-danger/10 px-3.5 py-2.5">
            <Text className="text-[12px] leading-5 text-ar-danger">{routeError} Showing the direct line instead.</Text>
          </View>
        )}

        <Text className="font-hud mb-2 mt-5 text-[9.5px] font-semibold uppercase tracking-[2.4px] text-ar-faint">Route</Text>
        <Bevel className="rounded-ar" style={{ borderRadius: 16 }}>
          {routeLoading && !route ? (
            Array.from({ length: 4 }).map((_, i) => (
              <View key={i} className="flex-row items-center gap-3 border-b border-ar-line px-3.5 py-3">
                <Skeleton className="h-8 w-8 rounded-[10px]" />
                <Skeleton className="h-2.5 flex-1 rounded-full" />
                <Skeleton className="h-2.5 w-10 rounded-full" />
              </View>
            ))
          ) : route && route.steps.length > 0 ? (
            route.steps.map((step, i) => {
              const Icon = stepIcon(step);
              return (
                <View key={i} className="flex-row items-center gap-3 px-3.5 py-3" style={{ borderTopWidth: i ? 1 : 0, borderColor: c("ar-line") }}>
                  <View className="h-8 w-8 items-center justify-center rounded-[10px] border border-ar-line bg-ar-text/5">
                    <Icon size={14} strokeWidth={2.2} color={c("ar-text-dim")} />
                  </View>
                  <Text className="flex-1 text-[12.5px] text-ar-text">{step.instruction}</Text>
                  {step.distance > 0 && <Text className="font-hud text-[11px] font-bold text-ar-faint">{formatDistance(step.distance)}</Text>}
                </View>
              );
            })
          ) : (
            <Text className="px-3.5 py-4 text-center text-[12px] text-ar-faint">No turn-by-turn for this route — head {formatDistance(distance)} toward the {isMural ? "mural" : "pin"}.</Text>
          )}
        </Bevel>

        <Text className="mt-3 px-1 text-[11px] leading-5 text-ar-faint">
          {isMural
            ? `Get within ${MURAL_SCAN_FROM_M} m and scan it with the Murals camera to earn Wadzzo Coins.`
            : `Get within ${AR_CAPTURE_RADIUS} m and this pin becomes capturable in AR.`}
        </Text>

        <View className="gap-2 py-5">
          <ArButton variant="primary" size="lg" block icon={Navigation} onPress={openInMaps}>
            {Platform.OS === "ios" ? "Open in Apple Maps" : "Open in Google Maps"}
          </ArButton>
          <ArButton variant="ghost" size="md" block onPress={() => router.replace("/map")}>
            Back to the map
          </ArButton>
        </View>
      </ScrollView>
    </View>
  );
}
