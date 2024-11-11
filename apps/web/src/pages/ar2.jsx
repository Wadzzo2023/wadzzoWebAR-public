import { useEffect, useState } from "react";
import * as THREE from "three";
import * as LocAR from "locar";
import { ArLoading } from "../components/ArLoading";

const ARPage = () => {
  const [pin, setPin] = useState();

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
    const scene = new THREE.Scene();

    const locar = new LocAR.LocationBased(scene, camera);
    const cam = new LocAR.WebcamRenderer(renderer);
    const clickHandler = new LocAR.ClickHandler(renderer);
    const deviceOrientationControls = new LocAR.DeviceOrientationControls(
      camera
    );

    let boxes = [];
    let firstLocation = true;

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

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
        const geometry = new THREE.BoxGeometry(20, 20, 20);
        for (const { lat, lon, color, name } of boxPositions) {
          const material = new THREE.MeshBasicMaterial({ color });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.userData = { lat, lon, name };
          locar.add(mesh, lon, lat);
          boxes.push(mesh);
        }
        firstLocation = false;
      }
    });

    locar.startGps();

    renderer.setAnimationLoop(() => {
      cam.update();
      deviceOrientationControls.update();
      renderer.render(scene, camera);

      const clickedObjects = clickHandler.raycast(camera, scene);

      // Handle any clicked objects
      if (clickedObjects.length > 0) {
        clickedObjects.forEach((intersect) => {
          console.log("Clicked object:", intersect.object);
          // You could change color, position, or add any interaction here
          intersect.object.material.color.set(0xff0000); // Example: Change color on click
          setPin(intersect.object.userData.name);
        });
      }
    });

    return () => {
      // Clean up
      renderer.dispose();
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  return <ArLoading pin={pin} />;
  return (
    <button
      onClick={() => {
        console.log("claim the pin");
      }}
      style={{ position: "absolute", bottom: "10px", left: "100px" }}
    ></button>
  );
};

export default ARPage;
