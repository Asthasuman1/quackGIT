"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Which Git providers does quackGIT support?",
    answer:
      "quackGIT is designed to integrate with Git repositories. GitHub support will be available first, with additional providers planned.",
  },
  {
    question: "Does quackGIT replace human code reviews?",
    answer:
      "No. quackGIT complements your existing review process by identifying risks, suggesting improvements, and predicting future failures.",
  },
  {
    question: "How does Future Failure Prediction work?",
    answer:
      "quackGIT commit history, code patterns, dependencies, and repository context to estimate where future production failures are most likely to occur.",
  },
  {
    question: "Is my repository data secure?",
    answer:
      "Repository privacy is a priority. quackGIT is designed to analyze code securely and only with your authorization.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-5xl px-6 py-32">
      <div className="text-center">
        <span className="border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300">
          FAQ
        </span>

        <h2 className="mt-6 text-4xl font-black sm:text-5xl">
          Frequently Asked Questions
        </h2>

        <p className="mt-6 text-lg text-zinc-400">
          Everything you need to know about quackGIT.
        </p>
      </div>

      <div className="mt-16 space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={faq.question}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/80"
          >
            <button
              onClick={() => setOpen(open === index ? null : index)}
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <span className="text-lg font-semibold">{faq.question}</span>

              <ChevronDown
                className={`transition-transform duration-300 ${
                  open === index ? "rotate-180 text-orange-400" : ""
                }`}
              />
            </button>

            {open === index && (
              <div className="border-t border-white/10 px-6 pb-6 pt-4 text-zinc-400">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}