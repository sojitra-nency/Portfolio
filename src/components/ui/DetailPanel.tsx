'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useUIStore } from '@/store/useUIStore';
import { CATEGORY_COLORS } from '@/data/types';

export default function DetailPanel() {
  const activeNodeId = useNetworkStore((s) => s.activeNodeId);
  const getNodeById = useNetworkStore((s) => s.getNodeById);
  const getChildNodes = useNetworkStore((s) => s.getChildNodes);
  const activateNode = useNetworkStore((s) => s.activateNode);
  const deactivateNode = useNetworkStore((s) => s.deactivateNode);
  const isMobile = useUIStore((s) => s.isMobile);

  const node = activeNodeId ? getNodeById(activeNodeId) : null;
  const children = activeNodeId ? getChildNodes(activeNodeId) : [];

  return (
    <AnimatePresence mode="wait">
      {node && (
        <motion.div
          key={node.id}
          initial={isMobile ? { y: '100%' } : { x: '100%', opacity: 0.5 }}
          animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
          exit={isMobile ? { y: '100%' } : { x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className={`
            fixed z-50
            ${isMobile
              ? 'bottom-0 left-0 right-0 max-h-[65vh] rounded-t-2xl'
              : 'top-0 right-0 w-[380px] h-full'
            }
            bg-[#0e0e1a]/95 backdrop-blur-2xl
            border-l border-white/[0.06]
            overflow-y-auto
          `}
        >
          {/* Mobile drag handle */}
          {isMobile && (
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-white/10" />
            </div>
          )}

          {/* Header */}
          <div className="sticky top-0 z-10 px-5 pt-5 pb-4 border-b border-white/[0.04] bg-[#0e0e1a]/80 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: CATEGORY_COLORS[node.category],
                    boxShadow: `0 0 12px ${CATEGORY_COLORS[node.category]}60`,
                  }}
                />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white font-display truncate">
                    {node.label}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">{node.summary}</p>
                </div>
              </div>
              <button
                onClick={() => deactivateNode()}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-gray-500 hover:text-white shrink-0"
                aria-label="Close panel"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-5 space-y-5">
            {/* Description */}
            <div>
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.1em] mb-2">Description</h3>
              <p className="text-[13px] text-gray-300 leading-relaxed">{node.description}</p>
            </div>

            {/* Tags */}
            {node.metadata?.tags && node.metadata.tags.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.1em] mb-2.5">Technologies</h3>
                <div className="flex flex-wrap gap-1.5">
                  {node.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-[11px] rounded-md font-medium"
                      style={{
                        color: CATEGORY_COLORS[node.category],
                        backgroundColor: `${CATEGORY_COLORS[node.category]}10`,
                        border: `1px solid ${CATEGORY_COLORS[node.category]}18`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Link */}
            {node.metadata?.url && (
              <a
                href={node.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-125 group"
                style={{
                  backgroundColor: `${CATEGORY_COLORS[node.category]}12`,
                  color: CATEGORY_COLORS[node.category],
                  border: `1px solid ${CATEGORY_COLORS[node.category]}20`,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:translate-x-0.5 transition-transform">
                  <path
                    d="M5.5 2.5H3.5C2.948 2.5 2.5 2.948 2.5 3.5V10.5C2.5 11.052 2.948 11.5 3.5 11.5H10.5C11.052 11.5 11.5 11.052 11.5 10.5V8.5M8.5 2.5H11.5V5.5M11.5 2.5L6.5 7.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {node.metadata.url.includes('mailto:') ? 'Send Email' : 'View Project'}
              </a>
            )}

            {/* Stats */}
            {node.metadata?.stats && (
              <div>
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.1em] mb-2.5">Details</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(node.metadata.stats).map(([key, value]) => (
                    <div key={key} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{key}</p>
                      <p className="text-sm text-white font-medium mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Child nodes */}
            {children.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.1em] mb-2.5">
                  Connected Neurons ({children.length})
                </h3>
                <div className="space-y-1">
                  {children.map((child) => {
                    const childColor = CATEGORY_COLORS[child.category];
                    return (
                      <button
                        key={child.id}
                        onClick={() => activateNode(child.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: childColor, boxShadow: `0 0 6px ${childColor}40` }}
                        />
                        <span className="text-xs text-gray-400 group-hover:text-white transition-colors truncate">
                          {child.label}
                        </span>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
                          <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category badge */}
            <div className="pt-3 border-t border-white/[0.04]">
              <span
                className="text-[10px] px-2.5 py-1 rounded-md font-medium"
                style={{
                  color: `${CATEGORY_COLORS[node.category]}90`,
                  backgroundColor: `${CATEGORY_COLORS[node.category]}08`,
                }}
              >
                {node.category.charAt(0).toUpperCase() + node.category.slice(1)} &middot; Level {node.level}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
