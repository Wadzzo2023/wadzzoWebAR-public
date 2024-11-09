// pages/ar.js
import { useEffect, useState } from "react";

import Head from "next/head";

const LOCATION_PINS = [
  {
    id: 1,
    name: "Eiffel Tower",
    lat: 48.8584,
    lon: 2.2945,
    description: "Iron tower",
    color: "#ff0000",
  },
  {
    id: 2,
    name: "Cafe",
    lat: 48.8599,
    lon: 2.2964,
    description: "Coffee shop",
    color: "#00ff00",
  },
  {
    id: 3,
    name: "Museum",
    lat: 48.8606,
    lon: 2.2932,
    description: "Art gallery",
    color: "#0000ff",
  },
  {
    id: 4,
    name: "Park",
    lat: 48.8563,
    lon: 2.2976,
    description: "Green space",
    color: "#ffff00",
  },
  {
    id: 5,
    name: "Shop",
    lat: 48.8577,
    lon: 2.2916,
    description: "Shopping mall",
    color: "#ff00ff",
  },
];

export default function ARPage() {
  const [userLocation, setUserLocation] = useState({
    lat: 48.8584,
    lon: 2.2945,
  });
  const [pins, setPins] = useState([]);

  useEffect(() => {
    const onAframeLoaded = () => {
      AFRAME.registerComponent("pin-click2", {
        init: function () {
          this.el.addEventListener("click", () => {
            console.log(this.el);
          });
        },
      });
    };
    // Dynamically load the scripts
    const aframeScript = document.createElement("script");
    aframeScript.src = "https://aframe.io/releases/0.8.0/aframe.min.js";
    aframeScript.async = true;
    document.head.appendChild(aframeScript);

    const arjsScript = document.createElement("script");
    arjsScript.src =
      "https://cdn.rawgit.com/jeromeetienne/AR.js/1.6.0/aframe/build/aframe-ar.js";

    aframeScript.onload = onAframeLoaded;

    document.head.appendChild(arjsScript);
  }, []);

  useEffect(() => {
    // Find center point (user location)
    const centerLat = userLocation.lat;
    const centerLon = userLocation.lon;

    // Calculate relative distances
    const calculatedPins = LOCATION_PINS.map((pin) => {
      const x = Math.sin(pin.lon - userLocation.lon) * 20;
      const z = -Math.cos(pin.lat - userLocation.lat) * 20;
      return {
        ...pin,
        position: {
          x: Math.max(Math.min(x, 20), -20), // Clamp between -20,20
          y: 0,
          z: Math.max(Math.min(z, 20), -20),
        },
      };
    });

    for (let i = 0; i < calculatedPins.length; i++) {
      for (let j = i + 1; j < calculatedPins.length; j++) {
        const dx = calculatedPins[j].position.x - calculatedPins[i].position.x;
        const dz = calculatedPins[j].position.z - calculatedPins[i].position.z;

        if (Math.abs(dx) < 1) {
          calculatedPins[j].position.x =
            calculatedPins[i].position.x + (dx > 0 ? 1 : -1);
        }
        if (Math.abs(dz) < 1) {
          calculatedPins[j].position.z =
            calculatedPins[i].position.z + (dz > 0 ? 1 : -1);
        }
      }
    }

    console.log("calculatedPins", calculatedPins);
    setPins(calculatedPins);
  }, [userLocation]);

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  return (
    <>
      <Head>
        <title>AR.js with Next.js</title>
      </Head>
      <div style={{ margin: 0, overflow: "hidden", height: "100vh" }}>
        <a-scene embedded arjs="sourceType: webcam;">
          <a-box position="0 0.5 0" material="opacity: 0.5;"></a-box>
          {/* <a-marker-camera preset="hiro"></a-marker-camera> */}
          <a-entity camera look-controls pointerLockEnabled>
            <a-cursor></a-cursor>

            <a-sphere
              clickhandler="txt:box1"
              id="apiSphere"
              position="4 2 -10"
              radius="1.25"
              color="#EF2D5E"
              pin-click
              animation="property: position; to: 0 3 -5; dur: 2000; easing: easeInOutQuad; loop: true"
            ></a-sphere>
            <a-text
              value="Hello AR.js!"
              position="0 0 -5"
              scale="2 2 2"
              color="#FFFFFF"
              pin-click
            ></a-text>

            <a-box
              clickhandler="txt:box1"
              position="0 2 -5"
              scale="2 2 2"
            ></a-box>

            {pins.map((pin) => (
              <a-sphere
                key={pin.id}
                position={`${pin.position.x} ${pin.position.y} -10`}
                radius="0.5"
                color="#EF2D5E"
                opacity="0.8"
              ></a-sphere>
            ))}

            {pins.map((pin) => (
              <a-entity key={pin.id}>
                <a-sphere
                  position={`${pin.position.x} ${-4} ${-10}`}
                  radius="1"
                  color={pin.color}
                  pin-click
                  data-id={pin.id}
                  animation="property: scale; from: 1 1 1; to: 1.2 1.2 1.2; dur: 1000; loop: true; dir: alternate"
                ></a-sphere>
                <a-text
                  value={pin.name}
                  position={`${pin.position.x} ${pin.position.y + 1} ${
                    pin.position.z
                  }`}
                  align="center"
                  color="white"
                  scale="0.5 0.5 0.5"
                ></a-text>
              </a-entity>
            ))}

            <a-entity>
              <a-sphere
                position={`${0} ${-5} ${-10}`}
                radius="1"
                pin-click
                data-id={"100"}
                pin-click2
                animation="property: scale; from: 1 1 1; to: 1.2 1.2 1.2; dur: 1000; loop: true; dir: alternate"
              ></a-sphere>
            </a-entity>
          </a-entity>
        </a-scene>
        <h1 className="absolute top-0 right-0">vong cong</h1>
      </div>
    </>
  );
}
