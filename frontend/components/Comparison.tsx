
"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  Check,
  Code2,
  FileCode2,
  GitBranch,
  GitPullRequest,
  History,
  Network,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Workflow,
  Zap,
} from "lucide-react";

import Reveal from "./animations/Reveal";
import TiltCard from "./TiltCard";

const reviewerExamples = [
  {
    title: "Possible missing error handling",
    description: "Check what happens when the request fails.",
    type: "CODE ISSUE",
  },
  {
    title: "Add a regression test",
    description: "Cover the new retry behaviour.",
    type: "SUGGESTION",
  },
];

const evidenceItems = [
  {
    number: "01",
    title: "First request succeeds",
    description:
      "The payment provider may process the transaction successfully.",
  },
  {
    number: "02",
    title: "Response times out",
    description:
      "The application may not receive confirmation of that success.",
  },
  {
    number: "03",
    title: "Retry runs again",
    description:
      "The retry path could submit the same operation another time.",
  },
];

const investigationInputs = [
  { icon: Code2, label: "Changed code" },
  { icon: History, label: "Git history" },
  { icon: Network, label: "Related modules" },
  { icon: TestTube2, label: "Available tests" },
];

export default function Comparison() {
  return (
    <section className="relative mx-auto max-w-[1440px] overflow-hidden px-5 py-24 sm:px-8 lg:px-12 lg:py-32">

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute left-1/2 top-20 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-orange-500/[0.06] blur-[150px]" />

      {/* Heading */}
      <Reveal>
        <div className="mx-auto max-w-4xl text-center">

          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/[0.08] px-4 py-2 text-[11px] font-bold tracking-[0.18em] text-orange-300">
            <Sparkles size={14} />
            THE QUACKGIT DIFFERENCE
          </span>

          <h2 className="mt-8 text-4xl font-black leading-[1.08] tracking-[-0.055em] text-white sm:text-5xl lg:text-7xl">
            Don't stop at finding a bug.
            <span className="mt-3 block bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 bg-clip-text text-transparent">
              Follow what it could break.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
            AI code reviewers help find bugs and improve pull requests.
            quackGIT puts another question at the centre:
            <span className="font-semibold text-white">
              {" "}how could this change affect the behaviour of the wider system?
            </span>
          </p>

        </div>
      </Reveal>

      {/* Main comparison */}
      <div className="mt-16 grid items-stretch gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:gap-7">

        {/* LEFT: AI reviewer */}
        <Reveal delay={0.05}>
          <TiltCard>
            <div className="h-full rounded-[28px] border border-white/10 bg-[#101010] p-5 sm:p-7 lg:p-8">

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.18em] text-zinc-500">
                  AI CODE REVIEWERS
                </span>

                <Code2 size={21} className="text-zinc-500" />
              </div>

              <h3 className="mt-7 text-2xl font-bold text-white sm:text-3xl">
                Find the problem.
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-500">
                Tools such as these help developers review code,
                identify issues and suggest improvements.
              </p>

              {/* Competitor names */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "GitHub Copilot",
                  "CodeRabbit",
                  "Qodo",
                  "Greptile",
                ].map((name) => (
                  <span
                    key={name}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-zinc-400"
                  >
                    {name}
                  </span>
                ))}
              </div>

              {/* Mock review window */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#090909]">

                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <GitPullRequest size={14} className="text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-400">
                      Pull request review
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-600">
                    Example
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <p className="font-mono text-[11px] text-zinc-500">
                      payment/retry.ts
                    </p>

                    <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.035] p-3">
                      <p className="font-mono text-xs leading-6 text-zinc-400">
                        <span className="text-green-400">+</span>{" "}
                        retryPayment(request);
                      </p>
                      <p className="font-mono text-xs leading-6 text-zinc-400">
                        <span className="text-green-400">+</span>{" "}
                        handleFailure(error);
                      </p>
                    </div>
                  </div>

                  {reviewerExamples.map((item, index) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-yellow-400" />
                        <span className="text-[9px] font-bold tracking-wider text-zinc-500">
                          {item.type}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-zinc-200">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Output */}
              <div className="mt-6 flex items-start gap-3 border-t border-white/[0.08] pt-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <Check size={17} className="text-zinc-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Review comments and suggestions
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Useful feedback on code that needs attention.
                  </p>
                </div>
              </div>

            </div>
          </TiltCard>
        </Reveal>

        {/* RIGHT: quackGIT */}
        <Reveal delay={0.12}>
          <TiltCard>
            <div className="relative h-full overflow-hidden rounded-[28px] border border-orange-500/30 bg-[#14100d] p-5 shadow-[0_25px_100px_rgba(249,115,22,0.08)] sm:p-7 lg:p-8">

              {/* Background glow */}
              <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-orange-500/[0.12] blur-[100px]" />

              <div className="relative">

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.18em] text-orange-300">
                    QUACKGIT · FAILURE INVESTIGATION
                  </span>

                  <BrainCircuit size={22} className="text-orange-400" />
                </div>

                <h3 className="mt-7 text-2xl font-bold text-white sm:text-3xl">
                  Follow the failure path.
                </h3>

                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  Instead of stopping at a code comment,
                  investigate the possible chain of events
                  surrounding the changed behaviour.
                </p>

                {/* Example label */}
                <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold tracking-[0.15em] text-zinc-500">
                    ILLUSTRATIVE SCENARIO
                  </span>

                  <span className="rounded-full border border-red-500/25 bg-red-500/[0.08] px-3 py-1.5 text-[10px] font-bold text-red-300">
                    POTENTIAL RISK
                  </span>
                </div>

                {/* Failure scenario */}
                <div className="mt-3 rounded-2xl border border-orange-500/20 bg-black/30 p-4 sm:p-5">

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.10]">
                      <ShieldAlert size={20} className="text-red-400" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-red-300">
                        Possible failure
                      </p>

                      <h4 className="mt-1 text-lg font-bold leading-6 text-white sm:text-xl">
                        One payment could be submitted twice.
                      </h4>
                    </div>
                  </div>

                  {/* Execution timeline */}
                  <div className="mt-6 space-y-0">

                    {evidenceItems.map((item, index) => (
                      <div key={item.number} className="relative flex gap-3 pb-5 last:pb-0">

                        {/* Timeline connector */}
                        {index !== evidenceItems.length - 1 && (
                          <div className="absolute left-[15px] top-8 h-full w-px bg-orange-500/25" />
                        )}

                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-500/25 bg-[#24180f] text-[10px] font-bold text-orange-300">
                          {item.number}
                        </div>

                        <div className="pt-0.5">
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-zinc-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}

                  </div>

                  {/* Outcome */}
                  <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-300">
                      Possible impact
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-white">
                      A duplicate transaction if the retry path
                      is not protected by idempotency.
                    </p>
                  </div>
                </div>

                {/* Evidence trail */}
                <div className="mt-6">
                  <div className="flex items-center gap-2">
                    <Search size={15} className="text-orange-400" />

                    <p className="text-[10px] font-bold tracking-[0.16em] text-orange-300">
                      WHAT SHOULD BE INVESTIGATED?
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {investigationInputs.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-2 rounded-lg border border-orange-500/10 bg-orange-500/[0.04] px-3 py-3"
                        >
                          <Icon size={15} className="shrink-0 text-orange-400" />

                          <span className="text-[11px] font-medium text-zinc-300">
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommended action */}
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-orange-400"
                  />

                  <div>
                    <p className="text-sm font-semibold text-white">
                      What to validate
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      Check idempotency protection and test the
                      case where the payment succeeds but the
                      response times out.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </TiltCard>
        </Reveal>
      </div>

      {/* The memorable takeaway */}
      <Reveal delay={0.18}>
        <div className="mx-auto mt-14 max-w-4xl text-center">

          <p className="text-sm font-medium text-zinc-500">
            The difference is not just another review comment.
          </p>

          <h3 className="mt-3 text-2xl font-black leading-tight text-white sm:text-4xl">
            It's understanding the
            <span className="text-orange-400"> consequences </span>
            of a code change.
          </h3>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-500">
            quackGIT brings together code-level inspection,
            pull-request analysis and repository context to
            explain potential risks and what developers should
            validate next.
          </p>

        </div>
      </Reveal>

      {/* Three levels */}
      <Reveal delay={0.22}>
        <div className="mt-14 grid gap-3 sm:grid-cols-3">

          {[
            {
              icon: Code2,
              title: "CODE",
              text: "Find risks while writing code.",
            },
            {
              icon: GitPullRequest,
              title: "PULL REQUEST",
              text: "Investigate what a change could break.",
            },
            {
              icon: GitBranch,
              title: "REPOSITORY",
              text: "Understand the wider system context.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 text-center transition-colors hover:border-orange-500/30"
              >
                <Icon
                  size={22}
                  className="mx-auto text-orange-400"
                />

                <p className="mt-3 text-xs font-bold tracking-[0.16em] text-white">
                  {item.title}
                </p>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {item.text}
                </p>
              </div>
            );
          })}

        </div>
      </Reveal>

      {/* Honest comparison note */}
      <p className="mx-auto mt-10 max-w-3xl text-center text-[10px] leading-5 text-zinc-600">
        Other AI review tools may also offer repository context,
        cross-file analysis and risk detection. This illustrates
        quackGIT's intended product focus, not a benchmark or
        feature-by-feature test of competing products.
      </p>

    </section>
  );
}
