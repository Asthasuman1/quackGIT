"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import TiltCard from "./TiltCard";

export default function Dashboard() {
  return (
    <TiltCard className="w-full max-w-[720px]">
      <motion.div
        initial={{ opacity: 0, y: 60, rotate: -4 }}
        animate={{
          opacity: 1,
          y: [0, -12, 0],
          rotate: 0,
        }}
        transition={{
          opacity: { duration: 0.8 },
          rotate: { duration: 0.8 },
          y: {
            duration: 6,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          },
        }}
        className="relative w-full"
      >
        <div className="rounded-[36px] border border-white/10 bg-zinc-900/80 px-8 py-8 lg:px-10 lg:py-10 shadow-[0_45px_140px_rgba(0,0,0,0.48)] backdrop-blur-2xl">

          {/* Stats */}

          <div className="mt-10 grid gap-4 sm:grid-cols-3">

            {[
              ["Commits", "2.8K", ""],
              ["Issues", "14", ""],
              ["AI Score", "94%", "text-orange-400"],
            ].map(([title, value, color]) => (
              <motion.div
                key={title}
                whileHover={{
                  y: -6,
                  scale: 1.03,
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                }}
                className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-6 min-h-[110px]"
              >
                <p className="text-sm text-zinc-400">
                  {title}
                </p>

                <h4 className={`mt-4 text-[2.6rem] font-bold leading-none ${color}`}>
                  {value}
                </h4>
              </motion.div>
            ))}

          </div>
          {/* Analysis Cards */}

          <div className="mt-10 grid gap-6">

            <motion.div
              whileHover={{
                y: -8,
                scale: 1.01,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
              }}
              className="group flex items-center justify-between rounded-[28px] border border-white/10 bg-white/5 p-6 sm:p-7 transition-all hover:border-green-500/30"
            >
              <div className="flex items-center gap-4">

                <motion.div
                  whileHover={{
                    rotate: -10,
                    scale: 1.1,
                  }}
                  className="rounded-2xl bg-green-500/10 p-3"
                >
                  <ShieldCheck className="h-6 w-6 text-green-400" />
                </motion.div>

                <div>
                  <p className="text-lg font-semibold">
                    Security Analysis
                  </p>

                  <p className="text-sm text-zinc-500">
                    No critical vulnerabilities
                  </p>
                </div>

              </div>

              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </motion.div>

            <motion.div
              whileHover={{
                y: -8,
                scale: 1.01,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
              }}
              className="group flex items-center justify-between rounded-[28px] border border-white/10 bg-white/5 p-6 sm:p-7 transition-all hover:border-blue-500/30"
            >
              <div className="flex items-center gap-4">

                <motion.div
                  whileHover={{
                    rotate: -10,
                    scale: 1.1,
                  }}
                  className="rounded-2xl bg-blue-500/10 p-3"
                >
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </motion.div>

                <div>
                  <p className="text-lg font-semibold">
                    Performance Score
                  </p>

                  <p className="text-sm text-zinc-500">
                    Repository health improving
                  </p>
                </div>

              </div>

              <span className="text-2xl font-bold">
                94%
              </span>
            </motion.div>

            <motion.div
              whileHover={{
                y: -10,
                scale: 1.02,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
              }}
              className="group rounded-[32px] border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-7"
            >
              <div className="flex items-center gap-4">

                <motion.div
                  whileHover={{
                    rotate: -10,
                    scale: 1.12,
                  }}
                  className="rounded-2xl bg-orange-500/10 p-3"
                >
                  <AlertTriangle className="h-7 w-7 text-orange-400" />
                </motion.div>

                <div>
                  <p className="text-2xl font-bold">
                    Future Failure Prediction
                  </p>

                  <p className="mt-1 text-lg text-zinc-400">
                    AI detected potential production risks
                  </p>
                </div>

              </div>

              <div className="mt-8 space-y-4">

                <div className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-white">Memory Leak</span>
                  <span className="font-semibold text-red-400">High</span>
                </div>

                <div className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-white">API Timeout</span>
                  <span className="font-semibold text-yellow-400">Medium</span>
                </div>

                <div className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-white">Race Condition</span>
                  <span className="font-semibold text-orange-400">Medium</span>
                </div>

              </div>
            </motion.div>

          </div>

        </div>

        <motion.div
          animate={{
            opacity: [0.45, 0.8, 0.45],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -inset-10 -z-10 rounded-[64px] bg-gradient-to-r from-orange-600/20 via-orange-500/20 to-amber-400/20 blur-[120px]"
        />
      </motion.div>
    </TiltCard>
  );
}