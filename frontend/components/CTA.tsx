export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-32">
      <div className="rounded-[40px] border border-orange-500/20 bg-[#111111]/90 p-20 text-center">
        <span className=" border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-300">
          Ready to Start?
        </span>

        <h2 className="mt-8 text-5xl font-black leading-tight">
          Predict Bugs
          <span className="text-orange-400"> Before Production</span>
        </h2>

        

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button className="rounded-xxl bg-orange-500 px-8 py-4 font-semibold transition hover:bg-orange-600">
            Get Started
          </button>

          <button className="rounded-xl border border-white/10 bg-[#181818] px-8 py-4 font-semibold transition hover:border-orange-500">
            View Demo
          </button>
        </div>
      </div>
    </section>
  );
}