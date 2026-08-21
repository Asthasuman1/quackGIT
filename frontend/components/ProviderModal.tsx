"use client";

import { motion } from "framer-motion";

interface ProviderModalProps {
  open: boolean;
  onClose: () => void;
  loginWithGitHub: () => void;
  loginWithGitLab: () => void;
}

export default function ProviderModal({
  open,
  onClose,
  loginWithGitHub,
  loginWithGitLab,
}: ProviderModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 10,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-7 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-7 text-center">
          <h2 className="text-2xl font-bold text-white">
            Choose your Git provider
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            Continue with GitHub or GitLab.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={loginWithGitHub}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-semibold text-white transition hover:bg-white/[0.12]"
          >
            Continue with GitHub
          </button>

          <button
            type="button"
            onClick={loginWithGitLab}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-semibold text-white transition hover:bg-white/[0.12]"
          >
            Continue with GitLab
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full text-sm text-zinc-500 transition hover:text-white"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}