import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as LocAR from "locar";
import { ArLoading } from "../components/ArLoading";

const ARPage = () => {
  const [pin, setPin] = useState();
  const collectPinRes = useRef();

  const [infoBoxVisible, setInfoBoxVisible] = useState(false);
  const [infoBoxPosition, setInfoBoxPosition] = useState({ left: 0, top: 0 });
  const [infoText, setInfoText] = useState("");
  const rendererRef = useRef(null);
  const previousIntersectedObject = useRef(null);

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

    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const locar = new LocAR.LocationBased(scene, camera);
    const cam = new LocAR.WebcamRenderer(renderer);
    const clickHandler = new LocAR.ClickHandler(renderer);
    const deviceOrientationControls = new LocAR.DeviceOrientationControls(
      camera
    );

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

    let coins = [];
    let firstLocation = true;

    // Generate random latitude and longitude within 100 meters
    const randomOffset = () => (Math.random() - 0.5) * 0.0009; // ~100 meters
    const generateRandomBoxPositions = (lat, lon) => [
      {
        lat: lat + randomOffset(),
        lon: lon + randomOffset(),
        color: 0xff0000,
        name: "item 1",
      },
      {
        lat: lat + randomOffset(),
        lon: lon + randomOffset(),
        color: 0xffff00,
        name: "item 2",
      },
      {
        lat: lat + randomOffset(),
        lon: lon + randomOffset(),
        color: 0x00ff00,
        name: "item 3",
      },
      {
        lat: lat + randomOffset(),
        lon: lon + randomOffset(),
        color: 0x0000ff,
        name: "item 4",
      },
    ];

    locar.on("gpsupdate", (pos) => {
      if (firstLocation) {
        const { latitude, longitude } = pos.coords;

        // Generate random box positions around initial location
        const boxPositions = generateRandomBoxPositions(latitude, longitude);

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

        for (const { lat, lon, color, name } of boxPositions) {
          // const material = new THREE.MeshBasicMaterial({ color });
          // const mesh = new THREE.Mesh(geometry, material);
          // mesh.userData = { lat, lon, name, color };
          // locar.add(mesh, lon, lat);
          // coins.push(mesh);

          // ---------

          // Create textures for both sides
          const textureLoader = new THREE.TextureLoader();
          const headTexture = textureLoader.load(
            "https://picsum.photos/300/300"
          ); // Replace with your head image
          const tailTexture = textureLoader.load(
            "https://picsum.photos/300/300"
          ); // Replace with your tail image

          // Create materials for the coin
          const headMaterial = new THREE.MeshStandardMaterial({
            map: headTexture,
            color: color,
            roughness: 0.3,
          });
          const tailMaterial = new THREE.MeshStandardMaterial({
            map: tailTexture,
            color: color,
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

          const coin = new THREE.Mesh(coinGeometry, materials);
          coin.userData = { lat, lon, name, color };
          locar.add(coin, lon, lat);
          coins.push(coin);
        }
        firstLocation = false;
      }
    });

    locar.startGps();

    function collectPin() {
      console.log("claim the pin");
    }

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

        const objectName = intersect.object.userData.name;
        console.log("Clicked object:", objectName);

        // Set the info box content and position
        setInfoText(objectName);
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
        previousIntersectedObject.current = intersect.object;

        // Hide info box after 3 seconds
        setTimeout(() => setInfoBoxVisible(false), 3000);

        // Set pin to object's name
        setPin(objectName);
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
        <>
          <div
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
            {infoText}
          </div>
          <button
            onClick={() => collectPinRes.current()}
            style={{
              position: "absolute",
              left: `$100px`,
              bottom: `10px`,
              padding: "10px",
              backgroundColor: "rgba(255, 0, 0, 0.8)",
              color: "white",
              borderRadius: "5px",
            }}
          >
            Collect
          </button>
        </>
      )}
    </>
  );
};

export default ARPage;
