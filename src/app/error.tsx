'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center text-white px-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 mx-auto rounded-full border border-red-500/30 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold font-[var(--font-syne)]">Neural pathway disrupted</h2>
        <p className="text-sm text-gray-400">Something went wrong while rendering the experience.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-[#FFD700]/20 text-[#FFD700] text-sm font-medium border border-[#FFD700]/30 hover:bg-[#FFD700]/30 transition-colors"
          >
            Try again
          </button>
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
