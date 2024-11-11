import { useEffect } from "react";
import * as THREE from "three";
import * as LocAR from "locar";

const ARPage = () => {
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
      { lat: lat + randomOffset(), lon: lon + randomOffset(), color: 0xff0000 },
      { lat: lat + randomOffset(), lon: lon + randomOffset(), color: 0xffff00 },
      { lat: lat + randomOffset(), lon: lon + randomOffset(), color: 0x00ff00 },
      { lat: lat + randomOffset(), lon: lon + randomOffset(), color: 0x0000ff },
    ];

    locar.on("gpsupdate", (pos) => {
      if (firstLocation) {
        const { latitude, longitude } = pos.coords;

        // Generate random box positions around initial location
        const boxPositions = generateRandomBoxPositions(latitude, longitude);

        // Create and add boxes to the scene
        const geometry = new THREE.BoxGeometry(20, 20, 20);
        for (const { lat, lon, color } of boxPositions) {
          const material = new THREE.MeshBasicMaterial({ color });
          const mesh = new THREE.Mesh(geometry, material);
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
    });

    return () => {
      // Clean up
      renderer.dispose();
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  return <div></div>;
};

export default ARPage;
