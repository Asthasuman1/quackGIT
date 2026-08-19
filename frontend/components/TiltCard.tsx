"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export default function TiltCard({
  children,
  className = "",
}: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, {
    stiffness: 180,
    damping: 20,
    mass: 0.5,
  });

  const mouseY = useSpring(y, {
    stiffness: 180,
    damping: 20,
    mass: 0.5,
  });

  const rotateX = useTransform(mouseY, [-150, 150], [8, -8]);
  const rotateY = useTransform(mouseX, [-150, 150], [-8, 8]);

  function handleMove(
    e: React.MouseEvent<HTMLDivElement>
  ) {
    const rect = e.currentTarget.getBoundingClientRect();

    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1200,
      }}
      whileHover={{
        y: -10,
        scale: 1.02,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 22,
      }}
      className={`relative transform-gpu ${className}`}
    >
      {children}
    </motion.div>
  );
}