export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center text-white px-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl font-bold font-[var(--font-syne)] text-[#FFD700]/20">404</div>
        <h2 className="text-xl font-semibold font-[var(--font-syne)]">Neuron not found</h2>
        <p className="text-sm text-gray-400">This neural pathway doesn&apos;t exist in the network.</p>
        <div className="flex gap-3 justify-center">
          <a
            href="/"
            className="px-5 py-2.5 rounded-lg bg-[#FFD700]/20 text-[#FFD700] text-sm font-medium border border-[#FFD700]/30 hover:bg-[#FFD700]/30 transition-colors"
          >
            Neural View
          </a>
          <a
            href="/quick-view"
            className="px-5 py-2.5 rounded-lg bg-white/5 text-gray-300 text-sm font-medium border border-white/10 hover:bg-white/10 transition-colors"
          >
            Quick View
          </a>
        </div>
      </div>
    </div>
  );
}
