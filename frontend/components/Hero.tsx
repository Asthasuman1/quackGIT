
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileCode2,
  GitBranch,
  GitPullRequest,
  LockKeyhole,
  Network,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TestTube2,
  X,
  Zap,
} from "lucide-react";

const evidence = [
  {
    icon: CheckCircle2,
    title: "Request may succeed",
    description:
      "The payment provider can process the request before a response reaches the application.",
  },
  {
    icon: Clock3,
    title: "Response times out",
    description:
      "The application may not know that the original transaction already succeeded.",
  },
  {
    icon: GitBranch,
    title: "Retry runs again",
    description:
      "A second submission could occur without adequate idempotency protection.",
  },
];

const capabilities = [
  {
    icon: FileCode2,
    label: "CODE",
    title: "Find implementation risks",
    description:
      "Inspect code paths, fragile logic and error-handling gaps.",
  },
  {
    icon: GitPullRequest,
    label: "PULL REQUEST",
    title: "Investigate change impact",
    description:
      "Understand how a proposed change could affect existing behaviour.",
  },
  {
    icon: Network,
    label: "REPOSITORY",
    title: "Connect the wider context",
    description:
      "Use available code, history, dependencies and tests.",
  },
];

const demoFindings = [
  {
    id: "F-01",
    priority: "P1 · HIGH",
    title: "Payment could be submitted twice",
    file: "src/payments/retry.ts",
    lines: "84–102",
    explanation:
      "The retry path may submit a new payment request even when the payment provider has already processed the original request.",
    evidence: [
      "The original payment request can succeed.",
      "The response can time out before confirmation reaches the application.",
      "The retry path may submit the operation again.",
      "A stable idempotency key is not demonstrated in this example.",
    ],
    impact:
      "A customer could be charged more than once for the same order.",
    recommendation:
      "Use a stable idempotency key across retries and verify the original payment status before resubmitting.",
  },
  {
    id: "F-02",
    priority: "P1 · HIGH",
    title: "Repeated requests could create duplicate orders",
    file: "src/orders/create.ts",
    lines: "42–68",
    explanation:
      "If the payment retry or callback path executes more than once, order creation may be repeated without a reliable deduplication check.",
    evidence: [
      "The same payment operation may be retried.",
      "The order-creation path may receive repeated requests.",
      "The example does not establish a unique-order guard.",
    ],
    impact:
      "The system could create multiple orders for one customer purchase.",
    recommendation:
      "Make order creation idempotent using a unique payment or transaction reference.",
  },
  {
    id: "F-03",
    priority: "P2 · MEDIUM",
    title: "Payment timeout may produce an incorrect status",
    file: "src/payments/status.ts",
    lines: "51–76",
    explanation:
      "A timeout does not necessarily mean that the payment failed. The provider may have completed the transaction even though the application did not receive its response.",
    evidence: [
      "The provider and application may disagree about transaction status.",
      "A timeout may be interpreted as a definitive payment failure.",
      "The example does not show a reconciliation step.",
    ],
    impact:
      "Payment records and order status could become inconsistent.",
    recommendation:
      "Treat ambiguous timeout outcomes separately and reconcile payment status with the provider before finalising the order state.",
  },
  {
    id: "F-04",
    priority: "P2 · MEDIUM",
    title: "Critical retry scenario lacks regression coverage",
    file: "tests/payments/retry.test.ts",
    lines: "Test coverage",
    explanation:
      "The example lacks a test for the case where the payment succeeds at the provider but its response is lost or delayed.",
    evidence: [
      "The timeout-after-success scenario is not covered.",
      "Duplicate submission behaviour is not verified.",
      "Order deduplication is not validated under retry conditions.",
    ],
    impact:
      "A future change could reintroduce duplicate payment or order behaviour without a test detecting it.",
    recommendation:
      "Add integration tests covering successful payment with lost response, retry handling and duplicate order prevention.",
  },
];

export default function Hero() {
  const [showFullReview, setShowFullReview] = useState(false);

  // Close the review with Escape and prevent background scrolling.
  useEffect(() => {
    if (!showFullReview) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowFullReview(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showFullReview]);

  return (
    <div className="relative isolate overflow-hidden bg-[#080808] text-white">

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute -left-40 top-20 -z-10 h-[500px] w-[500px] rounded-full bg-orange-500/[0.10] blur-[160px]" />

      <div className="pointer-events-none absolute -right-40 top-20 -z-10 h-[600px] w-[600px] rounded-full bg-orange-500/[0.07] blur-[180px]" />

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />

      <section className="relative mx-auto max-w-[1500px] px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-28 xl:px-16">

        {/* Main hero */}
        <div className="grid items-center gap-14 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12">

          {/* LEFT: Brand positioning */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/[0.07] px-4 py-2.5 text-[10px] font-bold tracking-[0.16em] text-orange-300 sm:text-xs">
              <Sparkles size={14} />
              REPOSITORY-LEVEL RISK INTELLIGENCE
            </div>

            {/* Headline */}
            <h1 className="mt-8 max-w-[740px] text-[clamp(3.3rem,6.7vw,6.4rem)] font-black leading-[0.97] tracking-[-0.065em] text-white">
              Predict
              <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 bg-clip-text text-transparent">
                Tomorrow&apos;s
              </span>
              <span className="block">Bugs Today.</span>
            </h1>

            {/* Main message */}
            <p className="mt-8 max-w-[620px] text-base leading-8 text-zinc-400 sm:text-lg">
              An AI reviewer can tell you what looks wrong
              in your code.
              <span className="font-semibold text-white">
                {" "}quackGIT investigates what your code
                changes could break.
              </span>
            </p>

            <p className="mt-4 max-w-[590px] text-sm leading-7 text-zinc-500 sm:text-base">
              Connect code changes with repository context,
              Git history, dependencies and available tests
              to uncover potential failure scenarios and
              understand the reasoning behind each risk.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-wrap items-center gap-4">

              <a
                href="#repository-analysis"
                className="group inline-flex h-14 items-center gap-3 rounded-xl bg-orange-500 px-7 text-sm font-bold text-black shadow-[0_12px_45px_rgba(249,115,22,0.20)] transition duration-300 hover:-translate-y-1 hover:bg-orange-400"
              >
                Explore repository analysis

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>

              <a
                href="#workflow"
                className="inline-flex h-14 items-center gap-3 rounded-xl border border-white/15 bg-white/[0.025] px-6 text-sm font-semibold text-zinc-200 transition hover:border-orange-500/40 hover:bg-orange-500/[0.05]"
              >
                How it works
                <ArrowDown size={17} />
              </a>

            </div>

            {/* Trust indicators */}
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-4 text-xs text-zinc-500 sm:text-sm">

              <span className="flex items-center gap-2">
                <GitBranch size={15} className="text-orange-400" />
                GitHub + GitLab
              </span>

              <span className="flex items-center gap-2">
                <LockKeyhole size={15} className="text-green-400" />
                Encrypted data
              </span>

              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-green-400" />
                Evidence-led findings
              </span>

            </div>

          </motion.div>

          {/* RIGHT: Product demonstration */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease: "easeOut",
            }}
            className="relative"
          >

            {/* Dashboard glow */}
            <div className="pointer-events-none absolute -inset-6 rounded-[36px] bg-orange-500/[0.08] blur-3xl" />

            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#101010] shadow-[0_30px_100px_rgba(0,0,0,0.60)]">

              {/* Dashboard header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-[#171717] px-4 py-4 sm:px-5">

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                </div>

                <div className="flex items-center gap-2">
                  <BrainCircuit size={16} className="text-orange-400" />

                  <span className="text-[10px] font-bold tracking-[0.16em] text-zinc-300 sm:text-xs">
                    QUACKGIT ANALYSIS
                  </span>
                </div>

                <Activity size={16} className="text-zinc-500" />

              </div>

              <div className="space-y-5 p-4 sm:p-6">

                {/* Demo disclosure */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-orange-500/25 bg-orange-500/[0.08] px-3 py-1.5 text-[9px] font-bold tracking-[0.13em] text-orange-300">
                    ILLUSTRATIVE DEMO
                  </span>

                  <span className="text-[9px] font-medium tracking-wide text-zinc-600">
                    SYNTHETIC REPOSITORY DATA
                  </span>
                </div>

                {/* Repository identity */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                        <GitBranch size={19} className="text-orange-400" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          demo-org / checkout-service
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-500">
                          Example repository · @demo-developer
                        </p>
                      </div>

                    </div>

                    <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-400">
                      DEMO
                    </span>

                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-3 text-[10px] text-zinc-400">

                    <span className="flex items-center gap-1.5">
                      <GitPullRequest size={13} />
                      PR #284
                    </span>

                    <span className="text-zinc-700">·</span>

                    <span>
                      Harden payment retry handling
                    </span>

                  </div>

                </div>

                {/* Analysis status */}
                <div className="flex items-center justify-between gap-3">

                  <div>
                    <p className="text-xs font-semibold text-white">
                      Failure investigation
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-500">
                      Example analysis result
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/[0.08] px-3 py-1.5 text-[10px] font-bold text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    HIGH RISK
                  </span>

                </div>

                {/* Main finding */}
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.045] p-4 sm:p-5">

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.10]">
                      <ShieldAlert size={20} className="text-red-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-red-300">
                        Potential failure scenario
                      </span>

                      <h3 className="mt-2 text-lg font-bold leading-6 text-white sm:text-xl">
                        Payment retry could create duplicate orders.
                      </h3>
                    </div>

                  </div>

                  <p className="mt-4 text-xs leading-6 text-zinc-400">
                    A payment might succeed even when the application
                    receives a timeout. A retry without adequate
                    idempotency protection could submit it again.
                  </p>

                  {/* File reference */}
                  <div className="mt-4 rounded-lg border border-white/[0.07] bg-black/30 p-3">

                    <div className="flex items-center gap-2">
                      <FileCode2 size={14} className="text-orange-400" />

                      <span className="break-all font-mono text-[10px] text-orange-300">
                        src/payments/retry.ts
                      </span>
                    </div>

                    <p className="mt-2 text-[10px] text-zinc-600">
                      Illustrative file reference · Lines 84–102
                    </p>

                  </div>

                </div>

                {/* Evidence trail */}
                <div>

                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                      Why this risk matters
                    </p>

                    <span className="text-[9px] text-orange-300">
                      EVIDENCE TRAIL
                    </span>
                  </div>

                  <div className="space-y-3">

                    {evidence.map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.title}
                          className="flex gap-3"
                        >

                          <div className="flex flex-col items-center">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/[0.08]">
                              <Icon size={14} className="text-orange-400" />
                            </div>

                            {index !== evidence.length - 1 && (
                              <div className="mt-1 h-5 w-px bg-orange-500/20" />
                            )}
                          </div>

                          <div className="pb-2">
                            <p className="text-xs font-semibold text-zinc-200">
                              {item.title}
                            </p>

                            <p className="mt-1 text-[10px] leading-5 text-zinc-500">
                              {item.description}
                            </p>
                          </div>

                        </div>
                      );
                    })}

                  </div>
                </div>

                {/* Recommended validation */}
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.055] p-4">

                  <div className="flex items-center gap-2">
                    <Zap size={15} className="text-orange-400" />

                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300">
                      Recommended validation
                    </p>
                  </div>

                  <p className="mt-2 text-xs leading-6 text-zinc-300">
                    Verify idempotency protection and add a
                    regression test for the successful-payment,
                    timed-out-response scenario.
                  </p>

                </div>

                {/* NEW: Open full review */}
                <button
                  type="button"
                  onClick={() => setShowFullReview(true)}
                  className="group flex w-full items-center justify-between gap-4 rounded-xl border border-orange-500/30 bg-orange-500/[0.08] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-orange-400/60 hover:bg-orange-500/[0.13]"
                >

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">
                      Explore the full quackGIT review
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      4 example findings · Evidence · Impact · Recommended fixes
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
                    <ArrowRight
                      size={19}
                      className="text-orange-400 transition-transform group-hover:translate-x-1"
                    />
                  </div>

                </button>

                {/* Dashboard footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] pt-4">

                  <span className="flex items-center gap-2 text-[9px] text-zinc-600">
                    <ShieldCheck size={13} className="text-green-400" />
                    Evidence-led risk investigation
                  </span>

                  <span className="text-[9px] text-zinc-600">
                    Example only · Not live analysis
                  </span>

                </div>

              </div>
            </div>

            {/* Floating label */}
            <div className="absolute -bottom-5 -left-3 hidden rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 shadow-2xl sm:block lg:-left-7">
              <div className="flex items-center gap-2">
                <Network size={16} className="text-orange-400" />

                <span className="text-xs font-semibold text-zinc-200">
                  Investigate beyond the diff
                </span>
              </div>
            </div>

          </motion.div>
        </div>

        {/* Three product levels */}
        <div className="mt-24 grid gap-4 border-t border-white/10 pt-9 md:grid-cols-3">

          {capabilities.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                }}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:bg-orange-500/[0.035]"
              >

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-orange-400">
                    {item.label}
                  </span>

                  <Icon
                    size={19}
                    className="text-zinc-500 transition group-hover:text-orange-400"
                  />
                </div>

                <h3 className="mt-4 text-base font-bold text-white">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {item.description}
                </p>

              </motion.div>
            );
          })}

        </div>

        {/* Closing line */}
        <p className="mt-9 text-center text-xs text-zinc-600">
          Find out what your next commit could break.
        </p>

      </section>

      {/* FULL INTERACTIVE REVIEW MODAL */}
      <AnimatePresence>
        {showFullReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullReview(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
          >

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="full-review-title"
              className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-[0_30px_100px_rgba(0,0,0,0.7)]"
            >

              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-[#171717] px-5 py-4 sm:px-7">

                <div>
                  <div className="flex items-center gap-2">
                    <BrainCircuit size={17} className="text-orange-400" />

                    <span className="text-xs font-bold tracking-[0.15em] text-orange-300">
                      QUACKGIT · FULL REVIEW
                    </span>
                  </div>

                  <h2
                    id="full-review-title"
                    className="mt-2 text-lg font-bold text-white sm:text-xl"
                  >
                    Payment Service — PR #284
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="Close full review"
                  onClick={() => setShowFullReview(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:border-orange-500/40 hover:text-white"
                >
                  <X size={19} />
                </button>

              </div>

              {/* Modal scroll area */}
              <div className="overflow-y-auto p-5 sm:p-7">

                {/* Synthetic data notice */}
                <div className="mb-6 rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-4">

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold tracking-wider text-orange-300">
                      ILLUSTRATIVE REVIEW
                    </span>

                    <span className="text-[10px] text-zinc-500">
                      Synthetic repository · Not a live analysis
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    This example demonstrates how quackGIT can
                    connect related risks across a payment workflow
                    rather than displaying isolated code comments.
                  </p>

                </div>

                {/* Repository summary */}
                <div className="grid gap-3 sm:grid-cols-3">

                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-[10px] text-zinc-500">
                      Repository
                    </p>

                    <p className="mt-2 break-all text-sm font-semibold text-white">
                      demo-org/checkout-service
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-[10px] text-zinc-500">
                      Pull request
                    </p>

                    <p className="mt-2 text-sm font-semibold text-white">
                      #284 · Payment retry
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-[10px] text-zinc-500">
                      Example findings
                    </p>

                    <p className="mt-2 text-sm font-semibold text-orange-300">
                      4 identified scenarios
                    </p>
                  </div>

                </div>

                {/* Findings heading */}
                <div className="mb-5 mt-8 flex flex-wrap items-center justify-between gap-3">

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Potential risks identified
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Each finding includes reasoning and a suggested next step.
                    </p>
                  </div>

                  <span className="rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1.5 text-[10px] font-bold text-red-300">
                    2 HIGH · 2 MEDIUM
                  </span>

                </div>

                {/* All four findings */}
                <div className="space-y-4">

                  {demoFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="overflow-hidden rounded-xl border border-white/10 bg-[#151515]"
                    >

                      {/* Finding header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-zinc-500">
                            {finding.id}
                          </span>

                          <span
                            className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${
                              finding.priority.startsWith("P1")
                                ? "border border-red-500/25 bg-red-500/10 text-red-300"
                                : "border border-yellow-500/25 bg-yellow-500/10 text-yellow-300"
                            }`}
                          >
                            {finding.priority}
                          </span>
                        </div>

                        <span className="text-[10px] text-zinc-500">
                          Example finding
                        </span>

                      </div>

                      <div className="p-4 sm:p-5">

                        {/* Title */}
                        <h4 className="text-base font-bold leading-6 text-white">
                          {finding.title}
                        </h4>

                        {/* File reference */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2">

                          <FileCode2
                            size={14}
                            className="text-orange-400"
                          />

                          <span className="break-all font-mono text-[10px] text-orange-300">
                            {finding.file}
                          </span>

                          <span className="text-[10px] text-zinc-600">
                            · {finding.lines}
                          </span>

                        </div>

                        {/* Explanation */}
                        <p className="mt-4 text-sm leading-6 text-zinc-400">
                          {finding.explanation}
                        </p>

                        {/* Evidence */}
                        <div className="mt-5">

                          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300">
                            Supporting reasoning
                          </p>

                          <ul className="mt-3 space-y-2">
                            {finding.evidence.map((point) => (
                              <li
                                key={point}
                                className="flex items-start gap-2 text-xs leading-5 text-zinc-400"
                              >
                                <CheckCircle2
                                  size={14}
                                  className="mt-0.5 shrink-0 text-orange-400"
                                />

                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>

                        </div>

                        {/* Potential impact */}
                        <div className="mt-5 rounded-lg border border-red-500/15 bg-red-500/[0.04] p-3">

                          <p className="text-[10px] font-bold uppercase tracking-wider text-red-300">
                            Potential impact
                          </p>

                          <p className="mt-2 text-xs leading-6 text-zinc-300">
                            {finding.impact}
                          </p>

                        </div>

                        {/* Recommended action */}
                        <div className="mt-3 rounded-lg border border-green-500/15 bg-green-500/[0.04] p-3">

                          <p className="text-[10px] font-bold uppercase tracking-wider text-green-300">
                            Recommended action
                          </p>

                          <p className="mt-2 text-xs leading-6 text-zinc-300">
                            {finding.recommendation}
                          </p>

                        </div>

                      </div>
                    </div>
                  ))}

                </div>

                {/* Connected investigation summary */}
                <div className="mt-7 rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-5">

                  <div className="flex items-center gap-2">
                    <BrainCircuit
                      size={18}
                      className="text-orange-400"
                    />

                    <h3 className="text-sm font-bold text-white">
                      What this investigation reveals
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    The four scenarios are connected. A payment
                    timeout can trigger a retry, which may lead
                    to duplicate payment or order creation.
                    The missing regression test makes this
                    behaviour harder to catch during development.
                  </p>

                  <p className="mt-3 text-xs leading-6 text-zinc-500">
                    This is a synthetic demonstration of a
                    connected failure investigation, not a claim
                    that these findings were generated by the
                    current quackGIT engine.
                  </p>

                </div>

              </div>

              {/* Modal footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#151515] px-5 py-4 sm:px-7">

                <span className="text-[10px] text-zinc-500">
                  Illustrative data · No real repository information
                </span>

                <button
                  type="button"
                  onClick={() => setShowFullReview(false)}
                  className="rounded-lg bg-orange-500 px-5 py-2.5 text-xs font-bold text-black transition hover:bg-orange-400"
                >
                  Close review
                </button>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
