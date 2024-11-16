/* eslint-disable  */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useNearByPin } from "@/components/hooks/useNearbyPin";
import useWindowWidth from "@/components/hooks/useWindowWidth";
import { ConsumedLocation } from "@app/types/CollectionTypes";
import { BASE_URL } from "@app/utils/Common";
import { Coins, ShoppingBasket, Wallet } from "lucide-react";
import ArCard from "@/components/ar-card";
import { set } from "zod";

const ThreeJSPage = () => {
  const [selectedPin, setPin] = useState<ConsumedLocation>();
  const { data } = useNearByPin();
  const width = useWindowWidth();

  const [infoBoxVisible, setInfoBoxVisible] = useState(false);
  const [infoBoxPosition, setInfoBoxPosition] = useState({ left: 0, top: 0 });
  const [infoText, setInfoText] = useState<ConsumedLocation>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const previousIntersectedObject = useRef();
  const [selectedCoinMesh, setSelectedCoinMesh] = useState<THREE.Mesh>();

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
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    document.body.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Create coins
    const coins: THREE.Mesh[] = [];
    const radius = 5;
    const thickness = 0.4;
    const segments = 64;
    const coinGeometry = new THREE.CylinderGeometry(
      radius,
      radius,
      thickness,
      segments
    );
    coinGeometry.rotateX(Math.PI / 2);
    // coinGeometry.rotateX(Math.PI / 2);

    const textureLoader = new THREE.TextureLoader();

    const icon = "./assets/images/icon.png";

    if (data?.nearbyPins) {
      data.nearbyPins.forEach((pin, index) => {
        const headTexture = textureLoader.load(icon);
        const tailTexture = textureLoader.load(
          pin.brand_image_url ?? "https://picsum.photos/300/300"
        );
        const headMaterial = new THREE.MeshStandardMaterial({
          map: headTexture,
          //   color: 0xff0000,
          roughness: 0.3,
        });
        const tailMaterial = new THREE.MeshStandardMaterial({
          map: tailTexture,
          //   color: 0xff0000,
          //   roughness: 0.3,
        });
        const edgeMaterial = new THREE.MeshStandardMaterial({
          color: 0xd4af37,
          roughness: 0.3,
        });

        const outlineMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0,
        });

        const outlineGeometry = coinGeometry.clone();
        outlineGeometry.scale(1.05, 1.05, 1.05);
        const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);

        const materials = [edgeMaterial, headMaterial, tailMaterial];
        const coin = new THREE.Mesh(coinGeometry, materials);
        coin.add(outlineMesh);

        // Position coins in a circle

        // @ts-ignore
        const angle = (index / data.nearbyPins.length) * Math.PI * 2;
        const radius = 20;
        coin.position.x = Math.cos(angle) * radius;
        coin.position.y = Math.sin(angle) * radius;

        coin.userData = pin;
        scene.add(coin);
        coins.push(coin);
      });
    }

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Handle mouse click
    const handleClick = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(coins);

      if (selectedCoinMesh) {
        const outline = selectedCoinMesh.children[0] as THREE.Mesh;
        (outline.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      if (intersects.length > 0) {
        const object = intersects[0]?.object as THREE.Mesh;
        if (!object) return;
        setSelectedCoinMesh(object);

        const objectData = object.userData as ConsumedLocation;

        setInfoText(objectData);
        setInfoBoxVisible(true);

        const vector = new THREE.Vector3();
        object.getWorldPosition(vector);
        vector.project(camera);

        const left = ((vector.x + 1) / 2) * window.innerWidth;
        const top = (-(vector.y - 1) / 2) * window.innerHeight;
        setInfoBoxPosition({ left, top });

        setPin(objectData);

        setTimeout(() => setInfoBoxVisible(false), 3000);
      }
    };
    renderer.domElement.addEventListener("click", handleClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      coins.forEach((coin) => {
        coin.rotation.y += 0.01;
      });

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.dispose();
      document.body.removeChild(renderer.domElement);
    };
  }, [data?.nearbyPins]);

  return (
    <>
      {infoBoxVisible && (
        <>
          {/* <div
            style={{
              position: "absolute",
              left: `${infoBoxPosition.left}px`,
              top: `${infoBoxPosition.top}px`,
              padding: "10px",
              backgroundColor: "rgba(255, 0, 0, 0.8)",
              color: "white",
              borderRadius: "5px",
            }}
          >
            {infoText?.brand_name}
          </div> */}
          <ArCard
            brandName={infoText?.brand_name}
            description={infoText?.description}
            position={{ left: infoBoxPosition.left, top: infoBoxPosition.top }}
          />
        </>
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

export default ThreeJSPage;
