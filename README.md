# Astro Vanguard: Void Drift 🚀🌌

An infinite 3D spaceship obstacle avoidance and survival arcade game built with **React**, **Three.js**, and **Vite**.

## Features

- **Endless Procedural Space Corridor**: Deep space environment with realistic atmospheric fog and dual-layer starfield.
- **Dynamic 3D Spaceship**: Custom interceptor with cockpit emissive glow, swept wings, glowing engine flares, and subtle banking/roll physics when steering.
- **Truly Endless Difficulty**: Continuous logarithmic speed and frequency scaling based on delta-time physics and survival score.
- **Zero-GC Obstacle Pooling**: Reusable obstacle meshes (asteroids, magma fragments, cyber barriers) recycled on the fly without memory leaks.
- **Solvable Corridor Solver**: Intelligent safe-lane algorithm ensuring waves always have an evasive route.
- **High-Performance 60+ FPS HUD**: Direct DOM ref updates bypassing React re-renders for fluid scoreboard, speedometer, and combo multiplier displays.
- **Procedural Web Audio Engine**: Synthesized engine hum, warp dodge chimes, deep bass explosion, and click feedback.
- **Responsive Controls**: Keyboard (`A`/`D`, `←`/`→`, `Space`) and on-screen mobile touch steering.

## Getting Started

### Installation
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```
