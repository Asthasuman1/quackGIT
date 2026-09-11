"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  BrainCircuit,
  Activity,
  CheckCircle,
  Play,
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import {
  getRepositories,
  getPullRequests,
  predictPullRequest,
} from "@/lib/api";

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
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" | string;
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
  "Predict future production failures",
  "Detect evidence-based security issues",
  "Identify meaningful testing gaps",
  "Explain exactly where and how to fix each finding",
];

const severityRank: Record<string, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1,
};

function severityClass(severity: string) {
  switch (severity) {
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
    location.function ? `function ${location.function}` : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <article className="rounded-2xl border border-white/10 bg-[#181818] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Finding {index + 1}
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
          Exactly where
        </p>

        <p className="mt-1 break-words text-sm text-zinc-200">
          {locationText}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <Detail
          label="What is wrong"
          value={finding.what_is_wrong}
        />

        <Detail
          label="Why it is wrong"
          value={finding.why_it_is_wrong}
        />

        <Detail
          label="Why it happens"
          value={finding.why_it_happens}
        />

        <Detail
          label="What it can cause"
          value={finding.what_it_can_cause}
        />

        {finding.time_horizon && (
          <Detail
            label="Time horizon"
            value={finding.time_horizon}
          />
        )}
      </div>

      <div className="mt-5 rounded-xl border border-green-500/15 bg-green-500/5 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-green-400">
          How to fix
        </p>

        <p className="mt-2 text-sm leading-6 text-zinc-300">
          {finding.how_to_fix || "No fix was provided."}
        </p>
      </div>
    </article>
  );
}

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

      <p className="mt-1 text-sm leading-6 text-zinc-400">
        {value}
      </p>
    </div>
  );
}

function AnalysisSection({
  icon: Icon,
  title,
  description,
  findings,
}: {
  icon: typeof BrainCircuit;
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
          <div className="rounded-xl border border-green-500/15 bg-green-500/5 p-4 text-sm text-green-300">
            No meaningful findings in this analysis layer.
          </div>
        )}
      </div>
    </section>
  );
}

export default function RepositoryAnalysis() {
  const {
    authenticated,
    loading: authLoading,
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

  const [loadingRepositories, setLoadingRepositories] =
    useState(false);

  const [loadingPullRequests, setLoadingPullRequests] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !authenticated) {
      return;
    }

    async function loadRepositories() {
      try {
        setLoadingRepositories(true);
        setError("");

        const data = await getRepositories();

        setRepositories(data);
        setSelectedRepository(
          data[0]?.full_name || ""
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load repositories"
        );
      } finally {
        setLoadingRepositories(false);
      }
    }

    loadRepositories();
  }, [authenticated, authLoading]);

  useEffect(() => {
    if (!selectedRepository) {
      setPullRequests([]);
      setSelectedPullRequest("");
      return;
    }

    async function loadPullRequests() {
      try {
        setLoadingPullRequests(true);
        setError("");
        setResult(null);

        const data = await getPullRequests(
          selectedRepository
        );

        setPullRequests(data);

        setSelectedPullRequest(
          data[0] ? String(data[0].number) : ""
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load pull requests"
        );
      } finally {
        setLoadingPullRequests(false);
      }
    }

    loadPullRequests();
  }, [selectedRepository]);

  async function handleAnalyze() {
    if (
      !selectedRepository ||
      !selectedPullRequest
    ) {
      setError(
        "Please select a repository and pull request."
      );
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setResult(null);

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
          (severityRank[b.severity] || 0) -
          (severityRank[a.severity] || 0)
      )[0].severity
    : null;

  return (
    <section
      id="repository-analysis"
      className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8"
    >
      <div className="grid items-start gap-12 lg:grid-cols-2">
        {/* Left information panel */}
        <div>
          <span className="inline-block border border-orange-500/30 bg-orange-500/10 px-5 py-2.5 text-base font-medium text-orange-300">
            Live Repository Analysis
          </span>

          <h2 className="mt-8 text-5xl font-black leading-tight tracking-[-0.04em] sm:text-6xl">
            AI Understands Your Repository
            <span className="text-orange-400">
              {" "}
              Before It Fails
            </span>
          </h2>

          <p className="mt-8 max-w-xl text-xl leading-9 text-zinc-400">
            Analyze pull requests with three
            evidence-based layers: future failures,
            security, and testing. Every meaningful
            finding explains exactly where the
            problem is and how to fix it.
          </p>

          <div className="mt-10 space-y-5">
            {checklist.map((item) => (
              <div
                key={item}
                className="flex items-center gap-5"
              >
                <CheckCircle
                  className="shrink-0 text-green-400"
                  size={24}
                />

                <span className="text-lg text-zinc-300">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-[#111111] p-5">
  <div className="flex items-start gap-3">
    <div className="mt-0.5 rounded-lg border border-orange-500/20 bg-orange-500/10 p-2">
      <BrainCircuit
        size={18}
        className="text-orange-400"
      />
    </div>

    <div>
      <h3 className="font-semibold text-white">
        Use quackGIT directly in VS Code
      </h3>

      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Analyze the file you are currently editing without
        leaving your editor.
      </p>
    </div>
  </div>

  <div className="mt-4 space-y-3 text-sm text-zinc-300">
    <div className="flex gap-3">
      <span className="font-semibold text-orange-400">
        1.
      </span>
      <span>
        Open a source file in VS Code.
      </span>
    </div>

    <div className="flex gap-3">
      <span className="font-semibold text-orange-400">
        2.
      </span>
      <span>
        Open the Command Palette with{" "}
        <code className="rounded bg-white/5 px-1.5 py-0.5 text-orange-300">
          Ctrl+Shift+P
        </code>{" "}
        and choose the quackGIT analysis command.
      </span>
    </div>

    <div className="flex gap-3">
      <span className="font-semibold text-orange-400">
        3.
      </span>
      <span>
        Run Future Failure, Security, or Testing Analysis
        on the current file.
      </span>
    </div>

    <div className="flex gap-3">
      <span className="font-semibold text-orange-400">
        4.
      </span>
      <span>
        Review the findings, exact locations, reasons,
        consequences, severity, and recommended fixes
        directly in VS Code.
      </span>
    </div>
  </div>

  <div className="mt-4 rounded-xl border border-orange-500/10 bg-orange-500/5 p-3">
    <p className="text-xs leading-5 text-zinc-400">
      <span className="font-semibold text-orange-300">
        Tip:
      </span>{" "}
      Use VS Code analysis while writing code, then use
      Repository Analysis here to review the complete pull
      request before merging.
    </p>
  </div>
</div>

          {!authLoading && !authenticated && (
            <div className="mt-10 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
              <p className="font-semibold text-white">
                Connect GitHub to analyze your
                repositories.
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Your repository and pull request
                data stays behind your GitHub
                authentication.
              </p>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "https://quackgit.onrender.com/auth/github/login";
                }}
                className="mt-4 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-black hover:bg-orange-400"
              >
                Connect GitHub
              </button>
            </div>
          )}
        </div>

        {/* Analysis panel */}
        <div>
          <div className="rounded-[28px] border border-white/10 bg-[#111111] p-6 sm:p-8">
            {authLoading ? (
              <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 text-zinc-400">
                Checking authentication...
              </div>
            ) : !authenticated ? (
              <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 text-zinc-400">
                Sign in with GitHub to load
                repositories and pull requests.
              </div>
            ) : (
              <div className="space-y-5">
                <Field label="Repository">
                  <select
                    value={selectedRepository}
                    onChange={(e) =>
                      setSelectedRepository(
                        e.target.value
                      )
                    }
                    disabled={loadingRepositories}
                    className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-4 text-white outline-none focus:border-orange-500/50"
                  >
                    <option value="">
                      {loadingRepositories
                        ? "Loading repositories..."
                        : "Select repository"}
                    </option>

                    {repositories.map(
                      (repository) => (
                        <option
                          key={repository.full_name}
                          value={repository.full_name}
                        >
                          {repository.full_name}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Pull Request">
                  <select
                    value={selectedPullRequest}
                    onChange={(e) =>
                      setSelectedPullRequest(
                        e.target.value
                      )
                    }
                    disabled={
                      !selectedRepository ||
                      loadingPullRequests
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-4 text-white outline-none focus:border-orange-500/50"
                  >
                    <option value="">
                      {loadingPullRequests
                        ? "Loading pull requests..."
                        : "Select pull request"}
                    </option>

                    {pullRequests.map(
                      (pullRequest) => (
                        <option
                          key={pullRequest.number}
                          value={pullRequest.number}
                        >
                          #{pullRequest.number} —{" "}
                          {pullRequest.title}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={
                    analyzing ||
                    !selectedRepository ||
                    !selectedPullRequest
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 px-5 py-4 font-semibold text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play size={18} />

                  {analyzing
                    ? "Analyzing PR..."
                    : "Analyze Pull Request"}
                </button>

                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {result && (
                  <div className="space-y-5">
                    {/* Summary */}
                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm font-medium text-orange-300">
                          Analysis Summary
                        </span>

                        {highestSeverity && (
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClass(
                              highestSeverity
                            )}`}
                          >
                            Highest severity:{" "}
                            {highestSeverity}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-zinc-300">
                        {result.summary}
                      </p>

                      <p className="mt-3 text-xs text-zinc-500">
                        {allFindings.length}{" "}
                        meaningful finding
                        {allFindings.length === 1
                          ? ""
                          : "s"}{" "}
                        across all analysis layers
                      </p>
                    </div>

                    {/* Future Failure */}
                    <AnalysisSection
                      icon={BrainCircuit}
                      title="Future Failure Analysis"
                      description="Code-grounded failure mechanisms that may surface later in production."
                      findings={predictions}
                    />

                    {/* Security */}
                    <AnalysisSection
                      icon={Shield}
                      title="Security Analysis"
                      description="Evidence-based security weaknesses found in the analyzed changes."
                      findings={security}
                    />

                    {/* Testing */}
                    <AnalysisSection
                      icon={Activity}
                      title="Testing Analysis"
                      description="Meaningful missing or weak tests supported by the code being analyzed."
                      findings={testing}
                    />

                    {/* Status */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <StatusCard
                        icon={BrainCircuit}
                        title="Future Failures"
                        value={`${predictions.length} found`}
                      />

                      <StatusCard
                        icon={Shield}
                        title="Security"
                        value={`${security.length} finding${
                          security.length === 1
                            ? ""
                            : "s"
                        }`}
                      />

                      <StatusCard
                        icon={Activity}
                        title="Testing"
                        value={`${testing.length} gap${
                          testing.length === 1
                            ? ""
                            : "s"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
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

function StatusCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof BrainCircuit;
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