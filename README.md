# Neural Nexus — Nency Sojitra's Portfolio

An immersive, interactive 3D neural network portfolio. Explore skills, projects, and experience as a living system of intelligence.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict)
- **3D Rendering:** React Three Fiber + drei + postprocessing
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion + GSAP + R3F useFrame
- **State:** Zustand
- **Physics:** Custom force-directed layout (d3-force inspired)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the neural network.

Visit [/quick-view](http://localhost:3000/quick-view) for a traditional portfolio layout.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Main 3D neural network view
│   └── quick-view/       # Traditional list-based portfolio
├── components/
│   ├── canvas/           # R3F 3D components (nodes, connections, effects)
│   └── ui/               # HTML overlay UI (panels, navigation, minimap)
├── data/                 # Node definitions, connections, types
├── store/                # Zustand stores (network, exploration, UI)
├── hooks/                # Custom hooks (force layout, keyboard nav, responsive)
└── lib/                  # Constants and utilities
```

## Connect

- [LinkedIn](https://www.linkedin.com/in/sojitra-nency-3509bb220/)
- [GitHub](https://github.com/sojitra-nency)
- [Email](mailto:snency16@gmail.com)
