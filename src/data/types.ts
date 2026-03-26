export type NodeCategory =
  | 'core'
  | 'about'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'education'
  | 'contact'
  | 'tools';

export type NodeLevel = 0 | 1 | 2 | 3 | 4;

export type NodeState = 'idle' | 'hovered' | 'active' | 'visited' | 'locked' | 'unlocking';

export interface NeuralNode {
  id: string;
  label: string;
  category: NodeCategory;
  level: NodeLevel;
  parentId: string | null;
  summary: string;
  description: string;
  metadata?: {
    date?: string;
    url?: string;
    image?: string;
    tags?: string[];
    stats?: Record<string, string>;
  };
  size?: number;
  isHidden: boolean;
  unlockCondition?: string;
}

export type ConnectionType = 'primary' | 'secondary' | 'cross-domain' | 'hidden';

export interface NeuralConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  strength: number;
  label?: string;
}

export interface NetworkData {
  nodes: NeuralNode[];
  connections: NeuralConnection[];
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  z: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  core: '#FFD700',
  about: '#00F0FF',
  skills: '#FF00E5',
  projects: '#4D7CFF',
  experience: '#00FF88',
  education: '#FFB800',
  contact: '#FFFFFF',
  tools: '#8B5CF6',
};

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  core: 'Core',
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  contact: 'Contact',
  tools: 'Tools',
};
