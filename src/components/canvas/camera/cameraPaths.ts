/**
 * Tour keyframes for the guided-tour choreography (Task 34).
 *
 * Each step focuses the camera on a node, dwells for `dwellMs`, and shows
 * `narration` in the CommTooltip pill. The tour walks the seven primary
 * clusters and returns to origin.
 *
 * dwellMs tuning:
 *   - origin / contact: 3 500 ms — short anchor stops.
 *   - primary clusters: 5 000 ms — enough to read the narration.
 */

export interface TourKeyframe {
  nodeId: string;
  dwellMs: number;
  narration: string;
}

export const TOUR_KEYFRAMES: TourKeyframe[] = [
  {
    nodeId: 'origin',
    dwellMs: 3500,
    narration: 'This is the origin — the neural core of everything here.',
  },
  {
    nodeId: 'about',
    dwellMs: 5000,
    narration: 'About: the person behind the code. 3+ years shipping production systems.',
  },
  {
    nodeId: 'skills',
    dwellMs: 5000,
    narration: 'Skills: Python, Django, FastAPI, React, Next.js — and the layers beneath.',
  },
  {
    nodeId: 'projects',
    dwellMs: 5000,
    narration: 'Projects: CRM platforms, AI publishing, real-time emotion detection, and more.',
  },
  {
    nodeId: 'experience',
    dwellMs: 5000,
    narration: 'Experience: from freelance ML to enterprise SaaS — code that ships to production.',
  },
  {
    nodeId: 'education',
    dwellMs: 5000,
    narration: 'Education: B.Tech in Computer Science, backed by Data Science & ML certifications.',
  },
  {
    nodeId: 'contact',
    dwellMs: 3500,
    narration: "Contact: let's connect. Open to collaborations and conversations about tech.",
  },
  {
    nodeId: 'origin',
    dwellMs: 2000,
    narration: 'Tour complete. Click any neuron to explore.',
  },
];
