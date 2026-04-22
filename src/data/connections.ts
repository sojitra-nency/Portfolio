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
  { id: 'c-skills-langs', sourceId: 'skills', targetId: 'skill-langs', type: 'primary', strength: 0.9 },
  { id: 'c-skills-db', sourceId: 'skills', targetId: 'skill-db', type: 'primary', strength: 0.8 },
  { id: 'c-skills-ai', sourceId: 'skills', targetId: 'skill-ai', type: 'primary', strength: 0.8 },
  { id: 'c-skills-int', sourceId: 'skills', targetId: 'skill-integrations', type: 'primary', strength: 0.7 },
  { id: 'c-skills-devops', sourceId: 'skills', targetId: 'skill-devops', type: 'primary', strength: 0.7 },
  { id: 'c-skills-soft', sourceId: 'skills', targetId: 'skill-soft', type: 'primary', strength: 0.6 },

  // ─── Sub-skills → Tools (Level 2 → 3) ───
  { id: 'c-langs-python', sourceId: 'skill-langs', targetId: 'tool-python', type: 'secondary', strength: 0.9 },
  { id: 'c-langs-django', sourceId: 'skill-langs', targetId: 'tool-django', type: 'secondary', strength: 0.9 },
  { id: 'c-langs-fastapi', sourceId: 'skill-langs', targetId: 'tool-fastapi', type: 'secondary', strength: 0.8 },
  { id: 'c-langs-celery', sourceId: 'skill-langs', targetId: 'tool-celery', type: 'secondary', strength: 0.8 },
  { id: 'c-langs-react', sourceId: 'skill-langs', targetId: 'tool-react', type: 'secondary', strength: 0.7 },
  { id: 'c-langs-nextjs', sourceId: 'skill-langs', targetId: 'tool-nextjs', type: 'secondary', strength: 0.7 },
  { id: 'c-langs-ts', sourceId: 'skill-langs', targetId: 'tool-typescript', type: 'secondary', strength: 0.7 },
  { id: 'c-db-pg', sourceId: 'skill-db', targetId: 'tool-postgresql', type: 'secondary', strength: 0.9 },
  { id: 'c-devops-docker', sourceId: 'skill-devops', targetId: 'tool-docker', type: 'secondary', strength: 0.8 },
  { id: 'c-devops-aws', sourceId: 'skill-devops', targetId: 'tool-aws', type: 'secondary', strength: 0.7 },
  { id: 'c-devops-git', sourceId: 'skill-devops', targetId: 'tool-git', type: 'secondary', strength: 0.8 },

  // ─── Projects (Level 1 → 2) ───
  { id: 'c-proj-rooflink', sourceId: 'projects', targetId: 'proj-rooflink', type: 'primary', strength: 0.9 },
  { id: 'c-proj-futureforce', sourceId: 'projects', targetId: 'proj-futureforce', type: 'primary', strength: 0.9 },
  { id: 'c-proj-toca', sourceId: 'projects', targetId: 'proj-toca', type: 'primary', strength: 0.8 },
  { id: 'c-proj-moodsense', sourceId: 'projects', targetId: 'proj-moodsense', type: 'primary', strength: 0.8 },
  { id: 'c-proj-microquant', sourceId: 'projects', targetId: 'proj-microquant', type: 'primary', strength: 0.7 },
  { id: 'c-proj-fixmytext', sourceId: 'projects', targetId: 'proj-fixmytext', type: 'primary', strength: 0.9 },
  { id: 'c-proj-feelify', sourceId: 'projects', targetId: 'proj-feelify', type: 'primary', strength: 0.8 },
  { id: 'c-proj-streamify', sourceId: 'projects', targetId: 'proj-streamify', type: 'primary', strength: 0.7 },
  { id: 'c-proj-opinio', sourceId: 'projects', targetId: 'proj-opinio', type: 'primary', strength: 0.7 },
  { id: 'c-proj-scalequest', sourceId: 'projects', targetId: 'proj-scalequest', type: 'primary', strength: 0.7 },
  { id: 'c-proj-sentiment', sourceId: 'projects', targetId: 'proj-sentiment', type: 'primary', strength: 0.7 },
  { id: 'c-proj-twiititude', sourceId: 'projects', targetId: 'proj-twiititude', type: 'primary', strength: 0.7 },
  { id: 'c-proj-snakegame', sourceId: 'projects', targetId: 'proj-snakegame', type: 'primary', strength: 0.6 },

  // ─── Experience (Level 1 → 2) ───
  { id: 'c-exp-lanet', sourceId: 'experience', targetId: 'exp-lanet', type: 'primary', strength: 1.0 },
  { id: 'c-exp-anubhav', sourceId: 'experience', targetId: 'exp-anubhav', type: 'primary', strength: 0.7 },

  // ─── Education (Level 1 → 2) ───
  { id: 'c-edu-btech', sourceId: 'education', targetId: 'edu-btech', type: 'primary', strength: 0.9 },
  { id: 'c-edu-diploma', sourceId: 'education', targetId: 'edu-diploma', type: 'primary', strength: 0.8 },

  // ─── About (Level 1 → 2) ───
  { id: 'c-about-bg', sourceId: 'about', targetId: 'about-background', type: 'primary', strength: 0.8 },
  { id: 'c-about-int', sourceId: 'about', targetId: 'about-interests', type: 'primary', strength: 0.7 },
  { id: 'c-about-phil', sourceId: 'about', targetId: 'about-philosophy', type: 'primary', strength: 0.7 },
  { id: 'c-about-approach', sourceId: 'about', targetId: 'about-approach', type: 'primary', strength: 0.7 },
  { id: 'c-about-beyond', sourceId: 'about', targetId: 'about-beyond', type: 'primary', strength: 0.6 },

  // ─── Contact (Level 1 → 2) ───
  { id: 'c-contact-email', sourceId: 'contact', targetId: 'contact-email', type: 'primary', strength: 0.9 },
  { id: 'c-contact-linkedin', sourceId: 'contact', targetId: 'contact-linkedin', type: 'primary', strength: 0.8 },
  { id: 'c-contact-github', sourceId: 'contact', targetId: 'contact-github', type: 'primary', strength: 0.8 },
  { id: 'c-contact-phone', sourceId: 'contact', targetId: 'contact-phone', type: 'primary', strength: 0.7 },

  // ─── Cross-domain: Projects → Skills/Tools ───
  { id: 'x-rooflink-django', sourceId: 'proj-rooflink', targetId: 'tool-django', type: 'cross-domain', strength: 0.8 },
  { id: 'x-rooflink-react', sourceId: 'proj-rooflink', targetId: 'tool-react', type: 'cross-domain', strength: 0.7 },
  { id: 'x-rooflink-celery', sourceId: 'proj-rooflink', targetId: 'tool-celery', type: 'cross-domain', strength: 0.7 },
  { id: 'x-rooflink-pg', sourceId: 'proj-rooflink', targetId: 'tool-postgresql', type: 'cross-domain', strength: 0.8 },
  { id: 'x-futureforce-django', sourceId: 'proj-futureforce', targetId: 'tool-django', type: 'cross-domain', strength: 0.8 },
  { id: 'x-futureforce-react', sourceId: 'proj-futureforce', targetId: 'tool-react', type: 'cross-domain', strength: 0.7 },
  { id: 'x-futureforce-ai', sourceId: 'proj-futureforce', targetId: 'skill-ai', type: 'cross-domain', strength: 0.6 },
  { id: 'x-toca-python', sourceId: 'proj-toca', targetId: 'tool-python', type: 'cross-domain', strength: 0.8 },
  { id: 'x-toca-int', sourceId: 'proj-toca', targetId: 'skill-integrations', type: 'cross-domain', strength: 0.8 },
  { id: 'x-moodsense-python', sourceId: 'proj-moodsense', targetId: 'tool-python', type: 'cross-domain', strength: 0.7 },
  { id: 'x-moodsense-ai', sourceId: 'proj-moodsense', targetId: 'skill-ai', type: 'cross-domain', strength: 0.7 },
  { id: 'x-microquant-python', sourceId: 'proj-microquant', targetId: 'tool-python', type: 'cross-domain', strength: 0.7 },
  { id: 'x-fixmytext-fastapi', sourceId: 'proj-fixmytext', targetId: 'tool-fastapi', type: 'cross-domain', strength: 0.9 },
  { id: 'x-fixmytext-react', sourceId: 'proj-fixmytext', targetId: 'tool-react', type: 'cross-domain', strength: 0.7 },
  { id: 'x-fixmytext-pg', sourceId: 'proj-fixmytext', targetId: 'tool-postgresql', type: 'cross-domain', strength: 0.8 },
  { id: 'x-fixmytext-int', sourceId: 'proj-fixmytext', targetId: 'skill-integrations', type: 'cross-domain', strength: 0.7 },
  { id: 'x-feelify-django', sourceId: 'proj-feelify', targetId: 'tool-django', type: 'cross-domain', strength: 0.8 },
  { id: 'x-feelify-nextjs', sourceId: 'proj-feelify', targetId: 'tool-nextjs', type: 'cross-domain', strength: 0.7 },
  { id: 'x-streamify-django', sourceId: 'proj-streamify', targetId: 'tool-django', type: 'cross-domain', strength: 0.8 },
  { id: 'x-opinio-python', sourceId: 'proj-opinio', targetId: 'tool-python', type: 'cross-domain', strength: 0.7 },
  { id: 'x-opinio-ai', sourceId: 'proj-opinio', targetId: 'skill-ai', type: 'cross-domain', strength: 0.7 },
  { id: 'x-sentiment-python', sourceId: 'proj-sentiment', targetId: 'tool-python', type: 'cross-domain', strength: 0.7 },
  // ─── Cross-domain: Experience → Skills ───
  { id: 'x-lanet-langs', sourceId: 'exp-lanet', targetId: 'skill-langs', type: 'cross-domain', strength: 0.9 },
  { id: 'x-lanet-db', sourceId: 'exp-lanet', targetId: 'skill-db', type: 'cross-domain', strength: 0.8 },
  { id: 'x-lanet-int', sourceId: 'exp-lanet', targetId: 'skill-integrations', type: 'cross-domain', strength: 0.7 },
  { id: 'x-anubhav-ai', sourceId: 'exp-anubhav', targetId: 'skill-ai', type: 'cross-domain', strength: 0.7 },

  // ─── Cross-domain: Education → Skills ───
  { id: 'x-btech-langs', sourceId: 'edu-btech', targetId: 'skill-langs', type: 'cross-domain', strength: 0.6 },
  { id: 'x-btech-ai', sourceId: 'edu-btech', targetId: 'skill-ai', type: 'cross-domain', strength: 0.6 },

  // ─── Cross-domain: Experience → Projects ───
  { id: 'x-lanet-rooflink', sourceId: 'exp-lanet', targetId: 'proj-rooflink', type: 'cross-domain', strength: 0.9 },
  { id: 'x-lanet-futureforce', sourceId: 'exp-lanet', targetId: 'proj-futureforce', type: 'cross-domain', strength: 0.8 },
  { id: 'x-lanet-toca', sourceId: 'exp-lanet', targetId: 'proj-toca', type: 'cross-domain', strength: 0.8 },
  { id: 'x-anubhav-microquant', sourceId: 'exp-anubhav', targetId: 'proj-microquant', type: 'cross-domain', strength: 0.7 },

  // ─── Hidden connections ───
  { id: 'c-hidden-funfacts', sourceId: 'origin', targetId: 'hidden-funfacts', type: 'hidden', strength: 0.5 },
  { id: 'c-hidden-future', sourceId: 'origin', targetId: 'hidden-future', type: 'hidden', strength: 0.5 },
];
