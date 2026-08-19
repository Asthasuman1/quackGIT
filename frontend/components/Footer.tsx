import { GitBranch, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div>
          <h2 className="text-2xl font-black">
            AI <span className="text-orange-400">Commit</span>
          </h2>

          <p className="mt-2 text-xl text-zinc-500">
            Predicting tomorrow's bugs, today.
          </p>
        </div>

        <div className="flex items-center gap-6 text-zinc-400">
          <a href="#features" className="hover:text-orange-400">
            Features
          </a>

          <a href="#workflow" className="hover:text-orange-400">
            Workflow
          </a>

          <a href="#faq" className="hover:text-orange-400">
            FAQ
          </a>
        </div>

        <div className="flex gap-4">
          <GitBranch className="cursor-pointer hover:text-orange-400" />
          <Mail className="cursor-pointer hover:text-orange-400" />
        </div>
      </div>
    </footer>
  );
}