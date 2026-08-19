"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { motion } from "framer-motion";
import {
  GitBranch,
  Shield,
  BrainCircuit,
  Activity,
  AlertTriangle,
  CheckCircle,
  Play,
} from "lucide-react";

import Reveal from "./animations/Reveal";
import TiltCard from "./TiltCard";
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

type Prediction = {
  risk: string;
  probability: number;
  time_horizon: string;
  reason: string;
  recommendation: string;
};

type PredictionResult = {
  summary: string;
  predictions: Prediction[];
};

const checklist = [
  "Analyze every commit automatically",
  "Detect hidden security issues",
  "Predict future production failures",
  "Generate AI-powered review suggestions",
];

const aiAgents = ["Gemini", "OpenAI", "Claude", "DeepSeek"];

export default function RepositoryAnalysis() {
  const { authenticated, loading: authLoading } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);

  const [selectedRepository, setSelectedRepository] = useState("");
  const [selectedPullRequest, setSelectedPullRequest] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("Gemini");

  const [result, setResult] = useState<PredictionResult | null>(null);

  const [loadingRepositories, setLoadingRepositories] = useState(false);
  const [loadingPullRequests, setLoadingPullRequests] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
  // Never load repositories while authentication is still being checked.
  if (authLoading) {
    return;
  }

  // Logged out = completely empty repository state.
  if (!authenticated) {
    setRepositories([]);
    setPullRequests([]);
    setSelectedRepository("");
    setSelectedPullRequest("");
    setResult(null);
    setError("");
    setLoadingRepositories(false);
    return;
  }

  async function loadRepositories() {
    try {
      setLoadingRepositories(true);
      setError("");

      const data = await getRepositories();

      setRepositories(data);

      if (data.length > 0) {
        setSelectedRepository(data[0].full_name);
      } else {
        setSelectedRepository("");
      }
    } catch (err) {
      setRepositories([]);
      setSelectedRepository("");

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

        const data = await getPullRequests(selectedRepository);
        setPullRequests(data);

        if (data.length > 0) {
          setSelectedPullRequest(String(data[0].number));
        } else {
          setSelectedPullRequest("");
        }
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
    if (!selectedRepository || !selectedPullRequest) {
      setError("Please select a repository and pull request.");
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

  const highestRisk =
    result && result.predictions.length > 0
      ? Math.max(
          ...result.predictions.map(
            (prediction) => prediction.probability
          )
        )
      : null;

  return (
    <section
      id="repository-analysis"
      className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8"
    >
      <div className="grid items-center gap-16 lg:grid-cols-2">
        {/* Left */}
        <Reveal>
          <div>
            <span className="border border-orange-500/30 bg-orange-500/10 px-5 py-2.5 text-base font-medium text-orange-300">
              Live Repository Analysis
            </span>

            <h2 className="mt-8 text-5xl font-black leading-tight tracking-[-0.04em] sm:text-6xl">
              AI Understands Your Repository
              <span className="text-orange-400">
                {" "}
                Commit by Commit
              </span>
            </h2>

            <p className="mt-8 max-w-xl text-xl leading-9 text-zinc-400">
              quackGIT continuously scans commits, detects risky code
              patterns, evaluates repository health, finds security issues,
              and predicts production failures before deployment.
            </p>

            <div className="mt-12 space-y-6">
              {checklist.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{
                    opacity: 0,
                    x: -20,
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.08,
                  }}
                  whileHover={{
                    x: 8,
                  }}
                  className="flex items-center gap-5"
                >
                  <CheckCircle
                    className="text-green-400"
                    size={24}
                  />

                  <span className="text-lg text-zinc-300">
                    {item}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Right */}
        <Reveal delay={0.15}>
          <TiltCard>
            <motion.div
              whileHover={{
                y: -10,
                scale: 1.015,
              }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 20,
              }}
              className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[#111111]/80 p-8 backdrop-blur-xl"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(249,115,22,.18), transparent 70%)",
                }}
              />

              <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-transparent transition-all duration-500 group-hover:border-orange-500/40" />

              <div className="relative space-y-5">
                {/* Repository */}
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Repository
                  </label>

                  <select
                    value={selectedRepository}
                    onChange={(event) =>
                      setSelectedRepository(event.target.value)
                    }
                    disabled={loadingRepositories}
                    className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-4 text-white outline-none transition focus:border-orange-500/50"
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
                </div>

                {/* Pull Request */}
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Pull Request
                  </label>

                  <select
                    value={selectedPullRequest}
                    onChange={(event) =>
                      setSelectedPullRequest(event.target.value)
                    }
                    disabled={
                      !selectedRepository ||
                      loadingPullRequests
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-4 text-white outline-none transition focus:border-orange-500/50"
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
                </div>

                {/* AI Agent */}
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    AI Agent
                  </label>

                  <select
                    value={selectedAgent}
                    onChange={(event) =>
                      setSelectedAgent(event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-4 text-white outline-none transition focus:border-orange-500/50"
                  >
                    {aiAgents.map((agent) => (
                      <option key={agent} value={agent}>
                        {agent}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Analyze */}
                <motion.button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={
                    analyzing ||
                    !selectedRepository ||
                    !selectedPullRequest
                  }
                  whileHover={{
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 px-5 py-4 font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play size={18} />

                  {analyzing
                    ? "Analyzing PR..."
                    : "Analyze Pull Request"}
                </motion.button>

                {/* Error */}
                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Result summary */}
                {result && (
                  <div className="space-y-4">
    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-orange-300">
          Future Failure Prediction
        </span>

        {highestRisk !== null && (
          <span className="font-semibold text-orange-400">
            Highest risk: {Math.round(highestRisk * 100)}%
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-300">
        {result.summary}
      </p>

      <p className="mt-3 text-xs text-zinc-500">
        {result.predictions.length} future risk
        {result.predictions.length === 1 ? "" : "s"} identified
      </p>
    </div>

    {result.predictions.map((prediction, index) => {
      const probability = Math.round(
        prediction.probability * 100
      );

      return (
        <motion.div
          key={`${prediction.risk}-${index}`}
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: index * 0.08,
          }}
          className="rounded-2xl border border-white/10 bg-[#181818] p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className={
                  probability >= 80
                    ? "mt-1 text-red-400"
                    : probability >= 50
                      ? "mt-1 text-orange-400"
                      : "mt-1 text-yellow-400"
                }
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Risk {index + 1}
                </p>

                <h4 className="mt-1 text-base font-semibold leading-6 text-white">
                  {prediction.risk}
                </h4>
              </div>
            </div>

            <span
              className={
                probability >= 80
                  ? "shrink-0 font-bold text-red-400"
                  : probability >= 50
                    ? "shrink-0 font-bold text-orange-400"
                    : "shrink-0 font-bold text-yellow-400"
              }
            >
              {probability}%
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-xs text-zinc-500">
                Time Horizon
              </p>

              <p className="mt-1 text-sm font-medium text-zinc-200">
                {prediction.time_horizon}
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-xs text-zinc-500">
                Probability
              </p>

              <p className="mt-1 text-sm font-medium text-zinc-200">
                {probability}% likelihood
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Why this could happen
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {prediction.reason}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-green-500/10 bg-green-500/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-green-400">
              Recommendation
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {prediction.recommendation}
            </p>
          </div>
        </motion.div>
      );
    })}
  </div>
)}

                {/* Existing-style status cards */}
                <div className="space-y-5 pt-2">
                  <StatusCard
                    icon={GitBranch}
                    title="Repository"
                    value={
                      selectedRepository
                        ? selectedRepository.split("/").pop() ||
                          selectedRepository
                        : "Not selected"
                    }
                    color="text-orange-400"
                  />

                  <StatusCard
                    icon={BrainCircuit}
                    title="AI Analysis"
                    value={
                      analyzing
                        ? "Running..."
                        : result
                          ? "Complete"
                          : "Ready"
                    }
                    color="text-orange-400"
                  />

                  <StatusCard
                    icon={Shield}
                    title="Security"
                    value={
                      result
                        ? "Analyzed"
                        : "—"
                    }
                    color="text-green-400"
                  />

                  <StatusCard
                    icon={Activity}
                    title="Performance"
                    value={
                      result
                        ? "Analyzed"
                        : "—"
                    }
                    color="text-orange-400"
                  />

                  <StatusCard
                    icon={AlertTriangle}
                    title="Predicted Failures"
                    value={
                      result
                        ? `${result.predictions.length} Found`
                        : "—"
                    }
                    color="text-red-400"
                  />
                </div>
              </div>

              {/* Health */}
              <div className="relative mt-10">
                <div className="mb-3 flex justify-between text-base">
                  <span className="text-zinc-400">
                    Prediction Confidence
                  </span>

                  <span className="font-semibold text-white">
                    {highestRisk !== null
                      ? `${Math.round(highestRisk * 100)}%`
                      : "—"}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    animate={{
                      width:
                        highestRisk !== null
                          ? `${Math.round(highestRisk * 100)}%`
                          : "0%",
                    }}
                    transition={{
                      duration: 1.2,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300"
                  />
                </div>

                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Gemini prediction analysis
                  </span>

                  <span className="font-medium text-orange-400">
                    {result ? "Complete" : "Waiting"}
                  </span>
                </div>
              </div>
            </motion.div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  );
}

function StatusCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: typeof GitBranch;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -6,
        scale: 1.02,
      }}
      transition={{
        type: "spring",
        stiffness: 320,
      }}
      className="flex items-center justify-between rounded-[24px] border border-white/10 bg-[#181818] p-6"
    >
      <div className="flex items-center gap-4">
        <Icon
          size={24}
          className={color}
        />

        <span className="text-lg font-medium">
          {title}
        </span>
      </div>

      <span className={`font-semibold ${color}`}>
        {value}
      </span>
    </motion.div>
  );
}