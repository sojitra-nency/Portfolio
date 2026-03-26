'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useUIStore } from '@/store/useUIStore';
import { CATEGORY_COLORS } from '@/data/types';

export default function DetailPanel() {
  const activeNodeId = useNetworkStore((s) => s.activeNodeId);
  const getNodeById = useNetworkStore((s) => s.getNodeById);
  const deactivateNode = useNetworkStore((s) => s.deactivateNode);
  const isMobile = useUIStore((s) => s.isMobile);

  const node = activeNodeId ? getNodeById(activeNodeId) : null;

  if (!node) return null;

  const color = CATEGORY_COLORS[node.category];

  return (
    <AnimatePresence>
      <motion.div
        key={node.id}
        initial={isMobile ? { y: '100%' } : { x: '100%' }}
        animate={isMobile ? { y: 0 } : { x: 0 }}
        exit={isMobile ? { y: '100%' } : { x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`
          fixed z-50
          ${isMobile
            ? 'bottom-0 left-0 right-0 max-h-[60vh] rounded-t-2xl'
            : 'top-0 right-0 w-[400px] h-full'
          }
          bg-[#12121F]/95 backdrop-blur-xl
          border-l border-white/5
          overflow-y-auto
        `}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-5 border-b border-white/5"
          style={{ background: 'linear-gradient(180deg, #12121F 0%, transparent 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
              />
              <h2 className="text-lg font-semibold text-white font-display">
                {node.label}
              </h2>
            </div>
            <button
              onClick={() => deactivateNode()}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              aria-label="Close panel"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">{node.summary}</p>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{node.description}</p>
          </div>

          {/* Tags */}
          {node.metadata?.tags && node.metadata.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Technologies</h3>
              <div className="flex flex-wrap gap-2">
                {node.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs rounded-full border"
                    style={{
                      borderColor: `${color}33`,
                      color: color,
                      backgroundColor: `${color}10`,
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
            <div>
              <a
                href={node.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                  border: `1px solid ${color}33`,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
            </div>
          )}

          {/* Stats */}
          {node.metadata?.stats && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(node.metadata.stats).map(([key, value]) => (
                  <div key={key} className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{key}</p>
                    <p className="text-sm text-white font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category badge */}
          <div className="pt-3 border-t border-white/5">
            <span
              className="text-xs px-2 py-1 rounded"
              style={{ color: `${color}aa`, backgroundColor: `${color}10` }}
            >
              {node.category.charAt(0).toUpperCase() + node.category.slice(1)} &middot; Level {node.level}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
