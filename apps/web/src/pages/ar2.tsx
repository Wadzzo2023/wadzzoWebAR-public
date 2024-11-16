/* eslint-disable */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import {
  ClickHandler,
  DeviceOrientationControls,
  LocationBased,
  WebcamRenderer,
} from "lib/main";

import { useNearByPin } from "@/components/hooks/useNearbyPin";
import useWindowWidth from "@/components/hooks/useWindowWidth";
import { ConsumedLocation } from "@app/types/CollectionTypes";
import { BASE_URL } from "@app/utils/Common";
import { Coins, ShoppingBasket, Wallet } from "lucide-react";
import ArCard from "@/components/ar-card";

const ARPage = () => {
  const [selectedPin, setPin] = useState<ConsumedLocation>();
  const collectPinRes = useRef();
  const { data } = useNearByPin();
  const width = useWindowWidth();

  const [infoBoxVisible, setInfoBoxVisible] = useState(false);
  const [infoBoxPosition, setInfoBoxPosition] = useState({ left: 0, top: 0 });
  const [infoText, setInfoText] = useState<ConsumedLocation>();
  const rendererRef = useRef();
  const previousIntersectedObject = useRef();

  const [showLoading, setShowLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const simulateApiCall = async () => {
    if (!selectedPin) return;
    try {
      setShowLoading(true);
      const response = await fetch(
        new URL("api/game/locations/consume", BASE_URL).toString(),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ location_id: selectedPin.id.toString() }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to consume location");
      }
      setShowSuccess(true);
    } catch (error) {
      console.error("Error consuming location", error);
      alert("Error consuming location");
    } finally {
      setShowLoading(false);
    }
  };

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(
      80,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    document.body.appendChild(renderer.domElement);

    // @ts-ignore
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const locar = new LocationBased(scene, camera);
    const cam = new WebcamRenderer(renderer);
    const clickHandler = new ClickHandler(renderer);
    const deviceOrientationControls = new DeviceOrientationControls(camera);

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

    let coins = [];
    let firstLocation = true;

    // @ts-ignore
    locar.on("gpsupdate", (pos) => {
      if (firstLocation) {
        const { latitude, longitude } = pos.coords;

        // alert(`GPS location found! ${latitude}, ${longitude}`);

        // Generate random box positions around initial location
        // const boxPositions = generateRandomBoxPositions(latitude, longitude);
        const coinsPositions = data.nearbyPins;

        if (!coinsPositions) return;

        // Create and add boxes to the scene
        // Create coin geometry
        const radius = 5;
        const thickness = 0.2;
        const segments = 64;
        const coinGeometry = new THREE.CylinderGeometry(
          radius,
          radius,
          thickness,
          segments
        );
        coinGeometry.rotateX(Math.PI / 2);

        const color = 0xff0000;
        const icon = "./assets/images/icon.png";

        for (const coin of coinsPositions) {
          // const material = new THREE.MeshBasicMaterial({ color });
          // const mesh = new THREE.Mesh(geometry, material);
          // mesh.userData = { lat, lon, name, color };
          // locar.add(mesh, lon, lat);
          // coins.push(mesh);

          // ---------

          // Create textures for both sides
          const textureLoader = new THREE.TextureLoader();
          const headTexture = textureLoader.load(icon);
          const tailTexture = textureLoader.load(
            coin.brand_image_url ?? "https://picsum.photos/300/300"
          );

          // Create materials for the coin
          const headMaterial = new THREE.MeshStandardMaterial({
            map: headTexture,
            roughness: 0.3,
          });
          const tailMaterial = new THREE.MeshStandardMaterial({
            map: tailTexture,
            roughness: 0.3,
          });
          const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4af37, // Gold color
            roughness: 0.3,
          });

          // Create coin materials array
          const materials = [
            edgeMaterial, // Edge
            headMaterial, // Top
            tailMaterial, // Bottom
          ];

          const coinObject = new THREE.Mesh(coinGeometry, materials);
          coinObject.userData = coin;
          locar.add(coinObject, coin.lng, coin.lat);
          coins.push(coinObject);
        }
        firstLocation = false;
      }
    });

    locar.startGps();

    function collectPin() {
      console.log("claim the pin");
    }

    // @ts-ignore
    collectPinRes.current = collectPin;

    renderer.setAnimationLoop(() => {
      cam.update();
      deviceOrientationControls.update();
      renderer.render(scene, camera);

      const [intersect] = clickHandler.raycast(camera, scene);

      // Handle any clicked objects
      if (intersect) {
        // if (previousIntersectedObject.current) {
        //   previousIntersectedObject.current.material.color.set(
        //     previousIntersectedObject.current.userData.color
        //   );
        // }

        const objectData = intersect.object.userData as ConsumedLocation;
        console.log("Clicked object:", objectData);

        // Set the info box content and position
        setInfoText(objectData);
        setInfoBoxVisible(true);

        // Calculate screen position of the intersected object
        const vector = new THREE.Vector3();
        intersect.object.getWorldPosition(vector);
        vector.project(camera);

        const left = ((vector.x + 1) / 2) * window.innerWidth;
        const top = (-(vector.y - 1) / 2) * window.innerHeight;
        setInfoBoxPosition({ left, top });

        // Set color change on object
        // intersect.object.material.color.set(0xff0000);
        // @ts-ignore
        previousIntersectedObject.current = intersect.object;

        // Hide info box after 3 seconds
        setTimeout(() => setInfoBoxVisible(false), 3000);

        // Set pin to object's name
        setPin(objectData);
      }
    });

    return () => {
      // Clean up
      renderer.dispose();
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  // return <ArLoading pin={pin} />;
  return (
    <>
      {infoBoxVisible && (
        <ArCard
          brandName={infoText?.brand_name}
          description={infoText?.description}
          position={{ left: width / 2 - 208 / 2, top: infoBoxPosition.top }}
        />
      )}

      {selectedPin && (
        <div className="relative w-full h-screen bg-gray-100">
          <div
            className="absolute bottom-0 left-0 right-0 bg-gray-800 flex items-stretch shadow-lg"
            style={{ width }}
          >
            <div className="flex-1 flex items-center space-x-4 p-4">
              <div className="relative">
                <ShoppingBasket className="text-yellow-500 w-12 h-12" />
                <div className="absolute bottom-1 right-1 bg-yellow-400 rounded-full p-1">
                  <Coins className="text-yellow-800 w-4 h-4" />
                </div>
              </div>
              <div className="text-white">
                <p className="text-sm font-semibold text-yellow-400">
                  {selectedPin.title}
                </p>
                <p className="text-lg font-bold">{selectedPin.brand_name}</p>
              </div>
            </div>

            <div
              className="w-px bg-gray-700 self-stretch my-2"
              aria-hidden="true"
            ></div>

            <div className="flex-1 flex items-center p-4">
              <p className="text-white text-sm leading-snug overflow-hidden line-clamp-2">
                {selectedPin.description}
              </p>
            </div>

            <div
              className="w-px bg-gray-700 self-stretch my-2"
              aria-hidden="true"
            ></div>

            {!data.singleAR && (
              <div className="p-4 flex items-center">
                <button
                  onClick={simulateApiCall}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-colors duration-200"
                >
                  Capture
                </button>
              </div>
            )}
          </div>

          {/* Loading overlay */}
          {showLoading && (
            <div
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              style={{ width }}
            >
              <div className="bg-white p-6 rounded-lg text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
                <p className="text-xl font-bold">Capturing the coin...</p>
              </div>
            </div>
          )}

          {/* Success animation */}
          {showSuccess && (
            <div
              className="absolute inset-0 bg-green-500 bg-opacity-50 flex items-center justify-center"
              style={{ width: width }}
            >
              <div className="bg-white p-6 rounded-lg text-center">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-2xl font-bold mb-2">Coin Captured!</p>
                <p className="text-lg">{selectedPin.brand_name}</p>
              </div>
            </div>
          )}

          {/* Captured coins display */}
          {/* <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <Wallet className="text-yellow-500 w-8 h-8 mr-2" />
              <span className="text-xl font-bold">
                {selectedPin.brand_name}
              </span>
            </div>
            <p className="text-sm text-gray-600">Coins Captured</p>
          </div> */}
        </div>
      )}
    </>
  );
};

export default ARPage;

interface ProgressButtonProps {
  onComplete: () => void;
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export function ProgressButton({
  onComplete,
  children,
  className = "",
  duration = 2000,
}: ProgressButtonProps) {
  const [progress, setProgress] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPressed) {
      intervalRef.current = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(intervalRef.current!);
            return 100;
          }
          return prevProgress + 1;
        });
      }, duration / 100);

      timeoutRef.current = setTimeout(() => {
        if (isPressed) {
          onComplete();
        }
      }, duration);
    } else {
      if (progress < 100) {
        setProgress(0);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPressed, duration, onComplete, progress]);

  const handlePressStart = () => {
    setIsPressed(true);
  };

  const handlePressEnd = () => {
    setIsPressed(false);
  };

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <div className="relative z-10">{children}</div>
      <div
        className="absolute inset-0 bg-green-400 transition-all duration-100 origin-left"
        style={{
          transform: `scaleX(${progress / 100})`,
          opacity: 0.3,
        }}
      />
    </button>
  );
}

// Example usage
export function Example() {
  const handleComplete = () => {
    console.log("Button press completed!");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <ProgressButton
        onComplete={handleComplete}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg focus:outline-none"
      >
        Hold to Capture
      </ProgressButton>
    </div>
  );
}
