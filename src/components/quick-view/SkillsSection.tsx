'use client';

import { useState, useMemo, useEffect } from 'react';
import SectionHeading from '@/components/quick-view/SectionHeading';
import CategoryFilterBar from './CategoryFilterBar';
import SkillCloud from './SkillCloud';
import {
  SKILL_CATEGORY_COLORS,
  type SkillPillData,
} from './skillCloudConstants';
import { useReducedMotion } from '@/lib/animations';
import type { NeuralNode } from '@/data/types';

interface SkillsSectionProps {
  nodes: NeuralNode[];
  allTools: NeuralNode[];
  color: string;
  subtitle: string;
}

export default function SkillsSection({
  nodes,
  allTools,
  color,
  subtitle,
}: SkillsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Build a set of tool labels for size detection
  const toolLabels = useMemo(
    () => new Set(allTools.map((t) => t.label)),
    [allTools],
  );

  // Flatten all skill nodes' tags into SkillPillData[]
  const pills: SkillPillData[] = useMemo(() => {
    const result: SkillPillData[] = [];
    const seen = new Set<string>();

    for (const node of nodes) {
      const tags = node.metadata?.tags ?? [];
      const categoryColor =
        SKILL_CATEGORY_COLORS[node.id] || color;

      for (const tag of tags) {
        // Deduplicate across categories
        const key = `${node.id}::${tag}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const size: SkillPillData['size'] = toolLabels.has(tag)
          ? 'lg'
          : tag.length <= 10
            ? 'md'
            : 'sm';

        result.push({
          id: key,
          label: tag,
          categoryId: node.id,
          categoryLabel: node.label,
          color: categoryColor,
          size,
        });
      }
    }
    return result;
  }, [nodes, toolLabels, color]);

  // Categories for the filter bar
  const categories = useMemo(
    () => nodes.map((n) => ({ id: n.id, label: n.label })),
    [nodes],
  );

  return (
    <section id="skills" className="scroll-mt-20">
      <SectionHeading title="Skills" subtitle={subtitle} color={color} />

      <CategoryFilterBar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <SkillCloud
        pills={pills}
        activeCategory={activeCategory}
        isMobile={isMobile}
        reducedMotion={reducedMotion}
      />
    </section>
  );
}
