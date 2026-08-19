"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  GitBranch,
} from "lucide-react";
import Reveal from "./animations/Reveal";
import TiltCard from "./TiltCard";

export default function Prediction() {
  return (
    <section className="mx-auto max-w-[1440px] px-8 py-36 lg:px-10">
      <Reveal>
        <div className="mx-auto max-w-4xl text-center">
          <span className="border-orange-500/30 bg-orange-500/10 px-5 py-2.5 text-base font-medium text-orange-300">
            AI Prediction Engine
          </span>

          <h2 className="mt-8 text-5xl font-black leading-tight tracking-[-0.04em] sm:text-6xl">
            Predict Production Failures
            <span className="text-orange-400">
              {" "}
              Before They Happen
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-zinc-400">
            quackGIT doesn't just review your code. It predicts which commits
            are most likely to introduce production failures so your team can
            fix them before deployment.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <TiltCard className="mt-20">
          <motion.div
            whileHover={{
              y: -8,
              scale: 1.01,
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 20,
            }}
            className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[#111111]/80 p-10 backdrop-blur-xl"
          >
            {/* Hover Glow */}

            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(249,115,22,.18), transparent 70%)",
              }}
            />

            {/* Header */}

            <div className="relative flex flex-col gap-8 border-b border-white/10 pb-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{
                      rotate: -10,
                      scale: 1.12,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                    }}
                  >
                    <GitBranch className="text-orange-400" size={28} />
                  </motion.div>

                  <h3 className="text-3xl font-bold">
                    payment-service
                  </h3>
                </div>

                <p className="mt-3 text-lg text-zinc-400">
                  Latest Commit • 2 minutes ago
                </p>
              </div>

              <motion.div
                whileHover={{
                  y: -4,
                  scale: 1.04,
                }}
                className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-7 py-5"
              >
                <p className="text-sm text-orange-300">
                  Repository Health
                </p>

                <h3 className="mt-2 text-4xl font-black">
                  82 / 100
                </h3>
              </motion.div>
            </div>

            {/* Content */}

            <div className="relative mt-10 grid gap-8 lg:grid-cols-2">
              {/* Left */}

              <div className="space-y-6">
                <motion.div
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                  }}
                  className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-7"
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{
                        rotate: -12,
                        scale: 1.15,
                      }}
                    >
                      <AlertTriangle
                        className="text-red-400"
                        size={28}
                      />
                    </motion.div>

                    <h4 className="text-xl font-semibold">
                      High Risk Prediction
                    </h4>
                  </div>

                  <p className="mt-5 text-lg leading-8 text-zinc-300">
                    Possible database connection leak detected after repeated
                    retry logic.
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-red-400">
                      Confidence
                    </span>

                    <span className="text-2xl font-bold">
                      94%
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                  }}
                  className="rounded-[28px] border border-white/10 bg-[#181818] p-7"
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{
                        rotate: -12,
                        scale: 1.15,
                      }}
                    >
                      <Database
                        className="text-orange-400"
                        size={28}
                      />
                    </motion.div>

                    <h4 className="text-xl font-semibold">
                      AI Recommendation
                    </h4>
                  </div>

                  <p className="mt-5 text-lg leading-8 text-zinc-400">
                    Use a connection pool and ensure every retry properly closes
                    unused database connections.
                  </p>
                </motion.div>
              </div>

              {/* Right */}

              <div className="space-y-5">
                {[
                  {
                    icon: BrainCircuit,
                    label: "AI Analysis",
                    value: "Completed",
                    color: "text-orange-400",
                  },
                  {
                    icon: Clock3,
                    label: "Estimated Review",
                    value: "18 sec",
                    color: "text-white",
                  },
                  {
                    icon: CheckCircle2,
                    label: "Security Checks",
                    value: "Passed",
                    color: "text-green-400",
                  },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    whileHover={{
                      y: -6,
                      scale: 1.02,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                    }}
                    className="flex items-center justify-between rounded-[24px] border border-white/10 bg-[#181818] p-6"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{
                          rotate: -10,
                          scale: 1.12,
                        }}
                      >
                        <item.icon
                          className="text-orange-400"
                          size={26}
                        />
                      </motion.div>

                      <span className="text-lg">
                        {item.label}
                      </span>
                    </div>

                    <span
                      className={`text-lg font-semibold ${item.color}`}
                    >
                      {item.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </TiltCard>
      </Reveal>
    </section>
  );
}