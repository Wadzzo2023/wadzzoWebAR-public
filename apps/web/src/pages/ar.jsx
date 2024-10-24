// pages/ar.js
import { useEffect } from "react";


import Head from "next/head";

export default function ARPage() {
  useEffect(() => {
    // Dynamically load the scripts
    const aframeScript = document.createElement("script");
    aframeScript.src = "https://aframe.io/releases/0.8.0/aframe.min.js";
    aframeScript.async = true;
    document.head.appendChild(aframeScript);

    const arjsScript = document.createElement("script");
    arjsScript.src =
      "https://cdn.rawgit.com/jeromeetienne/AR.js/1.6.0/aframe/build/aframe-ar.js";
    arjsScript.async = true;
    document.head.appendChild(arjsScript);
  }, []);

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
              position="0 0 -10"
              radius="1.25"
              color="#EF2D5E"
              animation="property: position; to: 0 3 -5; dur: 2000; easing: easeInOutQuad; loop: true"
            ></a-sphere>
            <a-text
              value="Hello AR.js!"
              position="0 0 -5"
              scale="2 2 2"
              color="#FFFFFF"
            ></a-text>

            <a-box
              clickhandler="txt:box1"
              position="0 2 -5"
              scale="2 2 2"
            ></a-box>
          </a-entity>
        </a-scene>
        <h1 className="absolute top-0 right-0">vong cong</h1>
      </div>
    </>
  );
}
