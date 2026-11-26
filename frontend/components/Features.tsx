
"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Code2,
  FileCode2,
  GitBranch,
  GitPullRequest,
  Network,
  ShieldCheck,
  TestTube2,
  Workflow,
  Zap,
} from "lucide-react";

import Reveal from "./animations/Reveal";
import TiltCard from "./TiltCard";

const supportingFeatures = [
  {
    number: "01",
    icon: GitPullRequest,
    label: "PULL REQUEST INTELLIGENCE",
    title: "Understand the impact of every change.",
    description:
      "Go beyond the pull request diff. Investigate changed files alongside related code and existing behaviour to understand where a regression could appear.",
    points: [
      "Review changed code",
      "Consider related execution paths",
      "Identify potential regressions",
    ],
  },
  {
    number: "02",
    icon: ShieldCheck,
    label: "SECURITY & CODE RISKS",
    title: "Spot risky implementation patterns.",
    description:
      "Bring attention to potentially unsafe code, fragile logic and error-handling concerns that deserve a closer engineering review.",
    points: [
      "Potentially unsafe patterns",
      "Fragile execution paths",
      "Error-handling concerns",
    ],
  },
  {
    number: "03",
    icon: TestTube2,
    label: "TESTING INTELLIGENCE",
    title: "Find the scenarios your tests may miss.",
    description:
      "Examine available tests in the context of changed behaviour and highlight important failure scenarios that may need regression coverage.",
    points: [
      "Review available test coverage",
      "Identify missing scenarios",
      "Recommend regression tests",
    ],
  },
];

const investigationSteps = [
  {
    number: "01",
    icon: Code2,
    title: "Changed code",
    description: "Understand what was modified.",
  },
  {
    number: "02",
    icon: Network,
    title: "Repository context",
    description: "Connect related code and behaviour.",
  },
  {
    number: "03",
    icon: BrainCircuit,
    title: "Failure reasoning",
    description: "Investigate what could go wrong.",
  },
  {
    number: "04",
    icon: ShieldCheck,
    title: "Actionable findings",
    description: "Explain the risk and what to validate.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative mx-auto max-w-[1500px] overflow-hidden px-5 py-24 sm:px-8 lg:px-12 lg:py-36"
    >
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute left-1/2 top-20 -z-10 h-[500px] w-[850px] -translate-x-1/2 rounded-full bg-orange-500/[0.055] blur-[150px]" />

      {/* Section heading */}
      <Reveal>
        <div className="mx-auto max-w-4xl text-center">

          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/[0.08] px-5 py-2.5 text-xs font-bold tracking-[0.17em] text-orange-300">
            <Zap size={14} />
            WHAT QUACKGIT DOES
          </span>

          <h2 className="mt-8 text-4xl font-black leading-[1.1] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
            More than reviewing code.
            <span className="mt-2 block bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 bg-clip-text text-transparent">
              Investigating what could fail.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
            quackGIT connects code changes with the wider
            repository context to investigate potential
            failures, explain risks and help developers
            decide what to validate.
          </p>

        </div>
      </Reveal>

      {/* Main featured capability */}
      <Reveal delay={0.08}>
        <div className="mt-16">

          <TiltCard>
            <div className="group relative overflow-hidden rounded-[28px] border border-orange-500/25 bg-[#11100e] p-6 shadow-[0_25px_100px_rgba(249,115,22,0.06)] sm:p-9 lg:p-11">

              {/* Glow */}
              <div className="pointer-events-none absolute -right-40 -top-40 h-[450px] w-[450px] rounded-full bg-orange-500/[0.10] blur-[120px] transition-opacity duration-500 group-hover:bg-orange-500/[0.15]" />

              <div className="relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">

                {/* Left: explanation */}
                <div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/[0.10]">
                      <BrainCircuit
                        size={24}
                        className="text-orange-400"
                      />
                    </span>

                    <span className="text-[10px] font-bold tracking-[0.17em] text-orange-300">
                      CORE DIFFERENTIATOR
                    </span>
                  </div>

                  <h3 className="mt-7 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                    Future Failure
                    <span className="block text-orange-400">
                      Prediction
                    </span>
                  </h3>

                  <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                    A code change can look perfectly fine
                    on its own and still introduce a problem
                    somewhere else.
                  </p>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                    quackGIT investigates how changed code
                    connects to existing repository behaviour
                    and reasons about possible failure scenarios
                    before you merge.
                  </p>

                  {/* Key benefits */}
                  <div className="mt-7 space-y-3">

                    {[
                      "Connect changes with related code paths",
                      "Investigate potential regression scenarios",
                      "Explain why a failure could happen",
                      "Recommend what developers should validate",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2
                          size={17}
                          className="mt-0.5 shrink-0 text-orange-400"
                        />

                        <span className="text-sm text-zinc-300">
                          {item}
                        </span>
                      </div>
                    ))}

                  </div>

                </div>

                {/* Right: investigation visualization */}
                <div className="relative">

                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#090909]">

                    {/* Mini window header */}
                    <div className="flex items-center justify-between border-b border-white/10 bg-[#171717] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-400/70" />
                        <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
                        <span className="h-2 w-2 rounded-full bg-green-400/70" />
                      </div>

                      <span className="text-[9px] font-bold tracking-[0.14em] text-zinc-500">
                        FAILURE INVESTIGATION
                      </span>

                      <Activity
                        size={15}
                        className="text-orange-400"
                      />
                    </div>

                    <div className="p-4 sm:p-6">

                      {/* Example change */}
                      <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                        <div className="flex items-center gap-2">
                          <GitPullRequest
                            size={15}
                            className="text-orange-400"
                          />

                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Incoming code change
                          </span>
                        </div>

                        <p className="mt-3 font-mono text-xs text-white">
                          src/payments/retry.ts
                        </p>

                        <div className="mt-3 rounded-lg bg-black/40 p-3 font-mono text-[10px] leading-6">
                          <p className="text-zinc-500">
                            // Handle a failed payment
                          </p>

                          <p className="text-green-400">
                            + retryPayment(request);
                          </p>

                          <p className="text-green-400">
                            + handleFailure(error);
                          </p>
                        </div>
                      </div>

                      {/* Connection */}
                      <div className="flex justify-center py-3">
                        <div className="flex items-center gap-2 text-[9px] font-bold tracking-wider text-orange-400">
                          <ArrowDownLine />
                          INVESTIGATE RELATED CONTEXT
                        </div>
                      </div>

                      {/* Related components */}
                      <div className="grid grid-cols-2 gap-2">

                        {[
                          "Payment status",
                          "Order creation",
                          "Retry handling",
                          "Existing tests",
                        ].map((item, index) => (
                          <motion.div
                            key={item}
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                              delay: index * 0.08,
                              duration: 0.4,
                            }}
                            className="flex items-center gap-2 rounded-lg border border-orange-500/15 bg-orange-500/[0.045] px-3 py-3"
                          >
                            <Network
                              size={13}
                              className="shrink-0 text-orange-400"
                            />

                            <span className="text-[10px] font-medium text-zinc-300">
                              {item}
                            </span>
                          </motion.div>
                        ))}

                      </div>

                      {/* Potential outcome */}
                      <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[0.055] p-4">

                        <div className="flex items-center gap-2">
                          <Activity
                            size={15}
                            className="text-red-400"
                          />

                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-300">
                            Potential failure scenario
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold leading-6 text-white">
                          Payment retry could submit the same
                          transaction twice.
                        </p>

                        <p className="mt-2 text-[10px] leading-5 text-zinc-500">
                          Illustrative scenario · Not a live analysis
                        </p>

                      </div>

                    </div>
                  </div>

                  <p className="mt-3 text-center text-[9px] text-zinc-600">
                    Conceptual demonstration of repository-aware risk analysis
                  </p>

                </div>

              </div>
            </div>
          </TiltCard>

        </div>
      </Reveal>

      {/* Supporting functionality */}
      <div className="mt-16">

        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">

            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-orange-400">
                THE SUPPORTING INTELLIGENCE
              </p>

              <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                One investigation. More useful insights.
              </h3>
            </div>

            <p className="max-w-sm text-sm leading-6 text-zinc-500">
              Understand changes, surface risks and know
              where additional validation may be needed.
            </p>

          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-3">

          {supportingFeatures.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Reveal
                key={feature.title}
                delay={index * 0.08}
              >
                <TiltCard>
                  <motion.div
                    whileHover={{ y: -7 }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 20,
                    }}
                    className="group relative flex h-full min-h-[330px] flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111111] p-6 transition-colors duration-300 hover:border-orange-500/30 sm:p-7"
                  >

                    {/* Hover glow */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/[0.07] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative">

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-[0.16em] text-orange-400">
                          {feature.label}
                        </span>

                        <span className="font-mono text-xs text-zinc-600">
                          {feature.number}
                        </span>
                      </div>

                      <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[0.08] transition-all duration-300 group-hover:bg-orange-500 group-hover:text-black">
                        <Icon
                          size={22}
                          className="text-orange-400 transition-colors group-hover:text-black"
                        />
                      </div>

                      <h4 className="mt-6 text-xl font-bold leading-snug text-white">
                        {feature.title}
                      </h4>

                      <p className="mt-3 text-sm leading-7 text-zinc-400">
                        {feature.description}
                      </p>

                      <div className="mt-6 space-y-3">
                        {feature.points.map((point) => (
                          <div
                            key={point}
                            className="flex items-start gap-2"
                          >
                            <CheckCircle2
                              size={14}
                              className="mt-0.5 shrink-0 text-orange-400"
                            />

                            <span className="text-xs leading-5 text-zinc-500">
                              {point}
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>

                    <div className="mt-auto flex items-center justify-between pt-8">
                      <span className="h-px flex-1 bg-gradient-to-r from-orange-500/60 to-transparent" />

                      <ArrowUpRight
                        size={18}
                        className="ml-3 text-zinc-600 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-orange-400"
                      />
                    </div>

                  </motion.div>
                </TiltCard>
              </Reveal>
            );
          })}

        </div>
      </div>

      {/* How the capabilities work together */}
      <Reveal delay={0.1}>
        <div className="mt-20 rounded-[26px] border border-white/10 bg-[#101010] p-6 sm:p-9 lg:p-10">

          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[10px] font-bold tracking-[0.18em] text-orange-400">
              HOW THE INTELLIGENCE CONNECTS
            </span>

            <h3 className="mt-4 text-2xl font-black text-white sm:text-3xl">
              From code changes to actionable risk insights.
            </h3>

            <p className="mt-3 text-sm leading-7 text-zinc-500">
              quackGIT brings these stages together to help
              developers understand more than the changed lines.
            </p>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {investigationSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="relative rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 transition-colors hover:border-orange-500/25"
                >

                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[0.08]">
                      <Icon
                        size={19}
                        className="text-orange-400"
                      />
                    </div>

                    <span className="font-mono text-xs text-zinc-600">
                      {step.number}
                    </span>
                  </div>

                  <h4 className="mt-5 text-sm font-bold text-white">
                    {step.title}
                  </h4>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    {step.description}
                  </p>

                  {index < investigationSteps.length - 1 && (
                    <ArrowRight
                      size={16}
                      className="absolute -right-2.5 top-1/2 z-10 hidden text-orange-500 lg:block"
                    />
                  )}

                </div>
              );
            })}

          </div>

        </div>
      </Reveal>

      {/* Closing */}
      <Reveal delay={0.15}>
        <div className="mt-16 text-center">

          <p className="mx-auto max-w-2xl text-lg font-medium leading-8 text-zinc-300 sm:text-xl">
            Don't just ask whether your code works.
            <span className="text-orange-400">
              {" "}Understand what could happen when it runs.
            </span>
          </p>

        </div>
      </Reveal>

    </section>
  );
}

/* Small visual connector */
function ArrowDownLine() {
  return (
    <span className="inline-flex items-center">
      <motion.span
        animate={{ y: [0, 3, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <ArrowDown size={13} />
      </motion.span>
    </span>
  );
}
