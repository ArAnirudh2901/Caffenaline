# Caffenaline

An immersive coffee brand experience built with Next.js, React 19, Three.js, and GSAP.

Caffenaline blends cinematic scroll choreography, real-time 3D liquid rendering, and a polished editorial interface into a single-page product experience. The application pairs a fixed WebGL canvas with a layered DOM system to create a site that feels branded, tactile, and performance-aware from the first frame.

## Overview

The experience is structured as a narrative landing page with four core moments:

- A kinetic hero section with animated typography and scroll-led entry choreography.
- A brand story section that frames the product narrative against the 3D cup composition.
- A morphing menu section where beverage states and liquid behavior evolve through scroll.
- A find-us and conversion section with contact details, subscription capture, and supporting brand UI.

## Highlights

- Scroll-synced 3D scene driven by React Three Fiber, GSAP ScrollTrigger, and Lenis.
- Procedural coffee liquid with GPU-powered ripple simulation and menu-aware material morphing.
- Hybrid architecture that keeps the WebGL scene fixed while the DOM layers move independently.
- Performance-aware rendering using Drei's `PerformanceMonitor`.
- Centralized UI and interaction state managed with Zustand.
- Bun-first workflow for installation, development, and verification.

## Tech Stack

| Layer | Tools |
| --- | --- |
| App framework | Next.js 16, React 19 |
| 3D and rendering | Three.js, React Three Fiber, Drei |
| Motion and scroll | GSAP, ScrollTrigger, Lenis |
| State | Zustand |
| Styling | Tailwind CSS 4, global CSS |
| Package manager | Bun 1.3.9 |

## Getting Started

### Requirements

- Bun `1.3.9` or newer

### Install

```bash
bun install
```

### Run locally

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) after the dev server starts.

## Scripts

| Command | Description |
| --- | --- |
| `bun dev` | Start the local development server |
| `bun run build` | Create a production build |
| `bun start` | Run the production server |
| `bun run lint` | Run ESLint across the project |

## Project Structure

```text
caffenaline/
├── public/
│   └── textures/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   │   ├── canvas/
│   │   └── dom/
│   ├── lib/
│   └── store/
├── AGENTS.md
├── package.json
└── bun.lock
```

## Architecture Notes

### Rendering model

The application uses a fixed full-screen WebGL canvas for the cup, liquid, spoon, environment lighting, and camera choreography. Content sections are rendered as a separate DOM layer above the canvas, allowing precise control over layout, readability, and branded interface elements.

### Motion system

Lenis smooths scroll input, GSAP synchronizes scroll-linked transitions, and section components respond with focused animation timelines rather than broad page-level re-renders. This keeps movement intentional and the visual hierarchy stable.

### State model

Zustand coordinates global interaction state such as section progress, scroll velocity, coffee morph state, modal state, and rendering-tier decisions. This allows the DOM and canvas layers to react to the same interaction model without becoming tightly coupled.

## Experience Inventory

- `HeroSection`: animated headline, parallax copy, CTA, and branded side text.
- `BrandStorySection`: editorial slab layout with velocity-reactive typography.
- `MenuSection`: scroll-pinned drink presentation with synchronized liquid transitions.
- `FooterSection`: location, hours, brand messaging, and email capture.
- `OrderModal`: interactive product flow layered on top of the landing page.
- `Scene`: fixed 3D stage for the ceramic cup, coffee surface, spoon, lighting, and camera behavior.

## Workflow

This repository is Bun-only. Use Bun for dependency installation, script execution, and lockfile management.

```bash
bun install
bun run lint
bun run build
```

## Notes

- The project uses the Next.js App Router under `src/app`.
- `public/` remains at the repository root, consistent with Next.js conventions.
- The repo includes agent instructions in `AGENTS.md` for code-aware tooling workflows.

## License

Private project. All rights reserved.
