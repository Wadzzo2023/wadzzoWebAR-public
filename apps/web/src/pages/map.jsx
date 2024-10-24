import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

export default function Home() {
  const mapContainer = useRef();
  const map = useRef();

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // style: "mapbox://styles/mapbox/streets-v12",
      center: [-1.46389, 53.296543],
      // zoom: 13,
    });

  }, []);

  return (
    <div id="map">
      <div ref={mapContainer} />
    </div>
  );
}
