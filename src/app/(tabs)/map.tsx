import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapCanvas, type MapCanvasHandle } from "~/components/map/MapCanvas";
import { FilterMenu } from "~/components/map/FilterMenu";
import { MapControls } from "~/components/map/MapControls";
import { GpsPill, MapToast } from "~/components/map/MapHud";
import { NearbyStrip } from "~/components/map/NearbyStrip";
import { PinSheet } from "~/components/map/PinSheet";
import { LocationGate } from "~/components/shell/LocationGate";
import { ProfileButton } from "~/components/shell/ProfileButton";
import { useTabBarHeight } from "~/components/shell/BottomTabBar";
import { Glass } from "~/components/ui/surfaces";
import { ArIconButton } from "~/components/ui/ArButton";
import { useBrandsQuery, useCollectPin } from "~/lib/api/queries";
import { useFeedback, useSettings } from "~/lib/ar/feedback";
import { AR_CAPTURE_RADIUS, distanceMeters } from "~/lib/ar/geo";
import { warmArTextures } from "~/lib/ar/arTexture";
import { FALLBACK_CENTER, useGeolocation, useHeading } from "~/lib/ar/location";
import { filterPins, PIN_FILTERS, sortByDistance, useDiscoveryPins, type PinFilterId } from "~/lib/ar/pins";
import { pinStatus } from "~/lib/ar/rarity";
import type { ArPin, TravelMode } from "~/lib/ar/types";
import { useSession } from "~/lib/auth/session";

/**
 * ── /map ───────────────────────────────────────────────────────────────────
 *
 * Port of wadzzoAR's map screen: full-bleed map, GPS pill + filter chips +
 * avatar across the top, the control rail on the right, the nearby rail at
 * the bottom, and the pin sheet. Auto-collect claims in-range pins while the
 * app is open (foreground only, decided); a blip + haptic marks each pin
 * coming into range.
 */
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { fix, status, reason, retry } = useGeolocation();
  const { pins, isLoading, refetch } = useDiscoveryPins();
  // Get AR's small coin/card images resized + cached server-side now, so
  // opening AR doesn't wait on (or stall decoding) full-size originals.
  useEffect(() => {
    if (!fix || pins.length === 0) return;
    const capturable = pins.filter((p) => !p.locked && !p.collected);
    const nearest = [...capturable].sort((a, b) => distanceMeters(fix, a) - distanceMeters(fix, b)).slice(0, 25);
    warmArTextures(nearest);
  }, [pins, fix]);
  const { brands } = useBrandsQuery();
  const collectPin = useCollectPin();
  const settings = useSettings();
  const feedback = useFeedback();
  // Only once location is allowed — iOS rejects the heading watch before that.
  const { heading } = useHeading(status === "tracking");
  const headingUp = settings.compassMode ? heading : null;
  const requireAuth = useSession((s) => s.requireAuth);
  const signedIn = useSession((s) => Boolean(s.user));

  const mapRef = useRef<MapCanvasHandle>(null);
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [filter, setFilter] = useState<PinFilterId>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [following, setFollowing] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hudHeight, setHudHeight] = useState(0);

  const filters = useMemo(() => (settings.followingOnly ? PIN_FILTERS.filter((f) => f.id !== "all") : PIN_FILTERS), [settings.followingOnly]);
  useEffect(() => {
    if (settings.followingOnly && filter === "all") setFilter("following");
  }, [settings.followingOnly, filter]);

  const followedIds = useMemo(() => new Set(brands.filter((b) => b.followed).map((b) => b.id)), [brands]);
  const visible = useMemo(() => filterPins(pins, filter, followedIds), [pins, filter, followedIds]);
  const nearby = useMemo(() => sortByDistance(visible, fix).slice(0, 12), [visible, fix]);
  const selected = useMemo(() => pins.find((p) => p.id === selectedId) ?? null, [pins, selectedId]);

  // Blip + haptic the first time each collectible pin comes into range.
  const announced = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!fix) return;
    const inRange = new Set(pins.filter((p) => pinStatus(p) === "collectible" && distanceMeters(fix, p) <= AR_CAPTURE_RADIUS).map((p) => p.id));
    for (const id of inRange) if (!announced.current.has(id)) feedback.cameIntoRange();
    announced.current = inRange;
  }, [pins, fix, feedback]);

  // Auto-collect (foreground): one claim at a time, after a short settle.
  const pending = useRef(false);
  useEffect(() => {
    if (!settings.autoCollect || !signedIn || !fix || pending.current) return;
    const next = pins.find((p) => p.autoCollect && pinStatus(p) === "collectible" && distanceMeters(fix, p) <= AR_CAPTURE_RADIUS);
    if (!next) return;
    pending.current = true;
    const id = setTimeout(() => {
      collectPin.mutate(
        { id: next.id, lat: fix.lat, lng: fix.lng },
        {
          onSuccess: () => {
            setToast(`Auto-collected ${next.title}`);
            feedback.captured(next.rarity);
          },
          onError: (err) => setToast(err.message),
          onSettled: () => {
            pending.current = false;
          },
        },
      );
    }, 1_200);
    return () => {
      clearTimeout(id);
      pending.current = false;
    };
  }, [settings.autoCollect, signedIn, fix, pins, collectPin, feedback]);

  // `/map?focus=<id>` (from a card's "On the map"): open that pin once loaded.
  const focused = useRef<string | null>(null);
  useEffect(() => {
    if (!focus || focused.current === focus) return;
    const pin = pins.find((p) => p.id === focus);
    if (!pin) return;
    focused.current = focus;
    setFollowing(false);
    setSelectedId(pin.id);
    mapRef.current?.flyToPin(pin);
  }, [focus, pins]);

  const handleRecenter = useCallback(() => {
    setFollowing(true);
    mapRef.current?.recenter(fix ?? FALLBACK_CENTER);
  }, [fix]);

  const handleRefetch = useCallback(() => {
    setRefetching(true);
    void refetch()
      .then((r) => setToast(r.isError ? "Couldn't reach the drop server" : "Pins up to date"))
      .finally(() => setRefetching(false));
  }, [refetch]);

  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (!id) return;
      const pin = pins.find((p) => p.id === id);
      if (pin) {
        setFollowing(false);
        mapRef.current?.flyToPin(pin);
      }
    },
    [pins],
  );

  const handleCapture = useCallback(
    (pin: ArPin) => {
      const go = () => router.push({ pathname: "/ar", params: { target: pin.id } });
      setSelectedId(null);
      if (!requireAuth("collect", go)) return;
      go();
    },
    [requireAuth],
  );

  const handleDirections = useCallback((pin: ArPin, mode: TravelMode) => {
    setSelectedId(null);
    router.push({ pathname: "/directions/[id]", params: { id: pin.id, mode } });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MapCanvas
        ref={mapRef}
        pins={visible}
        fix={fix}
        center={fix ?? FALLBACK_CENTER}
        selectedId={selectedId}
        onSelect={handleSelect}
        following={following}
        onUserPan={() => setFollowing(false)}
        headingUp={headingUp}
        heading={heading}
      />

      {!fix && <LocationGate status={status} reason={reason} onRetry={() => void retry()} />}

      <View
        pointerEvents="box-none"
        onLayout={(e) => setHudHeight(e.nativeEvent.layout.height)}
        style={{ position: "absolute", left: 0, right: 0, top: 0, paddingTop: insets.top + 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, zIndex: 30 }}
      >
        <FilterMenu filters={filters} value={filter} onChange={setFilter} />
        {/* Live status and profile share one capsule, top-right. */}
        <Glass style={{ borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: 6, paddingRight: 3, paddingVertical: 3 }}>
          <GpsPill bare status={status} reason={reason} onExplain={setToast} />
          <ProfileButton />
        </Glass>
      </View>

      {/* Events, centred under the avatar (capsule's 3pt inset + 36pt avatar). */}
      {hudHeight > 0 && (
        <View pointerEvents="box-none" style={{ position: "absolute", top: hudHeight + 8, right: 19, zIndex: 30 }}>
          <ArIconButton icon={CalendarDays} label="Events" size={36} onPress={() => setToast("Events are coming soon")} />
        </View>
      )}

      {fix && (
        <MapControls
          onRecenter={handleRecenter}
          onRefetch={handleRefetch}
          compassMode={settings.compassMode}
          onToggleCompass={() => {
            const turningOn = !settings.compassMode;
            settings.toggle("compassMode");
            if (!turningOn) mapRef.current?.resetBearing();
            setToast(turningOn ? "Compass map on — turn to look around" : "Compass map off — facing north");
          }}
          refetching={refetching}
          following={following}
          autoCollect={settings.autoCollect}
          onToggleAutoCollect={() => {
            const toggle = () => {
              const on = !useSettings.getState().autoCollect;
              useSettings.getState().toggle("autoCollect");
              setToast(on ? "Auto-collect on — nearby drops claim themselves" : "Auto-collect off");
            };
            if (!requireAuth("settings", toggle)) return;
            toggle();
          }}
        />
      )}

      {fix && (
        <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: tabBarHeight + 36, zIndex: 30 }}>
          <NearbyStrip items={nearby} selectedId={selectedId} onSelect={handleSelect} loading={isLoading} />
        </View>
      )}

      <MapToast text={toast} onDone={() => setToast(null)} top={insets.top + 64} />

      <PinSheet pin={selected} fix={fix} onClose={() => setSelectedId(null)} onCapture={handleCapture} onDirections={handleDirections} />
    </View>
  );
}
