"use client";

import { motion, useAnimation, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function Capture({ onComplete }: { onComplete: () => void }) {
  const [isPressed, setIsPressed] = useState(false);
  const progress = useMotionValue(0);
  const buttonControls = useAnimation();
  const progressControls = useAnimation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleMouseDown = () => {
    setIsPressed(true);
    buttonControls.start({ scale: 0.95 });
    progressControls.start({ width: "100%", transition: { duration: 2 } });

    intervalRef.current = setInterval(() => {
      const currentProgress = progress.get();
      if (currentProgress >= 100) {
        clearInterval(intervalRef.current!);
        handleComplete();
      } else {
        progress.set(currentProgress + 2);
      }
    }, 40);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    onComplete();
    buttonControls.start({ scale: 1 });
    progressControls.stop();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (progress.get() < 100) {
      progressControls.start({ width: "0%", transition: { duration: 0.3 } });
      progress.set(0);
    }
  };

  const handleComplete = () => {
    // alert("Capture complete!");
    handleComplete();
    progress.set(0);
    progressControls.start({ width: "0%", transition: { duration: 0.3 } });
  };

  return (
    <motion.div animate={buttonControls} className="relative">
      <button
        className="relative overflow-hidden px-6 py-3 bg-blue-500 text-white rounded-lg focus:outline-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        <motion.div
          className="absolute left-0 top-0 bottom-0 bg-white bg-opacity-30"
          initial={{ width: "0%" }}
          animate={progressControls}
        />
        <motion.span
          className="relative z-10"
          animate={{ scale: isPressed ? 0.95 : 1 }}
        >
          Capture
        </motion.span>
      </button>
    </motion.div>
  );
}
