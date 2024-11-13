// pages/ar.js
import { useEffect } from "react";

import Head from "next/head";

export default function ARPage() {
  useEffect(() => {
    // Dynamically load the scripts
    const aframeScript = document.createElement("script");
    aframeScript.src = "https://aframe.io/releases/1.6.0/aframe.min.js";

    aframeScript.onload = () => {
      AFRAME.registerComponent("fill-circle", {
        init: function () {
          let fillProgress = 0;
          let isPressed = false;
          let pressInterval;
          const fillDuration = 2000; // 2 seconds to fill
          const intervalTime = 50; // Update every 50ms

          // Get references to elements
          const fillCircle = document.querySelector("#fillCircle");
          const borderRing = document.querySelector("#borderRing");
          const coin = document.querySelector("#coin");

          this.el.addEventListener("mousedown", () => {
            isPressed = true;
            pressInterval = setInterval(() => {
              if (isPressed) {
                fillProgress += intervalTime / fillDuration;

                // Update fill circle opacity
                fillCircle.setAttribute("opacity", Math.min(fillProgress, 1));

                // When circle is fully filled
                if (fillProgress >= 1) {
                  clearInterval(pressInterval);
                  // Animate border
                  borderRing.setAttribute("color", "#4CAF50");

                  // Animate coin collection
                  coin.setAttribute("animation__collect", {
                    property: "position",
                    to: "0 0 -5",
                    dur: 1000,
                    easing: "easeInQuad",
                  });
                  coin.setAttribute("animation__scale", {
                    property: "scale",
                    to: "0 0 0",
                    dur: 1000,
                    easing: "easeInQuad",
                  });
                }
              }
            }, intervalTime);
          });

          const resetCircle = () => {
            if (fillProgress < 1) {
              isPressed = false;
              fillProgress = 0;
              fillCircle.setAttribute("opacity", 0.2);
              clearInterval(pressInterval);
            }
          };

          this.el.addEventListener("mouseup", resetCircle);
          this.el.addEventListener("mouseleave", resetCircle);
        },
      });
    };
    document.head.appendChild(aframeScript);

    const arjsScript = document.createElement("script");
    arjsScript.src =
      "https://cdn.rawgit.com/jeromeetienne/AR.js/1.6.0/aframe/build/aframe-ar.js";

    document.head.appendChild(arjsScript);
  }, []);

  useEffect(() => {
    function showCoinInfo() {
      const card = document.getElementById("coinCard");
      card.style.display = "block";
      setTimeout(() => (card.style.display = "none"), 3000);
    }

    // Attach the function to the window object so it can be called from the JSX
    window.showCoinInfo = showCoinInfo;
  }, []);

  return (
    <>
      <Head>
        <title>AR.js with Next.js</title>
      </Head>
      <div>
        <a-scene cursor="rayOrigin: mouse">
          <a-circle
            id="coin"
            position="0 3 -5"
            radius="0.5"
            src="assets/images/adaptive-icon.png"
            onclick={"showCoinInfo()"}
            side="double"
            animation="property: rotation; to: 0 360 0; dur: 5000; easing: linear; loop: true"
          ></a-circle>

          <a-entity position="0 0 -5" fill-circle>
            <a-ring
              id="borderRing"
              radius-inner="0.95"
              radius-outer="1"
              color="#FF4081"
              position="0 0 0"
            ></a-ring>

            <a-circle
              id="fillCircle"
              radius="0.95"
              color="#4CAF50"
              opacity="0.2"
              position="0 0 -0.01"
            ></a-circle>
          </a-entity>
        </a-scene>
        <div id="coinCard" class="coin-card">
          <h3>Gold Coin 1945</h3>
          <p>Issue: Royal Mint</p>
          <p>Description: Rare collector&apos;s edition</p>
        </div>
      </div>
    </>
  );
}
