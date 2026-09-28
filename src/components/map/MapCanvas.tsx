import { Camera, MapView, MarkerView } from "@rnmapbox/maps";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Supercluster, { type ClusterProperties } from "supercluster";

import { useTabBarHeight } from "~/components/shell/BottomTabBar";
import { AR_CAPTURE_RADIUS, distanceMeters } from "~/lib/ar/geo";
import type { ArPin, Coords, GeoFix } from "~/lib/ar/types";
import { MAP_STYLE, useResolvedTheme } from "~/theme/theme";

import { ClusterBillboard } from "./ClusterBillboard";
import { PinMarker } from "./PinMarker";
import { metersPerPixel, UserAccuracy, UserPuck } from "./UserPuck";

export type MapCanvasHandle = {
  recenter: (coords: Coords, opts?: { zoom?: number }) => void;
  flyToPin: (pin: ArPin) => void;
  resetBearing: () => void;
};

/**
 * ── MapCanvas ──────────────────────────────────────────────────────────────
 *
 * Port of the web's MapCanvas on `@rnmapbox/maps`, with the same camera
 * numbers: opens at zoom 16.4, pitch 48, bearing −14; recenter eases to 16.8;
 * a selected pin flies to 17.6 nudged above centre so the sheet doesn't cover
 * it; pitch ≤ 62, zoom 1–19.5 (the web stops at 11; the app can see the whole world). Follows the fix until the viewer pans.
 *
 * Pins are React views (PinMarker) so they look and move exactly like the
 * web's. Zoomed out, pins that would overlap are grouped (supercluster, in
 * JS) into ClusterBillboards — a little billboard with a bento of the brands
 * inside and a count. Only what's on screen is drawn, so a world view with
 * thousands of drops is still a few dozen views.
 */
const MAX_MARKERS = 80;
/** Screen area (× the visible size) whose pins get markers when zoomed in. */
const VIEW_MARGIN = 1.5;
/** Groups stop forming above this zoom: from street level in, every pin is its own marker. */
const CLUSTER_MAX_ZOOM = 13;
/** How close (px) pins must be on screen to share a billboard. */
const CLUSTER_RADIUS = 70;
/** ~30 m grid (in degrees) for deciding which pins are "near". */
const SPLIT_GRID = 0.0003;
/** Zoom only feeds the puck's accuracy disc; don't re-render pins for less. */
const ZOOM_STEP = 0.25;

export const MapCanvas = forwardRef<
  MapCanvasHandle,
  {
    pins: ArPin[];
    fix: GeoFix | null;
    center: Coords;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    following: boolean;
    onUserPan: () => void;
    headingUp: number | null;
    heading: number | null;
    /** Where the camera settled (centre + zoom) — drives which pins get loaded. */
    onViewportIdle?: (center: Coords, zoom: number) => void;
  }
>(function MapCanvas(
  {
    pins,
    fix,
    center,
    selectedId,
    onSelect,
    following,
    onUserPan,
    headingUp,
    heading,
    onViewportIdle,
  },
  ref,
) {
  const theme = useResolvedTheme();
  const camera = useRef<Camera>(null);
  const [zoom, setZoom] = useState(16.4);
  /** Where the camera settled last (snapped in onMapIdle); null until it has. */
  const [view, setView] = useState<Coords | null>(null);
  const lastBearing = useRef<number | null>(null);

  const recenter = useCallback((coords: Coords, opts?: { zoom?: number }) => {
    camera.current?.setCamera({
      centerCoordinate: [coords.lng, coords.lat],
      zoomLevel: opts?.zoom ?? 16.8,
      animationDuration: 900,
      animationMode: "easeTo",
    });
  }, []);
  const flyToPin = useCallback((pin: ArPin) => {
    camera.current?.setCamera({
      centerCoordinate: [pin.lng, pin.lat],
      zoomLevel: 17.6,
      padding: {
        paddingBottom: 220,
        paddingTop: 0,
        paddingLeft: 0,
        paddingRight: 0,
      },
      animationDuration: 800,
      animationMode: "easeTo",
    });
  }, []);
  const resetBearing = useCallback(() => {
    lastBearing.current = null;
    camera.current?.setCamera({
      heading: 0,
      animationDuration: 500,
      animationMode: "easeTo",
    });
  }, []);
  useImperativeHandle(ref, () => ({ recenter, flyToPin, resetBearing }), [
    recenter,
    flyToPin,
    resetBearing,
  ]);

  // Follow the fix while the viewer hasn't taken the wheel.
  useEffect(() => {
    if (!following || !fix) return;
    camera.current?.setCamera({
      centerCoordinate: [fix.lng, fix.lat],
      animationDuration: 850,
      animationMode: "easeTo",
    });
  }, [following, fix]);

  // Compass mode: turn the map under a fixed "up", ignoring < 2° jitter.
  useEffect(() => {
    if (headingUp == null) return;
    const prev = lastBearing.current;
    if (prev != null && Math.abs(((headingUp - prev + 540) % 360) - 180) < 2)
      return;
    lastBearing.current = headingUp;
    camera.current?.setCamera({
      heading: headingUp,
      animationDuration: 260,
      animationMode: "easeTo",
    });
  }, [headingUp]);

  // ── What to draw ──
  // Only what's on screen (plus a margin, so panning doesn't pop things in
  // at the edge). The anchor is snapped to a ~30 m grid so small drags and
  // GPS ticks don't recompute anything.
  const from = view ?? fix ?? center;
  const anchorLat = Math.round(from.lat / SPLIT_GRID) * SPLIT_GRID;
  const anchorLng = Math.round(from.lng / SPLIT_GRID) * SPLIT_GRID;
  const { width: winW, height: winH } = useWindowDimensions();
  const viewMpp = metersPerPixel(anchorLat, zoom);
  const halfLatDeg = ((winH / 2) * viewMpp * VIEW_MARGIN) / 111_320;
  const halfLngDeg =
    ((winW / 2) * viewMpp * VIEW_MARGIN) /
    (111_320 * Math.max(Math.cos((anchorLat * Math.PI) / 180), 0.01));
  const clusterZoom = Math.floor(zoom);

  // Grouping index — rebuilt only when the pin list changes. Each group
  // carries up to 4 distinct brand thumbnails for its billboard.
  const index = useMemo(() => {
    const sc = new Supercluster<
      { i: number; imgs: string[] },
      { imgs: string[] }
    >({
      radius: CLUSTER_RADIUS,
      maxZoom: CLUSTER_MAX_ZOOM,
      minPoints: 2,
      map: (p) => ({ imgs: [...p.imgs] }),
      reduce: (acc, p) => {
        for (const u of p.imgs)
          if (acc.imgs.length < 4 && !acc.imgs.includes(u)) acc.imgs.push(u);
      },
    });
    sc.load(
      pins.map((pin, i) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [pin.lng, pin.lat] },
        properties: {
          i,
          imgs: pin.brandImageUrl ? [pin.brandImageUrl] : [], // originals; the billboard thumbnails them
        },
      })),
    );
    return sc;
  }, [pins]);

  const { singles, groups } = useMemo(() => {
    const west = Math.max(anchorLng - halfLngDeg, -180);
    const east = Math.min(anchorLng + halfLngDeg, 180);
    const south = Math.max(anchorLat - halfLatDeg, -85);
    const north = Math.min(anchorLat + halfLatDeg, 85);
    const anchor = { lat: anchorLat, lng: anchorLng };
    const items = index.getClusters([west, south, east, north], clusterZoom);
    const groupList: {
      id: number;
      lng: number;
      lat: number;
      count: number;
      imgs: string[];
      d: number;
    }[] = [];
    const singleList: { pin: ArPin; d: number }[] = [];
    for (const f of items) {
      const [lng, lat] = f.geometry.coordinates as [number, number];
      const d = distanceMeters(anchor, { lat, lng });
      if ("cluster" in f.properties && f.properties.cluster) {
        const cp = f.properties as ClusterProperties & {
          imgs: string[];
        };
        groupList.push({
          id: cp.cluster_id,
          lng,
          lat,
          count: cp.point_count,
          imgs: cp.imgs,
          d,
        });
      } else {
        const pin = pins[(f.properties as { i: number }).i];
        if (pin) singleList.push({ pin, d });
      }
    }
    // Safety cap for a very dense street-level screen: nearest to the centre first.
    const budget = Math.max(MAX_MARKERS - groupList.length, 0);
    const shown =
      singleList.length > budget
        ? singleList.sort((a, b) => a.d - b.d).slice(0, budget)
        : singleList;
    const singlePins = shown.map((x) => x.pin);
    // The selected pin always has its own marker, even inside a group.
    const picked = selectedId
      ? pins.find((p) => p.id === selectedId)
      : undefined;
    if (picked && !singlePins.includes(picked)) singlePins.push(picked);
    return { singles: singlePins, groups: groupList };
  }, [
    index,
    pins,
    anchorLat,
    anchorLng,
    halfLatDeg,
    halfLngDeg,
    clusterZoom,
    selectedId,
  ]);

  const openGroup = useCallback(
    (id: number) => {
      const g = groups.find((x) => x.id === id);
      if (!g) return;
      const z = Math.min(index.getClusterExpansionZoom(id) + 0.3, 19);
      camera.current?.setCamera({
        centerCoordinate: [g.lng, g.lat],
        zoomLevel: z,
        animationDuration: 650,
        animationMode: "easeTo",
      });
    },
    [groups, index],
  );

  const mpp = metersPerPixel(fix?.lat ?? center.lat, zoom);
  // The tab bar floats over the map; keep the Mapbox credit above it.
  const tabBarHeight = useTabBarHeight();

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      styleURL={MAP_STYLE[theme]}
      logoEnabled={false}
      attributionPosition={{ bottom: tabBarHeight + 8, left: 8 }}
      scaleBarEnabled={false}
      compassEnabled={false}
      pitchEnabled
      onPress={() => onSelect(null)}
      onCameraChanged={(s) => {
        // Fires every frame while the camera moves, so no state here: markers
        // and groups are recomputed once the camera settles (onMapIdle).
        if (s.gestures.isGestureActive && following) onUserPan();
      }}
      onMapIdle={(s) => {
        const z = s.properties.zoom;
        // Always take a zoom that changes the grouping level, however small the change.
        setZoom((prev) =>
          Math.abs(z - prev) >= ZOOM_STEP || Math.floor(prev) !== Math.floor(z)
            ? z
            : prev,
        );
        const [lng, lat] = s.properties.center as [number, number];
        setView((prev) =>
          prev &&
          Math.abs(prev.lat - lat) < SPLIT_GRID &&
          Math.abs(prev.lng - lng) < SPLIT_GRID
            ? prev
            : { lat, lng },
        );
        onViewportIdle?.({ lat, lng }, z);
      }}
    >
      <Camera
        ref={camera}
        defaultSettings={{
          centerCoordinate: [(fix ?? center).lng, (fix ?? center).lat],
          zoomLevel: 16.4,
          pitch: 48,
          heading: -14,
        }}
        // Zoom all the way out to the whole world; pins group into
        // billboards, so a world view stays a few dozen views.
        minZoomLevel={1}
        maxZoomLevel={19.5}
      />
      {fix && (
        <MarkerView
          coordinate={[fix.lng, fix.lat]}
          anchor={{ x: 0.5, y: 0.5 }}
          allowOverlap
          allowOverlapWithPuck
        >
          <UserAccuracy fix={fix} metersPerPixel={mpp} />
        </MarkerView>
      )}
      {groups.map((g) => (
        <MarkerView
          key={`g-${g.id}`}
          coordinate={[g.lng, g.lat]}
          anchor={{ x: 0.5, y: 1 }}
          allowOverlap
        >
          <ClusterBillboard
            id={g.id}
            count={g.count}
            images={g.imgs}
            onPress={openGroup}
          />
        </MarkerView>
      ))}
      {singles.map((pin) => (
        <MarkerView
          key={pin.id}
          coordinate={[pin.lng, pin.lat]}
          anchor={{ x: 0.5, y: 1 }}
          allowOverlap
          isSelected={pin.id === selectedId}
        >
          <PinMarker
            pin={pin}
            selected={pin.id === selectedId}
            inRange={
              fix ? distanceMeters(fix, pin) <= AR_CAPTURE_RADIUS : false
            }
            onSelect={onSelect}
          />
        </MarkerView>
      ))}
      {fix && (
        // `isSelected` lifts a view annotation above the others: pins bunched
        // around the user must never cover where they are.
        <MarkerView
          coordinate={[fix.lng, fix.lat]}
          anchor={{ x: 0.5, y: 0.5 }}
          allowOverlap
          allowOverlapWithPuck
          isSelected
        >
          <UserPuck fix={fix} heading={heading} />
        </MarkerView>
      )}
    </MapView>
  );
});
