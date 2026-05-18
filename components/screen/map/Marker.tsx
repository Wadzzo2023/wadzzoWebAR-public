"use client";

import { MarkerView } from "@rnmapbox/maps";
import { Image, TouchableOpacity } from "react-native";

import { useModal } from "@/components/hooks/useModal";
import type { ConsumedLocation } from "@/components/types/CollectionTypes";

import { Color } from "@/components/utils/all-colors";

export const Marker = ({ locations }: { locations: ConsumedLocation[] }) => {
  const { onOpen } = useModal();
  //   const pins = locations.map((location) => point([location.lng, location.lat]));
  return (
    <>
      {locations.map((location: ConsumedLocation, index: number) => (
        <MarkerView
          allowOverlap={true}
          allowOverlapWithPuck={true}
          key={`${index}-${location.id}`}
          coordinate={[location.lng, location.lat]}
        >
          <TouchableOpacity
            onPress={() =>
              onOpen("LocationInformation", {
                Collection: location,
              })
            }
          >
            <Image
              source={{ uri: location.image_url ?? location.brand_image_url }}
              height={30}
              width={30}
              style={[
                {
                  height: 30,
                  width: 30,
                  borderWidth: 2,

                  borderColor: Color.wadzzo,
                },
                !location.auto_collect && {
                  borderRadius: 20, // Add borderRadius only when auto_collect is false
                },
                location.collected && { opacity: 0.4 },
              ]}
            />
          </TouchableOpacity>
        </MarkerView>
      ))}
    </>
  );
};
