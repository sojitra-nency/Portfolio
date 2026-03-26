import { nodes } from '@/data/nodes';
import { CATEGORY_COLORS } from '@/data/types';

export const metadata = {
  title: 'Nency Sojitra — Portfolio (Quick View)',
  description: 'Skills, projects, experience, and education of Nency Sojitra.',
};

export default function QuickViewPage() {
  const origin = nodes.find((n) => n.id === 'origin')!;
  const getChildren = (parentId: string) => nodes.filter((n) => n.parentId === parentId && !n.isHidden);

  const sections = [
    { id: 'about', label: 'About Me', nodes: getChildren('about') },
    { id: 'skills', label: 'Skills', nodes: getChildren('skills') },
    { id: 'projects', label: 'Projects', nodes: getChildren('projects') },
    { id: 'experience', label: 'Experience', nodes: getChildren('experience') },
    { id: 'education', label: 'Education', nodes: getChildren('education') },
    { id: 'contact', label: 'Contact', nodes: getChildren('contact') },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white overflow-auto">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
            <span className="text-sm font-semibold text-white/80 font-[var(--font-syne)]">
              Neural Nexus
            </span>
          </div>
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
          >
            Neural View
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold font-[var(--font-syne)]">{origin.label}</h1>
          <p className="text-lg text-gray-400">{origin.summary}</p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">{origin.description}</p>
        </section>

        {/* Sections */}
        {sections.map((section) => {
          const parentNode = nodes.find((n) => n.id === section.id)!;
          const color = CATEGORY_COLORS[parentNode.category];

          return (
            <section key={section.id} id={section.id}>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}50` }}
                />
                <h2 className="text-2xl font-bold font-[var(--font-syne)]">{section.label}</h2>
              </div>
              <p className="text-sm text-gray-400 mb-6">{parentNode.description}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                {section.nodes.map((node) => {
                  const nodeColor = CATEGORY_COLORS[node.category];
                  return (
                    <div
                      key={node.id}
                      className="bg-white/[0.03] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
                    >
                      <h3 className="text-base font-semibold mb-1" style={{ color: nodeColor }}>
                        {node.label}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">{node.summary}</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{node.description}</p>

                      {node.metadata?.tags && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {node.metadata.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-[10px] rounded-full border"
                              style={{
                                borderColor: `${nodeColor}30`,
                                color: `${nodeColor}cc`,
                                backgroundColor: `${nodeColor}08`,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {node.metadata?.url && (
                        <a
                          href={node.metadata.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-xs hover:underline"
                          style={{ color: nodeColor }}
                        >
                          {node.metadata.url.includes('mailto:') ? node.metadata.url.replace('mailto:', '') : 'View →'}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Show tools under skills */}
              {section.id === 'skills' && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Tools & Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {nodes
                      .filter((n) => n.category === 'tools' && !n.isHidden)
                      .map((tool) => (
                        <span
                          key={tool.id}
                          className="px-3 py-1.5 text-xs rounded-lg border"
                          style={{
                            borderColor: `${CATEGORY_COLORS.tools}25`,
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
      <footer className="border-t border-white/5 px-6 py-8 text-center">
        <p className="text-xs text-gray-600">
          Built with Next.js, React Three Fiber & TypeScript
        </p>
        <p className="text-xs text-gray-700 mt-1">
          Neural Nexus — A living neural network portfolio
        </p>
      </footer>
    </div>
  );
}
