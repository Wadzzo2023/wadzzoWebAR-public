import { useMemo } from "react";

import { useBrandsQuery, usePinsQuery } from "~/lib/api/queries";

import { useSettings } from "./feedback";
import { distanceMeters } from "./geo";
import { pinStatus } from "./rarity";
import type { ArPin, GeoFix } from "./types";

/** Ported from wadzzoAR/src/lib/ar/usePins.ts — same filters and rules. */

export type PinFilterId = "all" | "following" | "available" | "collected";

export const PIN_FILTERS: { id: PinFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "following", label: "Following" },
  { id: "available", label: "Available" },
  { id: "collected", label: "Collected" },
];

export function filterPins(pins: ArPin[], filter: PinFilterId, followedBrandIds: Set<string>): ArPin[] {
  switch (filter) {
    case "following":
      return pins.filter((p) => followedBrandIds.has(p.brandId));
    case "available":
      return pins.filter((p) => pinStatus(p) === "collectible");
    case "collected":
      return pins.filter((p) => p.collected);
    default:
      return pins;
  }
}

export function sortByDistance(pins: ArPin[], fix: GeoFix | null) {
  if (!fix) return pins.map((pin) => ({ pin, distance: Number.POSITIVE_INFINITY }));
  return pins.map((pin) => ({ pin, distance: distanceMeters(fix, pin) })).sort((a, b) => a.distance - b.distance);
}

/** "Following only" narrows discovery (map + AR) to followed brands. */
export function useDiscoveryPins() {
  const { pins, isLoading, isError, refetch } = usePinsQuery();
  const followingOnly = useSettings((s) => s.followingOnly);
  const { brands, isLoading: brandsLoading } = useBrandsQuery();
  const discovered = useMemo(() => {
    if (!followingOnly || brandsLoading) return pins;
    const followed = new Set(brands.filter((b) => b.followed).map((b) => b.id));
    return pins.filter((p) => followed.has(p.brandId));
  }, [pins, followingOnly, brands, brandsLoading]);
  return { pins: discovered, isLoading, isError, refetch };
}
