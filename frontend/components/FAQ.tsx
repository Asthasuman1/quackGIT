
"use client";

import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  GitPullRequest,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const faqs = [
  {
    category: "PRODUCT",
    question: "What exactly is quackGIT?",
    answer:
      "quackGIT is an AI-powered code and repository analysis platform that helps developers identify potential failures before they become production problems. It examines code changes alongside available repository context to investigate possible regressions, understand risks and recommend what should be validated. Its goal is to go beyond ordinary code comments and help developers understand what a change could break.",
  },
  {
    category: "INTEGRATION",
    question: "Does quackGIT support both GitHub and GitLab?",
    answer:
      "Yes! quackGIT supports both GitHub and GitLab. You can connect your account, access repositories you are authorized to use, and analyze pull or merge requests through the supported integration. You do not need to switch your existing Git hosting provider to use quackGIT.",
  },
  {
    category: "DIFFERENTIATION",
    question: "How is quackGIT different from other AI code reviewers?",
    answer:
      "AI reviewers such as GitHub Copilot, CodeRabbit, Qodo and Greptile offer powerful code-review and repository-context capabilities. quackGIT puts particular emphasis on Future Failure Prediction: investigating how a proposed change could affect existing behaviour, connecting potential failure scenarios to repository evidence, and explaining what developers should investigate next. It aims to move beyond 'What is wrong with this code?' toward 'What could this change break?'",
  },
  {
    category: "CORE TECHNOLOGY",
    question: "How does Future Failure Prediction actually work?",
    answer:
      "quackGIT analyses code changes alongside available repository context. This can include related code paths, Git history, dependencies, existing implementation patterns and available tests. It uses that context to reason about plausible failure scenarios, explain why they could occur and recommend what to investigate or test. These are evidence-informed risk predictions, not guaranteed forecasts of future incidents.",
  },
  {
    category: "ANALYSIS",
    question: "What will I get after running an analysis?",
    answer:
      "You get findings designed to explain more than just a suspicious line of code. Depending on the analysis, a finding can include a potential issue, severity or risk, relevant code location, reasoning, possible impact and recommended action. The aim is to give you enough context to investigate the finding and decide what needs attention.",
  },
  {
    category: "ANALYSIS",
    question: "What types of problems can quackGIT identify?",
    answer:
      "quackGIT focuses on potential regressions, fragile execution paths, error-handling gaps, dependency-related risks and missing test coverage around changed behaviour. It can also surface relevant security and code-quality concerns when they are visible in the analysed context. Like any automated analysis tool, it cannot guarantee that every bug or vulnerability will be detected.",
  },
  {
    category: "WORKFLOW",
    question: "How do I get started with quackGIT?",
    answer:
      "Choose GitHub or GitLab, connect your account and authorize access to the repositories you want to analyse. Select a repository, choose a pull or merge request, and run the analysis. quackGIT then presents the available findings so you can inspect the reasoning and decide what needs attention.",
  },
  {
    category: "ENGINEERING",
    question: "Does quackGIT replace developers or human code reviews?",
    answer:
      "No. quackGIT is designed to support developers, not replace them. AI analysis can produce false positives, misunderstand context or miss real problems. Developers remain responsible for validating findings, running tests and making the final decisions about fixes and merges. Think of quackGIT as an additional risk-investigation layer for your engineering workflow.",
  },
  {
    category: "SECURITY & PRIVACY",
    question: "Is my source code and repository data secure?",
    answer:
      "Yes. Security and data protection are priorities at quackGIT. All data handled by the platform is protected and encrypted. This includes data associated with your repositories and analysis. Repository access is connected through your authorized GitHub or GitLab integration, so you control which repositories you grant access to. Your code and associated data are treated as protected information.",
  },
  {
    category: "SECURITY & PRIVACY",
    question: "Is my data encrypted?",
    answer:
      "Yes. Data handled by quackGIT is encrypted and protected through security safeguards. Encryption is part of how the platform protects information throughout its handling. We take the confidentiality and protection of your repository data seriously.",
  },
  {
    category: "TRUST",
    question: "Can quackGIT guarantee that a predicted bug will happen?",
    answer:
      "No. Future Failure Prediction identifies plausible risks based on available code and repository evidence. A prediction is a reasoned possibility, not proof that an incident will occur. Some findings may not materialise, and some real failures may be missed. The value is making potential failure paths visible early enough for developers to investigate and address them.",
  },
];

const categoryColors: Record<string, string> = {
  PRODUCT: "text-orange-300",
  INTEGRATION: "text-green-300",
  DIFFERENTIATION: "text-amber-300",
  "CORE TECHNOLOGY": "text-purple-300",
  ANALYSIS: "text-sky-300",
  WORKFLOW: "text-green-300",
  ENGINEERING: "text-zinc-300",
  "SECURITY & PRIVACY": "text-red-300",
  TRUST: "text-orange-300",
};

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative mx-auto max-w-[1440px] overflow-hidden px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute right-0 top-20 -z-10 h-[400px] w-[500px] rounded-full bg-orange-500/[0.05] blur-[140px]" />

      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">

        {/* Left side */}
        <div className="lg:sticky lg:top-28 lg:self-start">

          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/[0.08] px-4 py-2 text-xs font-bold tracking-[0.16em] text-orange-300">
            <Sparkles size={14} />
            GOT QUESTIONS?
          </span>

          <h2 className="mt-7 text-4xl font-black leading-[1.12] tracking-[-0.045em] text-white sm:text-5xl">
            Before you connect
            <span className="block text-orange-400">
              your repository.
            </span>
          </h2>

          <p className="mt-6 max-w-md text-base leading-8 text-zinc-400">
            Your code is valuable. Your trust matters.
            Here's what you should know about quackGIT,
            its analysis capabilities, integrations and
            commitment to protecting your data.
          </p>

          {/* Trust highlights */}
          <div className="mt-10 space-y-5">

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[0.08]">
                <BrainCircuit size={19} className="text-orange-400" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Beyond code comments
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Investigate what a code change could break.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/[0.08]">
                <GitPullRequest size={19} className="text-green-400" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  GitHub and GitLab support
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Connect your preferred Git platform.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/[0.08]">
                <LockKeyhole size={19} className="text-green-400" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Secure and encrypted data
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Your repository data is protected and encrypted.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[0.08]">
                <Users size={19} className="text-orange-400" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Developers stay in control
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  You validate findings and make the final decisions.
                </p>
              </div>
            </div>

          </div>

          {/* Security highlight */}
          <div className="mt-10 rounded-2xl border border-green-500/20 bg-green-500/[0.035] p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-green-400" />

              <span className="text-xs font-semibold text-green-300">
                Your code deserves protection.
              </span>
            </div>

            <p className="mt-2 text-xs leading-6 text-zinc-400">
              Data handled by quackGIT is secured and encrypted.
              Protecting repository information is a core part
              of the platform.
            </p>
          </div>

        </div>

        {/* Right side: FAQ accordion */}
        <div className="space-y-3">

          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              Everything you need to know
            </p>

            <span className="text-xs text-zinc-600">
              {faqs.length} questions
            </span>
          </div>

          {faqs.map((faq, index) => {
            const isOpen = open === index;

            return (
              <div
                key={faq.question}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "border-orange-500/30 bg-[#15110e] shadow-[0_12px_40px_rgba(249,115,22,0.045)]"
                    : "border-white/[0.08] bg-[#101010] hover:border-white/20"
                }`}
              >
                <button
                  type="button"
                  id={`faq-question-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
                >
                  <span
                    className={`hidden w-7 shrink-0 font-mono text-xs sm:block ${
                      isOpen ? "text-orange-400" : "text-zinc-600"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`mb-2 block text-[9px] font-bold tracking-[0.16em] ${
                        categoryColors[faq.category] || "text-zinc-500"
                      }`}
                    >
                      {faq.category}
                    </span>

                    <span
                      className={`block text-sm font-semibold leading-6 transition-colors sm:text-base ${
                        isOpen ? "text-white" : "text-zinc-300"
                      }`}
                    >
                      {faq.question}
                    </span>
                  </span>

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? "rotate-180 border-orange-500/30 bg-orange-500/10 text-orange-400"
                        : "border-white/10 bg-white/[0.03] text-zinc-500"
                    }`}
                  >
                    <ChevronDown size={17} />
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    className="border-t border-white/[0.07] px-5 pb-6 pt-5 sm:px-6"
                  >
                    <div className="border-l-2 border-orange-500/50 pl-4 sm:pl-5">
                      <p className="text-sm leading-7 text-zinc-400">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-20 overflow-hidden rounded-[28px] border border-orange-500/20 bg-gradient-to-r from-[#1a110a] via-[#15100d] to-[#101010] p-7 text-center sm:p-10">

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10">
          <GitPullRequest size={22} className="text-orange-400" />
        </div>

        <h3 className="mt-5 text-2xl font-black text-white sm:text-3xl">
          Ready to look beyond the diff?
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-400">
          Connect GitHub or GitLab and explore how quackGIT
          investigates potential risks in your code changes.
        </p>

        <a
          href="#repository-analysis"
          className="mt-7 inline-flex items-center gap-3 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-black transition hover:-translate-y-1 hover:bg-orange-400"
        >
          Explore repository analysis
          <ArrowRight size={17} />
        </a>

      </div>
    </section>
  );
}
