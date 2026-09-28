import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import type { GeoFix } from "./types";

/**
 * ── Location ───────────────────────────────────────────────────────────────
 *
 * Native counterpart of the web's `useGeolocation`: the same status/reason
 * model and wording, on `expo-location`. Foreground only (decided) — the
 * watch stops when the app backgrounds and restarts when it returns.
 */

export type GeoStatus = "idle" | "prompting" | "tracking" | "denied" | "unavailable";
export type GeoReason = "denied" | "unavailable" | "timeout";

export const GEO_REASON_TEXT: Record<GeoReason, string> = {
  denied: "Location is turned off for Wadzzo. Allow it in Settings and Wadzzo can show the drops around you.",
  unavailable: "Your phone couldn't get a location fix. Check that Location Services are on.",
  timeout: "Location is taking a long time to arrive. Move somewhere with a clearer view of the sky and try again.",
};

/** Same fallback centre as the web, used only to frame the map pre-fix. */
export const FALLBACK_CENTER = { lat: 23.94026782931064, lng: 90.29786059328437 };

let lastFix: GeoFix | null = null;

export function useGeolocation({ enabled = true }: { enabled?: boolean } = {}) {
  const [fix, setFix] = useState<GeoFix | null>(lastFix);
  const [status, setStatus] = useState<GeoStatus>(lastFix ? "tracking" : "idle");
  const [reason, setReason] = useState<GeoReason | null>(null);
  const sub = useRef<Location.LocationSubscription | null>(null);

  const start = useCallback(async () => {
    sub.current?.remove();
    sub.current = null;
    setStatus((s) => (s === "tracking" ? s : "prompting"));

    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") {
      setStatus("denied");
      setReason("denied");
      return;
    }
    if (!(await Location.hasServicesEnabledAsync())) {
      setStatus("unavailable");
      setReason("unavailable");
      return;
    }

    const timeout = setTimeout(() => {
      if (!lastFix) setReason("timeout");
    }, 15_000);

    try {
      sub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 2, timeInterval: 1000 },
        (p) => {
          clearTimeout(timeout);
          const next: GeoFix = {
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            accuracy: p.coords.accuracy ?? 50,
            heading: p.coords.heading != null && p.coords.heading >= 0 ? p.coords.heading : null,
            speed: p.coords.speed,
            timestamp: p.timestamp,
          };
          lastFix = next;
          setFix(next);
          setStatus("tracking");
          setReason(null);
        },
      );
    } catch {
      clearTimeout(timeout);
      setStatus("unavailable");
      setReason("unavailable");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void start();
    const appSub = AppState.addEventListener("change", (s) => {
      if (s === "active") void start();
      else {
        sub.current?.remove();
        sub.current = null;
      }
    });
    return () => {
      appSub.remove();
      sub.current?.remove();
      sub.current = null;
    };
  }, [enabled, start]);

  return { fix, status, reason, retry: start };
}

/**
 * Compass heading in degrees (true north when available). iOS refuses the
 * heading watch until location is allowed, so callers pass `enabled` only
 * once permission is granted; any other failure just means no compass.
 */
export function useHeading(enabled: boolean) {
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let s: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchHeadingAsync((h) => {
      const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      setHeading(deg);
      setAccuracy(h.accuracy);
    })
      .then((sub) => {
        if (cancelled) sub.remove();
        else s = sub;
      })
      .catch(() => {
        // No permission or no magnetometer (simulator): the map stays north-up.
      });
    return () => {
      cancelled = true;
      s?.remove();
    };
  }, [enabled]);
  return { heading, accuracy };
}
