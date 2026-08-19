"use client";

import { motion } from "framer-motion";
import {
  GitBranch,
  ScanSearch,
  ShieldAlert,
  BrainCircuit,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import Reveal from "./animations/Reveal";
import TiltCard from "./TiltCard";

const steps = [
  {
    icon: GitBranch,
    title: "Connect Repository",
    description:
      "Securely connect your GitHub repository in just a few clicks.",
  },
  {
    icon: ScanSearch,
    title: "AI Scans Code",
    description:
      "Every commit and pull request is analyzed using advanced AI models.",
  },
  {
    icon: ShieldAlert,
    title: "Detect Risks",
    description:
      "Find security issues, performance bottlenecks, and maintainability problems.",
  },
  {
    icon: BrainCircuit,
    title: "Predict Future Failures",
    description:
      "Identify code likely to break in production before it reaches users.",
  },
  {
    icon: CheckCircle2,
    title: "Merge Confidently",
    description:
      "Review AI suggestions and merge only when your code is production ready.",
  },
];

export default function Workflow() {
  return (
    <section
      id="workflow"
      className="relative mx-auto max-w-[1440px] px-8 py-36 lg:px-10"
    >
      <Reveal>
        <div className="mx-auto max-w-4xl text-center">
          <span className="border-orange-500/30 bg-orange-500/10 px-5 py-2.5 text-base font-medium text-orange-300">
            Workflow
          </span>

          <h2 className="mt-8 text-5xl font-black leading-tight tracking-[-0.04em] sm:text-6xl">
            From Commit to
            <span className="text-orange-400">
              {" "}
              Production Confidence
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-zinc-400">
            quackGIT continuously reviews every commit, predicts failures,
            detects security risks, and ensures production-ready code before
            deployment.
          </p>
        </div>
      </Reveal>

      <div className="mt-24 grid gap-8 md:grid-cols-2 xl:grid-cols-5">
        {steps.map((step, index) => (
          <Reveal key={step.title} delay={index * 0.08}>
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
                className="group relative h-full overflow-hidden rounded-[30px] border border-white/10 bg-[#111111]/75 p-8 backdrop-blur-xl"
              >
                {/* Orange Glow */}

                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(249,115,22,.18), transparent 70%)",
                  }}
                />

                {/* Border */}

                <div className="pointer-events-none absolute inset-0 rounded-[30px] border border-transparent transition-all duration-500 group-hover:border-orange-500/40" />

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
                  className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-400 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_35px_rgba(249,115,22,.45)]"
                >
                  <step.icon size={34} />
                </motion.div>

                {/* Step */}

                <motion.div
                  whileHover={{
                    x: 4,
                  }}
                  className="relative mt-8 flex items-center justify-between"
                >
                  <span className="border-orange-500/20 bg-orange-500/10 px-3 py-1 text-sm font-medium text-orange-300">
                    Step {index + 1}
                  </span>

                  <ArrowUpRight className="opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100 text-orange-400" />
                </motion.div>

                {/* Title */}

                <motion.h3
                  whileHover={{
                    x: 5,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                  className="relative mt-6 text-3xl font-bold tracking-tight text-white"
                >
                  {step.title}
                </motion.h3>

                {/* Description */}

                <motion.p
                  whileHover={{
                    x: 3,
                  }}
                  className="relative mt-5 text-lg leading-8 text-zinc-400"
                >
                  {step.description}
                </motion.p>

                <div className="mt-10">
                  <div className="h-px bg-gradient-to-r from-orange-500 via-orange-300 to-transparent" />
                </div>
              </motion.div>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}