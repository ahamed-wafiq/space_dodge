# Space Dodge: Alien Canyon 🌋🛸

An intense, production-grade 3D spaceship endless survival arcade game set in a treacherous alien planetary canyon. Built with **React 18**, **Three.js (r169)**, **Vanilla CSS**, and **Vite**.

![Version](https://img.shields.io/badge/version-2.0.0-purple.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![Three.js](https://img.shields.io/badge/Three.js-r169-black.svg)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)

---

## Game Overview

Navigate an agile star interceptor through an endless, volcanic alien canyon. Thread through ancient alien ruin gates, dodge massive stone pillars, weave between obsidian spires, evade falling seismic boulders, and skim glowing crystal clusters. Build combo multipliers through near-miss evasions, push your warp velocity to the limit, and set the ultimate canyon survival record!

---

## Key Features & Visual Direction

- **Immersive Alien Canyon Environment**: Seamless 3-segment recycling trench pipeline with volcanic cracked bedrock, molten orange lava veins, towering cliff walls flanking both sides ($X = \pm 18$), and overhead ancient stone bridges.
- **Atmospheric Alien Sky & Lighting**: Deep alien twilight fog (`THREE.FogExp2`), ringed celestial gas giant moon, volcanic peaks, golden amber alien sunlight, and floating thermal embers/spores.
- **Diverse 3D Environmental Obstacles**:
  - 🏛️ **Ancient Alien Ruin Gates**: Arched portals with safe central openings you can fly straight through!
  - 🗿 **Monolithic Stone Pillars**: Massive polygonal volcanic columns rising from the canyon bed.
  - ⛰️ **Jagged Obsidian Spires**: Sharp rock needles jutting from canyon walls and floor.
  - 🪨 **Falling Seismic Boulders**: Overhead rocks that tremble and plummet downward as your ship approaches.
  - 💎 **Glowing Alien Crystals**: Luminescent cyan crystal prisms offering high-value combo bonuses.
- **Guaranteed Solvable Corridor Solver**: Track is partitioned into 7 virtual corridors with algorithmic safe-lane guarantees, preventing mathematically impossible barrier walls.
- **Zero-GC Object Pooling**: Terrain segments and obstacle meshes are recycled continuously through pre-allocated pools, eliminating garbage collection pauses during extended gameplay.
- **High-Performance Decoupled HUD**: Score, warp speedometer, survival timer, and combo multiplier are updated via direct DOM element references at 60 FPS, bypassing React reconciler overhead.
- **Procedural Web Audio Engine**: Real-time sound synthesis for engine pitch hum, warp dodge chimes, deep bass impact explosions, and UI chirps without external audio dependencies.
- **Responsive Controls**: Full support for desktop keyboard controls (`A`/`D`, `←`/`→`, `Space`, `Enter`) and on-screen mobile touch steering pads.

---

## Project Documentation

Detailed project specifications and architectural workflows:
- 📋 [**flow.md**](file:///c:/Users/Mohideen%20A%20Kader/OneDrive/Desktop/spacegame/flow.md) — Master Six-Phase Development Workflow & Progress Tracking.
- 🏗️ [**architecture.md**](file:///c:/Users/Mohideen%20A%20Kader/OneDrive/Desktop/spacegame/architecture.md) — Technical Design, Component Responsibilities, and Scaling Mathematics.
- 📊 [**task-tracker.md**](file:///c:/Users/Mohideen%20A%20Kader/OneDrive/Desktop/spacegame/task-tracker.md) — Live Task Matrix, Blockers & Resolution Log, and Test Logs.

---

## Controls

| Action | Primary Key | Alternate Key | Mobile |
|---|---|---|---|
| **Steer Left** | `A` | `ArrowLeft (←)` | Left Touch Button |
| **Steer Right** | `D` | `ArrowRight (→)` | Right Touch Button |
| **Launch Mission** | `Space` | `Enter` | Click anywhere |
| **Restart Mission** | `Space` | `Enter` | Click Redeploy button |

---

## Quick Start

### 1. Installation
```powershell
cd "c:\Users\Mohideen A Kader\OneDrive\Desktop\spacegame"
npm install
```

### 2. Development Server
Start the local development server (configured for port **5001**):
```powershell
npm run dev
```
Open **[http://localhost:5001/](http://localhost:5001/)** in your browser.

### 3. Production Build
Build the optimized production bundle:
```powershell
npm run build
```

---

## Technology Stack

- **Framework**: React 18
- **3D Graphics**: Three.js (r169)
- **Bundler**: Vite 5
- **Styling**: Pure Vanilla CSS (CSS Variables, Glassmorphism, Scanlines)
- **Audio**: Web Audio API (Synthesizer)
- **Icons**: Lucide React
