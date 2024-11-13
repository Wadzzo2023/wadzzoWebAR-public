"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

export function ArLoading({ pin }) {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const animationRef = useRef(null);

  const startFilling = () => {
    if (isLoading || isSuccess) return;

    const startTime = Date.now();
    const duration = 2000; // 2 seconds to fill the circle

    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = Math.min((elapsedTime / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const stopFilling = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (progress === 100) {
      setIsLoading(true);
      // Start the second loading animation
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
      }, 2000); // 2 seconds for the second loading animation
    } else {
      setProgress(0);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      className="absolute bottom-0 left-20 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-blue-500 cursor-pointer"
      onMouseDown={startFilling}
      onMouseUp={stopFilling}
      onMouseLeave={stopFilling}
      onTouchStart={startFilling}
      onTouchEnd={stopFilling}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <circle
          className="stroke-white stroke-2 fill-none"
          cx="50"
          cy="50"
          r="45"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * progress) / 100}
        />
      </svg>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-blue-500 rounded-full"
        >
          <Loader2 className="w-16 h-16 text-white animate-spin" />
        </motion.div>
      )}
      {isSuccess && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-full"
        >
          <Check className="text-white w-16 h-16" />
        </motion.div>
      )}
      {pin}
    </div>
  );
}
