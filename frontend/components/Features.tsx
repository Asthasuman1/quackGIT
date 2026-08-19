"use client";

import { motion } from "framer-motion";
import {
  GitBranch,
  ShieldCheck,
  BrainCircuit,
  TrendingUp,
  Clock3,
  SearchCheck,
  ArrowUpRight,
} from "lucide-react";
import Reveal from "./animations/Reveal";
import TiltCard from "./TiltCard";

const features = [
  {
    icon: GitBranch,
    title: "Git Repository Analysis",
    description:
      "Connect any Git repository and let AI inspect commits, pull requests, repository health, and development patterns in real time.",
  },
  {
    icon: BrainCircuit,
    title: "Future Failure Prediction",
    description:
      "Predict bugs, crashes, regressions, and production failures before they are introduced into your codebase.",
  },
  {
    icon: ShieldCheck,
    title: "Security Detection",
    description:
      "Automatically identify vulnerable code, insecure dependencies, exposed secrets, and risky implementation patterns.",
  },
  {
    icon: TrendingUp,
    title: "Performance Insights",
    description:
      "Detect performance bottlenecks and receive AI-generated optimization suggestions with measurable impact.",
  },
  {
    icon: SearchCheck,
    title: "AI Code Reviews",
    description:
      "Receive intelligent review comments that improve readability, maintainability, and engineering quality.",
  },
  {
    icon: Clock3,
    title: "Continuous Monitoring",
    description:
      "Every commit is analyzed automatically so issues are detected before they reach production.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative mx-auto max-w-[1650px] px-10 py-40 lg:px-12"
    >
      <Reveal>
        <div className="mx-auto max-w-[980px] text-center">
          <span className="inline-flex items-center border-orange-500/30 bg-orange-500/10 px-7 py-3 text-lg font-semibold tracking-wide text-orange-300">
            Features
          </span>

          <h2 className="mt-10 text-5xl font-black leading-[1.05] tracking-[-0.05em] lg:text-7xl">
            Everything You Need to Ship
            <br />
            <span className="text-orange-400"> Better Code</span>
          </h2>

          <p className="mx-auto mt-10 max-w-[760px] text-xl leading-9 text-zinc-400">
            quackGIT continuously analyzes repositories, predicts future
            failures, reviews code quality, and helps engineering teams deploy
            confidently with AI-powered insights.
          </p>
        </div>
      </Reveal>

      <div className="mt-20 mx-auto max-w-[1700px] grid gap-8 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
        {features.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.08}>
            <TiltCard>
              <motion.div
                whileHover={{
                  y: -14,
                  scale: 1.02,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 18,
                }}
                className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[#111111]/75 px-12 py-10 backdrop-blur-xl"
              >
                {/* Hover Glow */}
                <motion.div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(249,115,22,.18), transparent 70%)",
                  }}
                />

                {/* Border Glow */}
                <div className="pointer-events-none absolute inset-0 rounded-[34px] border border-transparent transition-all duration-500 group-hover:border-orange-500/40" />

                {/* Icon */}
                <motion.div
                  whileHover={{
                    rotate: -12,
                    scale: 1.15,
                    y: -6,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 12,
                  }}
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_35px_rgba(249,115,22,.45)]"
                >
                  <feature.icon size={30} />
                </motion.div>

                {/* Title */}
                <motion.div
                  whileHover={{ x: 6 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                  className="mt-7 flex items-start justify-between gap-4"
                >
                  <h3 className="min-h-[60px] text-[2rem] font-bold leading-tight tracking-tight text-white">
                    {feature.title}
                  </h3>

                  <motion.div
                    initial={{
                      opacity: 0,
                      x: -10,
                    }}
                    whileHover={{
                      opacity: 1,
                      x: 0,
                    }}
                  >
                    <ArrowUpRight className="h-6 w-6 shrink-0 text-orange-400" />
                  </motion.div>
                </motion.div>

                {/* Description */}
                <motion.p
                  whileHover={{
                    x: 3,
                  }}
                  className="mt-5 flex-1 text-lg leading-7 max-w-[95%] text-zinc-400"
                >
                  {feature.description}
                </motion.p>

                <div className="mt-auto pt-12">
                  <motion.div
                    whileHover={{
                      scaleX: 1.1,
                    }}
                    className="h-px origin-left bg-gradient-to-r from-orange-500 via-orange-300 to-transparent"
                  />
                </div>
              </motion.div>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}