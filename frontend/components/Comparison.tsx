"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import Reveal from "./animations/Reveal";
import TiltCard from "./TiltCard";

const traditional = [
  "Finds issues after they're introduced",
  "Manual code reviews",
  "Limited repository context",
  "Reactive debugging",
];

const aiCommit = [
  "Predicts future failures",
  "AI-powered repository analysis",
  "Understands complete commit history",
  "Prevents production incidents",
];

export default function Comparison() {
  return (
    <section className="mx-auto max-w-[1440px] px-8 py-36 lg:px-10">
      <Reveal>
        <div className="mx-auto max-w-4xl text-center">
          <span className="border-orange-500/30 bg-orange-500/10 px-5 py-2.5 text-base font-medium text-orange-300">
            Why quackGIT
          </span>

          <h2 className="mt-8 text-5xl font-black tracking-[-0.04em] leading-tight sm:text-6xl">
            Traditional Reviews vs{" "}
            <span className="text-orange-400">
              quackGIT
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-zinc-400">
            Traditional code reviews only discover today's problems.
            quackGIT predicts tomorrow's failures before they ever reach
            production.
          </p>
        </div>
      </Reveal>

      <div className="mt-24 grid gap-8 lg:grid-cols-2">
        {/* Traditional */}

        <Reveal delay={0.05}>
          <TiltCard>
            <motion.div
              whileHover={{
                y: -12,
                scale: 1.02,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="group relative h-full overflow-hidden rounded-[32px] border border-white/10 bg-[#111111]/80 p-10 backdrop-blur-xl"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(255,255,255,.06), transparent 70%)",
                  }}
                />
              </div>

              <div className="relative flex items-center justify-between">
                <h3 className="text-3xl font-bold text-white">
                  Traditional Review
                </h3>

                <motion.div
                  whileHover={{
                    rotate: -12,
                    scale: 1.12,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                  }}
                >
                  <XCircle
                    className="text-red-400"
                    size={34}
                  />
                </motion.div>
              </div>

              <div className="mt-10 space-y-6">
                {traditional.map((item) => (
                  <motion.div
                    key={item}
                    whileHover={{
                      x: 8,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                    }}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5"
                  >
                    <XCircle
                      className="text-red-400"
                      size={22}
                    />

                    <span className="text-lg text-zinc-400">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TiltCard>
        </Reveal>

        {/* quackGIT */}

        <Reveal delay={0.15}>
          <TiltCard>
            <motion.div
              whileHover={{
                y: -12,
                scale: 1.02,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="group relative h-full overflow-hidden rounded-[32px] border border-orange-500/20 bg-[#111111]/80 p-10 backdrop-blur-xl"
            >
              {/* Orange Glow */}

              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(249,115,22,.18), transparent 70%)",
                }}
              />

              <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-transparent transition-all duration-500 group-hover:border-orange-500/40" />

              <div className="relative flex items-center justify-between">
                <h3 className="text-3xl font-bold text-orange-400">
                  quackGIT
                </h3>

                <motion.div
                  whileHover={{
                    rotate: -12,
                    scale: 1.15,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                  }}
                >
                  <CheckCircle
                    className="text-green-400"
                    size={34}
                  />
                </motion.div>
              </div>

              <div className="mt-10 space-y-6">
                {aiCommit.map((item) => (
                  <motion.div
                    key={item}
                    whileHover={{
                      x: 8,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                    }}
                    className="flex items-center justify-between rounded-2xl border border-orange-500/10 bg-orange-500/[0.04] p-5"
                  >
                    <div className="flex items-center gap-4">
                      <CheckCircle
                        className="text-green-400"
                        size={22}
                      />

                      <span className="text-lg text-white">
                        {item}
                      </span>
                    </div>

                    <motion.div
                      whileHover={{
                        x: 4,
                      }}
                    >
                      <ArrowRight
                        size={20}
                        className="text-orange-400"
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{
                  width: 0,
                }}
                whileInView={{
                  width: "100%",
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 1.4,
                }}
                className="mt-10 h-px bg-gradient-to-r from-orange-500 via-orange-300 to-transparent"
              />
            </motion.div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  );
}