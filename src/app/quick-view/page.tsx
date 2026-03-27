import { nodes } from '@/data/nodes';
import { CATEGORY_COLORS } from '@/data/types';

export const metadata = {
  title: 'Nency Sojitra — Portfolio (Quick View)',
  description: 'Skills, projects, experience, and education of Nency Sojitra.',
};

export default function QuickViewPage() {
  const origin = nodes.find((n) => n.id === 'origin')!;
  const getChildren = (parentId: string) =>
    nodes.filter((n) => n.parentId === parentId && !n.isHidden);

  const sections = [
    { id: 'about', label: 'About Me', nodes: getChildren('about') },
    { id: 'skills', label: 'Skills', nodes: getChildren('skills') },
    { id: 'projects', label: 'Projects', nodes: getChildren('projects') },
    { id: 'experience', label: 'Experience', nodes: getChildren('experience') },
    { id: 'education', label: 'Education', nodes: getChildren('education') },
    { id: 'contact', label: 'Contact', nodes: getChildren('contact') },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#0A0A1A]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
            <span className="text-sm font-semibold text-white/70 font-[var(--font-syne)] tracking-wide">
              Neural Nexus
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Section nav (desktop) */}
            <nav className="hidden md:flex items-center gap-1 mr-2">
              {sections.map((s) => {
                const parentNode = nodes.find((n) => n.id === s.id)!;
                const color = CATEGORY_COLORS[parentNode.category];
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="px-2.5 py-1 text-[11px] text-gray-500 hover:text-white rounded-md hover:bg-white/[0.04] transition-all"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: color }} />
                    {s.label}
                  </a>
                );
              })}
            </nav>
            <a
              href="/"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700]/20 border border-[#FFD700]/20 transition-all"
            >
              Neural View
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-20">
        {/* Hero */}
        <section className="text-center space-y-5 py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/8 border border-[#FFD700]/15 text-[#FFD700] text-xs font-medium mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
            Portfolio
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold font-[var(--font-syne)] tracking-tight">
            {origin.label}
          </h1>
          <p className="text-lg text-gray-400 font-medium">{origin.summary}</p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {origin.description}
          </p>
        </section>

        {/* Sections */}
        {sections.map((section) => {
          const parentNode = nodes.find((n) => n.id === section.id)!;
          const color = CATEGORY_COLORS[parentNode.category];

          return (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              {/* Section header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                />
                <h2 className="text-2xl font-bold font-[var(--font-syne)] tracking-tight">
                  {section.label}
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-8 pl-[22px]">{parentNode.description}</p>

              {/* Cards grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {section.nodes.map((node) => {
                  const nodeColor = CATEGORY_COLORS[node.category];
                  return (
                    <div
                      key={node.id}
                      className="group bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-300"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: nodeColor }}
                        />
                        <div className="min-w-0">
                          <h3
                            className="text-[15px] font-semibold group-hover:brightness-110 transition-all"
                            style={{ color: nodeColor }}
                          >
                            {node.label}
                          </h3>
                          <p className="text-[11px] text-gray-600 mt-0.5">{node.summary}</p>
                        </div>
                      </div>
                      <p className="text-[13px] text-gray-400 leading-relaxed pl-[18px]">
                        {node.description}
                      </p>

                      {node.metadata?.tags && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pl-[18px]">
                          {node.metadata.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-[10px] rounded-md font-medium"
                              style={{
                                borderColor: `${nodeColor}20`,
                                color: `${nodeColor}bb`,
                                backgroundColor: `${nodeColor}08`,
                                border: `1px solid ${nodeColor}15`,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {node.metadata?.stats && (
                        <div className="grid grid-cols-2 gap-2 mt-3 pl-[18px]">
                          {Object.entries(node.metadata.stats).map(([key, value]) => (
                            <div key={key} className="text-[11px]">
                              <span className="text-gray-600">{key}: </span>
                              <span className="text-gray-300 font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {node.metadata?.url && (
                        <div className="mt-3 pl-[18px]">
                          <a
                            href={node.metadata.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline transition-colors"
                            style={{ color: nodeColor }}
                          >
                            {node.metadata.url.includes('mailto:')
                              ? node.metadata.url.replace('mailto:', '')
                              : 'View Project'}
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M3 7L7 3M7 3H4M7 3V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tools under skills */}
              {section.id === 'skills' && (
                <div className="mt-8">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-[0.1em] mb-3 pl-[22px]">
                    Tools & Technologies
                  </h3>
                  <div className="flex flex-wrap gap-2 pl-[22px]">
                    {nodes
                      .filter((n) => n.category === 'tools' && !n.isHidden)
                      .map((tool) => (
                        <span
                          key={tool.id}
                          className="px-3 py-1.5 text-xs rounded-lg font-medium"
                          style={{
                            border: `1px solid ${CATEGORY_COLORS.tools}18`,
                            color: CATEGORY_COLORS.tools,
                            backgroundColor: `${CATEGORY_COLORS.tools}08`,
                          }}
                        >
                          {tool.label}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] px-6 py-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FFD700]/40" />
            <span className="text-xs text-gray-600 font-[var(--font-syne)]">Neural Nexus</span>
          </div>
          <p className="text-xs text-gray-600">
            Built with Next.js, React Three Fiber & TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
}
