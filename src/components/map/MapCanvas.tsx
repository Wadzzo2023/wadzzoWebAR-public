import { Camera, MapView, MarkerView } from "@rnmapbox/maps";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import { useTabBarHeight } from "~/components/shell/BottomTabBar";
import { AR_CAPTURE_RADIUS, distanceMeters } from "~/lib/ar/geo";
import type { ArPin, Coords, GeoFix } from "~/lib/ar/types";
import { MAP_STYLE, useResolvedTheme } from "~/theme/theme";

import { FarPin } from "./FarPin";
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
 * it; pitch ≤ 62, zoom 11–19.5. Follows the fix until the viewer pans.
 *
 * The nearest MAX_MARKERS pins are React views (PinMarker) so they look and
 * move exactly like the web's. Every pin beyond that is a FarPin — the same
 * brand image, drawn by Mapbox as a static bitmap — so the map scales to any
 * number of drops without adding per-frame work.
 */
const MAX_MARKERS = 80;
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
  }
>(function MapCanvas({ pins, fix, center, selectedId, onSelect, following, onUserPan, headingUp, heading }, ref) {
  const theme = useResolvedTheme();
  const camera = useRef<Camera>(null);
  const [zoom, setZoom] = useState(16.4);
  const lastBearing = useRef<number | null>(null);

  const recenter = useCallback((coords: Coords, opts?: { zoom?: number }) => {
    camera.current?.setCamera({ centerCoordinate: [coords.lng, coords.lat], zoomLevel: opts?.zoom ?? 16.8, animationDuration: 900, animationMode: "easeTo" });
  }, []);
  const flyToPin = useCallback((pin: ArPin) => {
    camera.current?.setCamera({
      centerCoordinate: [pin.lng, pin.lat],
      zoomLevel: 17.6,
      padding: { paddingBottom: 220, paddingTop: 0, paddingLeft: 0, paddingRight: 0 },
      animationDuration: 800,
      animationMode: "easeTo",
    });
  }, []);
  const resetBearing = useCallback(() => {
    lastBearing.current = null;
    camera.current?.setCamera({ heading: 0, animationDuration: 500, animationMode: "easeTo" });
  }, []);
  useImperativeHandle(ref, () => ({ recenter, flyToPin, resetBearing }), [recenter, flyToPin, resetBearing]);

  // Follow the fix while the viewer hasn't taken the wheel.
  useEffect(() => {
    if (!following || !fix) return;
    camera.current?.setCamera({ centerCoordinate: [fix.lng, fix.lat], animationDuration: 850, animationMode: "easeTo" });
  }, [following, fix]);

  // Compass mode: turn the map under a fixed "up", ignoring < 2° jitter.
  useEffect(() => {
    if (headingUp == null) return;
    const prev = lastBearing.current;
    if (prev != null && Math.abs(((headingUp - prev + 540) % 360) - 180) < 2) return;
    lastBearing.current = headingUp;
    camera.current?.setCamera({ heading: headingUp, animationDuration: 260, animationMode: "easeTo" });
  }, [headingUp]);

  const { near, far } = useMemo(() => {
    if (pins.length <= MAX_MARKERS) return { near: pins, far: [] as ArPin[] };
    const from = fix ?? center;
    const sorted = [...pins].sort((a, b) => distanceMeters(from, a) - distanceMeters(from, b));
    return { near: sorted.slice(0, MAX_MARKERS), far: sorted.slice(MAX_MARKERS) };
  }, [pins, fix, center]);

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
        // Fires every frame while the camera moves: re-rendering all the
        // markers here was the bulk of the map's per-frame JS work.
        const z = s.properties.zoom;
        setZoom((prev) => (Math.abs(z - prev) >= ZOOM_STEP ? z : prev));
        if (s.gestures.isGestureActive && following) onUserPan();
      }}
      onMapIdle={(s) => setZoom(s.properties.zoom)}
    >
      <Camera
        ref={camera}
        defaultSettings={{ centerCoordinate: [(fix ?? center).lng, (fix ?? center).lat], zoomLevel: 16.4, pitch: 48, heading: -14 }}
        minZoomLevel={11}
        maxZoomLevel={19.5}
      />
      {fix && (
        <MarkerView coordinate={[fix.lng, fix.lat]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap allowOverlapWithPuck>
          <UserAccuracy fix={fix} metersPerPixel={mpp} />
        </MarkerView>
      )}
      {far.map((pin) => (
        <FarPin key={pin.id} pin={pin} onSelect={onSelect} />
      ))}
      {near.map((pin) => (
        <MarkerView key={pin.id} coordinate={[pin.lng, pin.lat]} anchor={{ x: 0.5, y: 1 }} allowOverlap isSelected={pin.id === selectedId}>
          <PinMarker pin={pin} selected={pin.id === selectedId} inRange={fix ? distanceMeters(fix, pin) <= AR_CAPTURE_RADIUS : false} onSelect={onSelect} />
        </MarkerView>
      ))}
      {fix && (
        // `isSelected` lifts a view annotation above the others: pins bunched
        // around the user must never cover where they are.
        <MarkerView coordinate={[fix.lng, fix.lat]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap allowOverlapWithPuck isSelected>
          <UserPuck fix={fix} heading={heading} />
        </MarkerView>
      )}
    </MapView>
  );
});

