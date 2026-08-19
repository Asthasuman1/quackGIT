"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthProvider";
import {
  GitBranch,
  Play,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Reveal from "./animations/Reveal";
import TiltCard from "./TiltCard";

export default function Hero() {
  const {
  user,
  authenticated,
  loading,
  login,
} = useAuth();
  const highlights = [
    {
      label: "Supports",
      value: "Git Repositories",
      description:
        "Connect and analyze any public or private GitHub repository.",
      icon: GitBranch,
    },
    {
      label: "AI Capability",
      value: "Future Failure Prediction",
      description:
        "AI models predict potential failures before they impact production.",
      icon: TrendingUp,
    },
    {
      label: "Focus",
      value: "Secure Code Reviews",
      description:
        "AI-powered security analysis and code quality reviews.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute left-[-180px] top-[120px] -z-10 h-[600px] w-[600px] rounded-full bg-orange-500/[0.055] blur-[190px]" />

      <div className="pointer-events-none absolute right-[-180px] top-[80px] -z-10 h-[650px] w-[650px] rounded-full bg-orange-500/[0.08] blur-[210px]" />

      <div className="pointer-events-none absolute left-[42%] top-[45%] -z-10 h-[450px] w-[600px] rounded-full bg-orange-500/[0.025] blur-[180px]" />

      {/* Decorative rings */}
      <div className="pointer-events-none absolute -right-[400px] top-[290px] -z-10 h-[900px] w-[900px] rounded-full border border-orange-500/[0.10]" />

      <div className="pointer-events-none absolute -right-[330px] top-[365px] -z-10 h-[760px] w-[760px] rounded-full border border-orange-500/[0.08]" />

      <div className="pointer-events-none absolute -right-[265px] top-[430px] -z-10 h-[620px] w-[620px] rounded-full border border-orange-500/[0.06]" />

      <section className="relative flex min-h-screen items-center px-5 pb-20 pt-32 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-[1450px]">
          <Reveal>
            <div className="relative">
              {/* Badge */}
              <motion.div
                initial={{
                  opacity: 0,
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                }}
                className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/[0.06] px-5 py-2.5 text-sm font-semibold tracking-wide text-orange-300 sm:px-6 sm:text-base"
              >
                <span className="mr-2 text-base text-orange-400">
                  ✦
                </span>

                AI Powered Git Repository Analysis
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{
                  opacity: 0,
                  y: 30,
                  filter: "blur(10px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
                className="mt-8 max-w-[1080px] text-[56px] font-black leading-[0.92] tracking-[-0.05em] text-white sm:text-[68px] md:text-[78px] lg:text-[88px] xl:text-[96px]"
              >
                <span className="block">Predict</span>

                <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 bg-clip-text text-transparent">
                  Tomorrow&apos;s Bugs
                </span>

                <span className="block">Today.</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.18,
                  duration: 0.7,
                  ease: "easeOut",
                }}
                className="mt-8 max-w-[780px] text-[17px] leading-8 text-zinc-400 sm:text-[18px] lg:text-[19px]"
              >
                quackGIT continuously analyzes your Git repositories,
                detects security risks, reviews code quality, and predicts
                future production failures before they ever happen.
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.28,
                  duration: 0.7,
                  ease: "easeOut",
                }}
                className="mt-9 flex flex-wrap items-center gap-4"
              >
              <motion.button
  type="button"
  onClick={login}
  disabled={loading}
  whileHover={{
    y: -3,
    scale: 1.02,
  }}
  whileTap={{
    scale: 0.98,
  }}
  transition={{
    type: "spring",
    stiffness: 350,
    damping: 18,
  }}
  className="inline-flex h-14 items-center gap-3 rounded-xl bg-orange-500 px-7 text-base font-semibold text-white shadow-[0_12px_35px_rgba(249,115,22,0.25)] transition-all duration-300 hover:bg-orange-400 hover:shadow-[0_14px_40px_rgba(249,115,22,0.32)] disabled:cursor-wait disabled:opacity-70 sm:px-8"
>
  <GitBranch size={19} />

  {loading
    ? "Checking GitHub..."
    : authenticated && user
      ? `Continue as @${user.login}`
      : "Get Started with Git"}
</motion.button>

                <motion.button
                  whileHover={{
                    y: -3,
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 18,
                  }}
                  className="inline-flex h-14 items-center gap-3 rounded-xl border border-white/15 bg-white/[0.02] px-7 text-base font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:border-orange-500/40 hover:bg-orange-500/[0.05] sm:px-8"
                >
                  <Play size={18} />
                  Live Demo
                </motion.button>
              </motion.div>

              {/* Feature cards */}
              <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:mt-16">
                {highlights.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <TiltCard key={item.value}>
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 24,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay: 0.38 + index * 0.1,
                          duration: 0.65,
                          ease: "easeOut",
                        }}
                        whileHover={{
                          y: -7,
                        }}
                        className="group relative min-h-[235px] overflow-hidden rounded-[24px] border border-white/10 bg-[#101010]/80 p-7 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/25 hover:bg-[#131313]"
                      >
                        {/* Hover glow */}
                        <div
                          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          style={{
                            background:
                              "radial-gradient(circle at 20% 15%, rgba(249,115,22,.13), transparent 65%)",
                          }}
                        />

                        <div className="relative flex h-full flex-col">
                          {/* Icon */}
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/[0.07]">
                            <Icon
                              size={21}
                              strokeWidth={1.8}
                              className="text-orange-400"
                            />
                          </div>

                          {/* Label */}
                          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.17em] text-zinc-500">
                            {item.label}
                          </p>

                          {/* Title */}
                          <h3 className="mt-2 max-w-[340px] text-xl font-semibold leading-7 tracking-[-0.02em] text-white">
                            {item.value}
                          </h3>

                          {/* Description */}
                          <p className="mt-3 max-w-[350px] text-sm leading-6 text-zinc-500">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    </TiltCard>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}