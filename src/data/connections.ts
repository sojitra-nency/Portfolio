import { NeuralConnection } from './types';

export const connections: NeuralConnection[] = [
  // ─── Origin → Primary (Level 0 → 1) ───
  { id: 'c-origin-about', sourceId: 'origin', targetId: 'about', type: 'primary', strength: 1.0 },
  { id: 'c-origin-skills', sourceId: 'origin', targetId: 'skills', type: 'primary', strength: 1.0 },
  { id: 'c-origin-projects', sourceId: 'origin', targetId: 'projects', type: 'primary', strength: 1.0 },
  { id: 'c-origin-experience', sourceId: 'origin', targetId: 'experience', type: 'primary', strength: 1.0 },
  { id: 'c-origin-education', sourceId: 'origin', targetId: 'education', type: 'primary', strength: 1.0 },
  { id: 'c-origin-contact', sourceId: 'origin', targetId: 'contact', type: 'primary', strength: 1.0 },

  // ─── Skills → Sub-skills (Level 1 → 2) ───
  { id: 'c-skills-ml', sourceId: 'skills', targetId: 'skill-ml', type: 'primary', strength: 0.9 },
  { id: 'c-skills-dl', sourceId: 'skills', targetId: 'skill-dl', type: 'primary', strength: 0.9 },
  { id: 'c-skills-cv', sourceId: 'skills', targetId: 'skill-cv', type: 'primary', strength: 0.9 },
  { id: 'c-skills-ds', sourceId: 'skills', targetId: 'skill-ds', type: 'primary', strength: 0.8 },
  { id: 'c-skills-web', sourceId: 'skills', targetId: 'skill-web', type: 'primary', strength: 0.7 },
  { id: 'c-skills-prog', sourceId: 'skills', targetId: 'skill-prog', type: 'primary', strength: 0.8 },

  // ─── Sub-skills → Tools (Level 2 → 3) ───
  { id: 'c-dl-tf', sourceId: 'skill-dl', targetId: 'tool-tensorflow', type: 'secondary', strength: 0.9 },
  { id: 'c-dl-keras', sourceId: 'skill-dl', targetId: 'tool-keras', type: 'secondary', strength: 0.8 },
  { id: 'c-ml-sklearn', sourceId: 'skill-ml', targetId: 'tool-sklearn', type: 'secondary', strength: 0.9 },
  { id: 'c-ds-numpy', sourceId: 'skill-ds', targetId: 'tool-numpy', type: 'secondary', strength: 0.8 },
  { id: 'c-ds-pandas', sourceId: 'skill-ds', targetId: 'tool-pandas', type: 'secondary', strength: 0.8 },
  { id: 'c-ds-mpl', sourceId: 'skill-ds', targetId: 'tool-matplotlib', type: 'secondary', strength: 0.7 },
  { id: 'c-ds-sns', sourceId: 'skill-ds', targetId: 'tool-seaborn', type: 'secondary', strength: 0.6 },
  { id: 'c-web-django', sourceId: 'skill-web', targetId: 'tool-django', type: 'secondary', strength: 0.8 },
  { id: 'c-web-flask', sourceId: 'skill-web', targetId: 'tool-flask', type: 'secondary', strength: 0.7 },
  { id: 'c-web-mysql', sourceId: 'skill-web', targetId: 'tool-mysql', type: 'secondary', strength: 0.6 },
  { id: 'c-web-js', sourceId: 'skill-web', targetId: 'tool-js', type: 'secondary', strength: 0.7 },
  { id: 'c-prog-python', sourceId: 'skill-prog', targetId: 'tool-python', type: 'secondary', strength: 1.0 },
  { id: 'c-prog-cpp', sourceId: 'skill-prog', targetId: 'tool-cpp', type: 'secondary', strength: 0.7 },
  { id: 'c-prog-java', sourceId: 'skill-prog', targetId: 'tool-java', type: 'secondary', strength: 0.6 },
  { id: 'c-prog-git', sourceId: 'skill-prog', targetId: 'tool-git', type: 'secondary', strength: 0.8 },

  // ─── Projects → Parent (Level 1 → 2) ───
  { id: 'c-proj-cvd', sourceId: 'projects', targetId: 'proj-cv-detect', type: 'primary', strength: 0.9 },
  { id: 'c-proj-sent', sourceId: 'projects', targetId: 'proj-sentiment', type: 'primary', strength: 0.8 },
  { id: 'c-proj-dviz', sourceId: 'projects', targetId: 'proj-data-viz', type: 'primary', strength: 0.8 },
  { id: 'c-proj-web', sourceId: 'projects', targetId: 'proj-web-app', type: 'primary', strength: 0.7 },
  { id: 'c-proj-nn', sourceId: 'projects', targetId: 'proj-neural-nexus', type: 'primary', strength: 1.0 },

  // ─── Experience → Parent ───
  { id: 'c-exp-ai', sourceId: 'experience', targetId: 'exp-ai-intern', type: 'primary', strength: 0.9 },
  { id: 'c-exp-ds', sourceId: 'experience', targetId: 'exp-ds-intern', type: 'primary', strength: 0.8 },

  // ─── Education → Parent ───
  { id: 'c-edu-bt', sourceId: 'education', targetId: 'edu-btech', type: 'primary', strength: 1.0 },
  { id: 'c-edu-online', sourceId: 'education', targetId: 'edu-online', type: 'primary', strength: 0.7 },

  // ─── About → Sub-nodes ───
  { id: 'c-about-bg', sourceId: 'about', targetId: 'about-background', type: 'primary', strength: 0.8 },
  { id: 'c-about-int', sourceId: 'about', targetId: 'about-interests', type: 'primary', strength: 0.8 },
  { id: 'c-about-phil', sourceId: 'about', targetId: 'about-philosophy', type: 'primary', strength: 0.7 },

  // ─── Contact → Sub-nodes ───
  { id: 'c-contact-email', sourceId: 'contact', targetId: 'contact-email', type: 'primary', strength: 0.9 },
  { id: 'c-contact-li', sourceId: 'contact', targetId: 'contact-linkedin', type: 'primary', strength: 0.8 },
  { id: 'c-contact-gh', sourceId: 'contact', targetId: 'contact-github', type: 'primary', strength: 0.8 },
  { id: 'c-contact-tw', sourceId: 'contact', targetId: 'contact-twitter', type: 'primary', strength: 0.6 },

  // ─── Cross-Domain Connections ───
  // Projects ↔ Tools
  { id: 'cx-cvd-tf', sourceId: 'proj-cv-detect', targetId: 'tool-tensorflow', type: 'cross-domain', strength: 0.8 },
  { id: 'cx-cvd-python', sourceId: 'proj-cv-detect', targetId: 'tool-python', type: 'cross-domain', strength: 0.7 },
  { id: 'cx-sent-sklearn', sourceId: 'proj-sentiment', targetId: 'tool-sklearn', type: 'cross-domain', strength: 0.8 },
  { id: 'cx-sent-pandas', sourceId: 'proj-sentiment', targetId: 'tool-pandas', type: 'cross-domain', strength: 0.6 },
  { id: 'cx-dviz-mpl', sourceId: 'proj-data-viz', targetId: 'tool-matplotlib', type: 'cross-domain', strength: 0.8 },
  { id: 'cx-dviz-flask', sourceId: 'proj-data-viz', targetId: 'tool-flask', type: 'cross-domain', strength: 0.7 },
  { id: 'cx-web-django', sourceId: 'proj-web-app', targetId: 'tool-django', type: 'cross-domain', strength: 0.9 },
  { id: 'cx-web-mysql', sourceId: 'proj-web-app', targetId: 'tool-mysql', type: 'cross-domain', strength: 0.7 },

  // Projects ↔ Skills
  { id: 'cx-cvd-cv', sourceId: 'proj-cv-detect', targetId: 'skill-cv', type: 'cross-domain', strength: 0.9 },
  { id: 'cx-cvd-dl', sourceId: 'proj-cv-detect', targetId: 'skill-dl', type: 'cross-domain', strength: 0.8 },
  { id: 'cx-sent-ml', sourceId: 'proj-sentiment', targetId: 'skill-ml', type: 'cross-domain', strength: 0.8 },
  { id: 'cx-dviz-ds', sourceId: 'proj-data-viz', targetId: 'skill-ds', type: 'cross-domain', strength: 0.8 },
  { id: 'cx-webapp-web', sourceId: 'proj-web-app', targetId: 'skill-web', type: 'cross-domain', strength: 0.8 },

  // Experience ↔ Skills
  { id: 'cx-aiint-dl', sourceId: 'exp-ai-intern', targetId: 'skill-dl', type: 'cross-domain', strength: 0.8 },
  { id: 'cx-aiint-cv', sourceId: 'exp-ai-intern', targetId: 'skill-cv', type: 'cross-domain', strength: 0.7 },
  { id: 'cx-dsint-ds', sourceId: 'exp-ds-intern', targetId: 'skill-ds', type: 'cross-domain', strength: 0.8 },
  { id: 'cx-dsint-ml', sourceId: 'exp-ds-intern', targetId: 'skill-ml', type: 'cross-domain', strength: 0.6 },

  // Education ↔ Skills
  { id: 'cx-btech-prog', sourceId: 'edu-btech', targetId: 'skill-prog', type: 'cross-domain', strength: 0.7 },
  { id: 'cx-online-ml', sourceId: 'edu-online', targetId: 'skill-ml', type: 'cross-domain', strength: 0.7 },
  { id: 'cx-online-dl', sourceId: 'edu-online', targetId: 'skill-dl', type: 'cross-domain', strength: 0.7 },

  // Skill ↔ Skill (inter-domain)
  { id: 'cx-dl-ml', sourceId: 'skill-dl', targetId: 'skill-ml', type: 'cross-domain', strength: 0.8 },
  { id: 'cx-cv-dl', sourceId: 'skill-cv', targetId: 'skill-dl', type: 'cross-domain', strength: 0.7 },
  { id: 'cx-ds-ml', sourceId: 'skill-ds', targetId: 'skill-ml', type: 'cross-domain', strength: 0.6 },

  // Hidden connections
  { id: 'ch-fun', sourceId: 'origin', targetId: 'hidden-funfacts', type: 'hidden', strength: 0.5 },
  { id: 'ch-future', sourceId: 'origin', targetId: 'hidden-future', type: 'hidden', strength: 0.5 },
];
