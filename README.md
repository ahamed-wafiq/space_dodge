# Space Dodge (Astro Vanguard: Void Drift) 🚀🌌

A production-grade, infinite 3D spaceship obstacle avoidance and endless survival arcade game built with **React 18**, **Three.js (r169)**, **Vanilla CSS**, and **Vite**.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![Three.js](https://img.shields.io/badge/Three.js-r169-black.svg)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)

---

## Game Overview

Pilot an agile star interceptor through an endless, increasingly hazardous asteroid belt in deep space. Dodge high-velocity asteroids, magma core fragments, and cyber hazard barriers. Build combo multipliers through near-miss evasions, push your warp velocity to the absolute limits, and set the ultimate survival record!

---

## Key Features

- **Truly Endless Difficulty**: Speed and spawn frequency scale smoothly and logarithmically with survival time and score, maintaining gameplay balance without arbitrary caps or predefined endpoints.
- **Guaranteed Solvable Corridor Solver**: Track is partitioned into 7 virtual corridors with algorithmic safe-lane guarantees, preventing impossible barrier walls while maintaining intense challenge.
- **Zero-GC Object Pooling**: Obstacles are recycled through pre-allocated active and inactive pools using shared geometries and materials, eliminating garbage collection pauses during extended sessions.
- **High-Performance Decoupled HUD**: Score, warp speedometer, survival timer, and combo multiplier are updated via direct DOM element references at 60 FPS, bypassing React reconciler overhead.
- **Dynamic 3D Spaceship Dynamics**: Procedurally constructed interceptor featuring an emissive cyan cockpit, swept-back delta wings, pulsing plasma exhaust cones, trailing particle sparks, and physics-driven banking/roll up to 32°.
- **Dual-Layer Cosmic Warp Starfield**: 800 background galaxy stars paired with dual-chamber GPU-scrolled warp speed streaks using soft radial glow sprites.
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
- **Styling**: Vanilla CSS (CSS Variables, Glassmorphism, Scanlines)
- **Audio**: Web Audio API (Synthesizer)
- **Icons**: Lucide React
