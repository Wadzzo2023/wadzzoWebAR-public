import { PointAnnotation } from "@rnmapbox/maps";
import { Image } from "expo-image";
import { memo, useRef, useState } from "react";
import { View } from "react-native";

import { Text } from "~/components/ui/Text";
import { pinStatus } from "~/lib/ar/rarity";
import type { ArPin } from "~/lib/ar/types";
import { useColors } from "~/theme/theme";

/**
 * A pin beyond the nearest MAX_MARKERS: the brand image in a rarity-coloured
 * frame, drawn by Mapbox itself. PointAnnotation snapshots this view into a
 * bitmap once, so it costs nothing per frame no matter how many there are —
 * unlike the live PinMarker medallions. The snapshot is taken before the
 * remote image arrives, so it's refreshed when the image loads.
 */
export const FarPin = memo(function FarPin({ pin, onSelect }: { pin: ArPin; onSelect: (id: string) => void }) {
  const { c, rarity: rc } = useColors();
  const ref = useRef<PointAnnotation>(null);
  const [failed, setFailed] = useState(false);
  const status = pinStatus(pin);
  const dead = status === "expired" || status === "depleted";
  const ring = dead ? c("ar-locked", 0.6) : rc(pin.rarity, status === "collectible" ? 1 : 0.7);

  return (
    <PointAnnotation ref={ref} id={`far-${pin.id}`} coordinate={[pin.lng, pin.lat]} anchor={{ x: 0.5, y: 0.5 }} onSelected={() => onSelect(pin.id)}>
      <View style={{ width: 30, height: 30, borderRadius: 10, borderWidth: 2, borderColor: ring, backgroundColor: c("ar-void"), alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {failed ? (
          <Text className="font-hud text-[12px] font-bold" style={{ color: ring }}>
            {pin.brandName.charAt(0)}
          </Text>
        ) : (
          <Image
            source={{ uri: pin.brandImageUrl }}
            style={{ width: 22, height: 22, borderRadius: 6, opacity: dead || status === "collected" ? 0.5 : 1 }}
            contentFit="cover"
            onLoad={() => ref.current?.refresh()}
            onError={() => {
              setFailed(true);
              ref.current?.refresh();
            }}
          />
        )}
      </View>
    </PointAnnotation>
  );
});
