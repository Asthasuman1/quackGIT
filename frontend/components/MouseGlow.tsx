"use client";

import { motion, useMotionValue } from "framer-motion";
import { useEffect } from "react";

export default function MouseGlow() {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      x.set(e.clientX - 220);
      y.set(e.clientY - 220);
    };

    window.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden="true"
      className="
        pointer-events-none
        fixed
        left-0
        top-0
        z-0
        h-[440px]
        w-[440px]
        rounded-full
        blur-[140px]
        will-change-transform
      "
      style={{
        x,
        y,
        background:
          "radial-gradient(circle, rgba(251,146,60,0.28) 0%, rgba(249,115,22,0.22) 35%, rgba(234,88,12,0.16) 60%, transparent 85%)",
      }}
    />
  );
}