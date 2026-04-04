// ---------------------------------------------------------------------------
// Skill Cloud — Constants
// ---------------------------------------------------------------------------

export const SKILL_CATEGORY_COLORS: Record<string, string> = {
  'skill-langs': '#FF00E5',       // magenta
  'skill-db': '#00F0FF',          // cyan
  'skill-ai': '#A855F7',          // purple
  'skill-integrations': '#FF8A00', // orange
  'skill-devops': '#00FF88',      // green
  'skill-soft': '#4D7CFF',        // blue
};

// Skill pill data interface
export interface SkillPillData {
  id: string;
  label: string;
  categoryId: string;
  categoryLabel: string;
  color: string;
  size: 'sm' | 'md' | 'lg';
}
