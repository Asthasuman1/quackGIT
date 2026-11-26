
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle,
  GitBranch,
  GitPullRequest,
  Play,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/lib/AuthProvider";
import {
  getRepositories,
  getPullRequests,
  predictPullRequest,
} from "@/lib/api";
import {
  PREWRITTEN_REVIEWS,
  type PreparedPRReview,
} from "@/lib/prewrittenReviews";

type Repository = {
  name: string;
  full_name: string;
  private: boolean;
};

type PullRequest = {
  number: number;
  title: string;
  author: string;
  url: string;
  state: string;
};

type Location = {
  file?: string;
  line_start?: number | null;
  line_end?: number | null;
  function?: string | null;
};

type Finding = {
  title: string;
  finding_type?: string;
  severity: string;
  location?: Location;
  what_is_wrong?: string;
  why_it_is_wrong?: string;
  why_it_happens?: string;
  what_it_can_cause?: string;
  how_to_fix?: string;
  time_horizon?: string;
};

type AnalysisResult = {
  summary: string;
  predictions: Finding[];
  security_analysis?: {
    status?: string;
    findings?: Finding[];
  };
  testing_analysis?: {
    status?: string;
    findings?: Finding[];
  };
};

const checklist = [
  "Investigate repository-aware regression risks",
  "Identify security weaknesses and dependency risks",
  "Find meaningful gaps in test coverage",
  "Explain review findings with code-level evidence",
];

const severityRank: Record<string, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1,
};

function severityClass(severity: string) {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "HIGH":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "MEDIUM":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
    case "LOW":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    default:
      return "border-white/10 bg-white/5 text-zinc-300";
  }
}

function priorityClass(priority: string) {
  switch (priority) {
    case "P1":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "P2":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    default:
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }
}

function formatFindingType(type?: string) {
  if (!type) return "Finding";

  const labels: Record<string, string> = {
    CI_CD: "CI/CD",
    API_INTEGRATION: "API Integration",
    BUILD_DEPENDENCY: "Build / Dependency",
    MEMORY_RESOURCE: "Memory / Resource",
    DATA_VALIDATION: "Data Validation",
  };

  if (labels[type]) return labels[type];

  return type
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

/* =====================================================
   NORMAL BACKEND REVIEW COMPONENTS
===================================================== */

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function FindingCard({
  finding,
  index,
}: {
  finding: Finding;
  index: number;
}) {
  const location = finding.location || {};

  const locationText = [
    location.file || "Location not available",
    location.line_start
      ? `line ${location.line_start}${
          location.line_end &&
          location.line_end !== location.line_start
            ? `-${location.line_end}`
            : ""
        }`
      : "",
    location.function
      ? `function ${location.function}`
      : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <article className="rounded-2xl border border-white/10 bg-[#181818] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Finding {index + 1} · {formatFindingType(finding.finding_type)}
          </p>

          <h4 className="mt-1 text-base font-semibold leading-6 text-white">
            {finding.title}
          </h4>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${severityClass(
            finding.severity
          )}`}
        >
          {finding.severity}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Affected code
        </p>

        <p className="mt-1 break-words font-mono text-xs text-zinc-200">
          {locationText}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <Detail
          label="Finding"
          value={finding.what_is_wrong}
        />

        <Detail
          label="Technical rationale"
          value={finding.why_it_is_wrong}
        />

        <Detail
          label="Root cause"
          value={finding.why_it_happens}
        />

        <Detail
          label="Potential impact"
          value={finding.what_it_can_cause}
        />

        <Detail
          label="Time horizon"
          value={finding.time_horizon}
        />
      </div>

      {finding.how_to_fix && (
        <div className="mt-5 rounded-xl border border-green-500/15 bg-green-500/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-green-400">
            Recommended change
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
            {finding.how_to_fix}
          </p>
        </div>
      )}
    </article>
  );
}

function AnalysisSection({
  icon: Icon,
  title,
  description,
  findings,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  findings: Finding[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
      <div className="flex items-start gap-3">
        <Icon
          className="mt-1 text-orange-400"
          size={22}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-white">
              {title}
            </h3>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
              {findings.length}{" "}
              {findings.length === 1 ? "finding" : "findings"}
            </span>
          </div>

          <p className="mt-1 text-sm leading-6 text-zinc-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {findings.length ? (
          findings.map((finding, index) => (
            <FindingCard
              key={`${finding.title}-${index}`}
              finding={finding}
              index={index}
            />
          ))
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
            No findings were returned for this analysis layer.
          </div>
        )}
      </div>
    </section>
  );
}

/* =====================================================
   PREPARED PULL REQUEST REVIEW
===================================================== */

function PRReviewView({
  review,
}: {
  review: PreparedPRReview;
}) {
  const verdictLabel =
    review.verdict === "REQUEST_CHANGES"
      ? "Request changes"
      : review.verdict === "APPROVE"
        ? "Approved"
        : "Comment";

  const verdictClass =
    review.verdict === "REQUEST_CHANGES"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : review.verdict === "APPROVE"
        ? "border-green-500/30 bg-green-500/10 text-green-300"
        : "border-blue-500/30 bg-blue-500/10 text-blue-300";

  return (
    <div className="space-y-5">

      {/* Review header */}
      <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <GitPullRequest
              size={18}
              className="text-orange-400"
            />
            Pull request review
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${verdictClass}`}
          >
            {verdictLabel}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-bold leading-7 text-white">
          {review.title}
        </h3>

        <p className="mt-3 text-sm leading-7 text-zinc-300">
          {review.summary}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
            {review.mergeRisk} merge risk
          </span>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
            {review.comments.length} review comments
          </span>
        </div>
      </section>

      {/* Inline-style review comments */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            Review comments
          </h3>

          <span className="text-xs text-zinc-500">
            File-level feedback
          </span>
        </div>

        {review.comments.map((comment) => (
          <article
            key={comment.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#181818]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-[11px] text-zinc-400">
                  {comment.id}
                </span>

                <h4 className="text-sm font-semibold text-white">
                  {comment.title}
                </h4>
              </div>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${priorityClass(
                  comment.priority
                )}`}
              >
                {comment.priority}
              </span>
            </div>

            <div className="border-b border-white/10 bg-[#101010] px-4 py-3">
              <p className="break-all font-mono text-xs leading-5 text-orange-300">
                {comment.path}
              </p>

              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                Lines {comment.lineStart}
                {comment.lineEnd
                  ? `–${comment.lineEnd}`
                  : ""}
              </p>
            </div>

            <div className="p-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {comment.body}
              </p>

              <div className="mt-4 border-l-2 border-orange-500/40 pl-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                  Requested change
                </p>

                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {comment.requestedChange}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Test evidence */}
      <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        <div className="flex items-center gap-2">
          <CheckCircle
            size={18}
            className="text-orange-400"
          />

          <h3 className="font-bold text-white">
            Checks and test evidence
          </h3>
        </div>

        <div className="mt-4 divide-y divide-white/5">
          {review.checks.map((check) => (
            <div
              key={check.name}
              className="py-3 first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-200">
                  {check.name}
                </p>

                <span className="text-xs text-orange-300">
                  {check.status}
                </span>
              </div>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                {check.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Integration assessment */}
      <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        <h3 className="font-bold text-white">
          Integration review
        </h3>

        <p className="mt-2 text-sm leading-7 text-zinc-400">
          {review.integrationNote}
        </p>
      </section>

      {/* Final recommendation */}
      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={18}
            className="text-red-300"
          />

          <h3 className="font-bold text-red-200">
            Final review recommendation
          </h3>
        </div>

        <p className="mt-3 text-sm leading-7 text-zinc-300">
          {review.finalRecommendation}
        </p>
      </section>
    </div>
  );
}

/* =====================================================
   LANDING PAGE COMPONENTS
===================================================== */

function CapabilityCard({
  icon: Icon,
  title,
  question,
  description,
}: {
  icon: LucideIcon;
  title: string;
  question: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
      <Icon
        size={20}
        className="text-orange-400"
      />

      <h3 className="mt-3 font-semibold text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm font-medium text-zinc-300">
        {question}
      </p>

      <p className="mt-2 text-xs leading-5 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#181818] p-4">
      <Icon
        size={20}
        className="text-orange-400"
      />

      <p className="mt-3 text-xs uppercase tracking-wider text-zinc-500">
        {title}
      </p>

      <p className="mt-1 text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">
        {label}
      </label>

      {children}
    </div>
  );
}

/* =====================================================
   MAIN REPOSITORY ANALYSIS COMPONENT
===================================================== */

export default function RepositoryAnalysis() {
  const {
    authenticated,
    loading: authLoading,
    loginWithGitHub,
  } = useAuth();

  const [repositories, setRepositories] =
    useState<Repository[]>([]);

  const [pullRequests, setPullRequests] =
    useState<PullRequest[]>([]);

  const [selectedRepository, setSelectedRepository] =
    useState("");

  const [selectedPullRequest, setSelectedPullRequest] =
    useState("");

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [preparedReview, setPreparedReview] =
    useState<PreparedPRReview | null>(null);

  const [loadingRepositories, setLoadingRepositories] =
    useState(false);

  const [loadingPullRequests, setLoadingPullRequests] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] = useState("");

  /* Load GitHub repositories */
  useEffect(() => {
    if (authLoading || !authenticated) return;

    let active = true;

    async function loadRepositories() {
      try {
        setLoadingRepositories(true);
        setError("");

        const data = await getRepositories();

        if (!active) return;

        setRepositories(data);

        setSelectedRepository(
          data[0]?.full_name || ""
        );
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load repositories"
        );
      } finally {
        if (active) {
          setLoadingRepositories(false);
        }
      }
    }

    loadRepositories();

    return () => {
      active = false;
    };
  }, [authenticated, authLoading]);

  /* Load pull requests for selected repository */
  useEffect(() => {
    if (!selectedRepository) {
      setPullRequests([]);
      setSelectedPullRequest("");
      setResult(null);
      setPreparedReview(null);
      return;
    }

    let active = true;

    async function loadPullRequests() {
      try {
        setLoadingPullRequests(true);
        setError("");
        setResult(null);
        setPreparedReview(null);

        const data = await getPullRequests(
          selectedRepository
        );

        if (!active) return;

        setPullRequests(data);

        setSelectedPullRequest(
          data[0]
            ? String(data[0].number)
            : ""
        );
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load pull requests"
        );
      } finally {
        if (active) {
          setLoadingPullRequests(false);
        }
      }
    }

    loadPullRequests();

    return () => {
      active = false;
    };
  }, [selectedRepository]);

  /* Analyze selected PR */
  async function handleAnalyze() {
    if (!selectedRepository || !selectedPullRequest) {
      setError(
        "Please select a repository and pull request."
      );
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setResult(null);
      setPreparedReview(null);

      const reviewKey =
        `${selectedRepository.trim().toLowerCase()}:${Number(
          selectedPullRequest
        )}`;

      const matchingReview =
        PREWRITTEN_REVIEWS[reviewKey];

      /*
       * TEMPORARY DEMO MODE:
       * Matching repository + PR displays saved review.
       * All other PRs use the existing backend API.
       */
      if (matchingReview) {
        setPreparedReview(matchingReview);
        return;
      }

      const data = await predictPullRequest(
        selectedRepository,
        Number(selectedPullRequest)
      );

      setResult(data.result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze pull request"
      );
    } finally {
      setAnalyzing(false);
    }
  }

  const predictions =
    result?.predictions || [];

  const security =
    result?.security_analysis?.findings || [];

  const testing =
    result?.testing_analysis?.findings || [];

  const allFindings = useMemo(
    () => [
      ...predictions,
      ...security,
      ...testing,
    ],
    [predictions, security, testing]
  );

  const highestSeverity = allFindings.length
    ? [...allFindings].sort(
        (a, b) =>
          (severityRank[b.severity.toUpperCase()] || 0) -
          (severityRank[a.severity.toUpperCase()] || 0)
      )[0].severity
    : null;

  return (
    <section
      id="repository-analysis"
      className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8"
    >
      <div className="grid items-start gap-12 lg:grid-cols-2">

        {/* LEFT: PRODUCT POSITIONING */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300">
            <BrainCircuit size={16} />
            Repository risk intelligence
          </span>

          <h2 className="mt-7 text-5xl font-black leading-[1.05] tracking-[-0.045em] text-white sm:text-6xl">
            Predict Tomorrow&apos;s Bugs{" "}
            <span className="text-orange-400">
              Today.
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
            quackGIT doesn&apos;t just review what changed.
            It investigates repository history, dependencies,
            tests and code changes to identify what could break next.
          </p>

          <div className="mt-8 space-y-4">
            {checklist.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <CheckCircle
                  className="shrink-0 text-green-400"
                  size={20}
                />

                <span className="text-sm text-zinc-300">
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* CODE / PR / REPOSITORY */}
          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            <CapabilityCard
              icon={BrainCircuit}
              title="Code"
              question="What could fail in this implementation?"
              description="Inspect code paths, error handling and risky patterns."
            />

            <CapabilityCard
              icon={GitPullRequest}
              title="Pull request"
              question="Could this change break existing behaviour?"
              description="Review changed code with surrounding repository context."
            />

            <CapabilityCard
              icon={GitBranch}
              title="Repository"
              question="What risks are emerging across the codebase?"
              description="Use history, dependencies and tests to understand wider impact."
            />
          </div>

          {/* REAL REVIEW EXAMPLE FROM SUPPLIED MATERIAL */}
          <div className="mt-5 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                Example risk finding
              </span>

              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
                HIGH RISK
              </span>
            </div>

            <h3 className="mt-3 font-semibold text-white">
              PDF drawing annotations may be classified as reviewer comments
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              A broad annotation filter can admit CAD labels and
              dimensions into the review output, inflating extracted
              entries and reducing comment precision.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">
                  input.pdf
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  65 → 1,219
                </p>
                <p className="text-[11px] text-zinc-500">
                  Extracted entries
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">
                  Printed comments
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  12 → 0
                </p>
                <p className="text-[11px] text-zinc-500">
                  Extracted entries
                </p>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-zinc-500">
              Example based on supplied comparative review material;
              not a live benchmark.
            </p>
          </div>

          {!authLoading && !authenticated && (
            <div className="mt-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
              <p className="font-semibold text-white">
                Connect GitHub to review your repositories.
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Select a repository and pull request to inspect
                code risks and review findings.
              </p>

              <button
                type="button"
                onClick={loginWithGitHub}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-black transition hover:bg-orange-400"
              >
                Connect GitHub
                <Play size={16} />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: EXISTING GITHUB WORKFLOW */}
        <div>
          <div className="rounded-[28px] border border-white/10 bg-[#111111]/90 p-6 shadow-2xl shadow-black/20 sm:p-8">

            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                  Repository workspace
                </p>

                <h3 className="mt-1 text-xl font-bold text-white">
                  Analyze a pull request
                </h3>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <GitPullRequest
                  className="text-orange-400"
                  size={22}
                />
              </div>
            </div>

            {authLoading ? (
              <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 text-sm text-zinc-400">
                Checking authentication...
              </div>
            ) : !authenticated ? (
              <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 text-sm text-zinc-400">
                Sign in with GitHub to load your repositories and pull requests.
              </div>
            ) : (
              <div className="space-y-5">

                <Field label="Repository">
                  <select
                    value={selectedRepository}
                    onChange={(e) => {
                      setSelectedRepository(e.target.value);
                      setResult(null);
                      setPreparedReview(null);
                    }}
                    disabled={loadingRepositories}
                    className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-4 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                  >
                    <option value="">
                      {loadingRepositories
                        ? "Loading repositories..."
                        : "Select repository"}
                    </option>

                    {repositories.map((repository) => (
                      <option
                        key={repository.full_name}
                        value={repository.full_name}
                      >
                        {repository.full_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Pull request">
                  <select
                    value={selectedPullRequest}
                    onChange={(e) => {
                      setSelectedPullRequest(e.target.value);
                      setResult(null);
                      setPreparedReview(null);
                    }}
                    disabled={
                      !selectedRepository ||
                      loadingPullRequests
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-4 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                  >
                    <option value="">
                      {loadingPullRequests
                        ? "Loading pull requests..."
                        : "Select pull request"}
                    </option>

                    {pullRequests.map((pullRequest) => (
                      <option
                        key={pullRequest.number}
                        value={pullRequest.number}
                      >
                        #{pullRequest.number} — {pullRequest.title}
                      </option>
                    ))}
                  </select>
                </Field>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={
                    analyzing ||
                    loadingRepositories ||
                    loadingPullRequests ||
                    !selectedRepository ||
                    !selectedPullRequest
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 px-5 py-4 font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play size={18} />

                  {analyzing
                    ? "Preparing review..."
                    : "Analyze Pull Request"}
                </button>

                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* PREPARED PR-STYLE REVIEW */}
                {preparedReview && (
                  <PRReviewView review={preparedReview} />
                )}

                {/* NORMAL LIVE BACKEND REVIEW */}
                {result && (
                  <div className="space-y-5">

                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm font-medium text-orange-300">
                          Analysis summary
                        </span>

                        {highestSeverity && (
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClass(
                              highestSeverity
                            )}`}
                          >
                            Highest severity: {highestSeverity}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-zinc-300">
                        {result.summary}
                      </p>

                      <p className="mt-3 text-xs text-zinc-500">
                        {allFindings.length} finding
                        {allFindings.length === 1 ? "" : "s"}
                        {" "}across all analysis layers
                      </p>
                    </div>

                    <AnalysisSection
                      icon={BrainCircuit}
                      title="Future failure analysis"
                      description="Potential failure mechanisms grounded in the analyzed changes and repository context."
                      findings={predictions}
                    />

                    <AnalysisSection
                      icon={Shield}
                      title="Security analysis"
                      description="Security weaknesses identified in the analyzed changes."
                      findings={security}
                    />

                    <AnalysisSection
                      icon={Activity}
                      title="Testing analysis"
                      description="Meaningful test coverage gaps around changed behaviour."
                      findings={testing}
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                      <StatusCard
                        icon={BrainCircuit}
                        title="Future failures"
                        value={`${predictions.length} found`}
                      />

                      <StatusCard
                        icon={Shield}
                        title="Security"
                        value={`${security.length} finding${
                          security.length === 1 ? "" : "s"
                        }`}
                      />

                      <StatusCard
                        icon={Activity}
                        title="Testing"
                        value={`${testing.length} gap${
                          testing.length === 1 ? "" : "s"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-zinc-600">
            Review results are decision support. Engineers remain
            responsible for validating findings and merge decisions.
          </p>
        </div>
      </div>
    </section>
  );
}
