# Space Dodge — Application Architecture & Component Responsibilities

## Architecture Overview

Space Dodge is built as a high-performance, single-page 3D survival game combining **React 18** for declarative UI state management and **Three.js (r169)** for hardware-accelerated 3D graphics. The architecture strictly decouples 60 FPS real-time rendering and physics loops from React component re-renders to achieve zero-stutter performance.

```
+-----------------------------------------------------------------------------------+
|                                 App.jsx                                           |
|   (Root Game State: 'START' | 'PLAYING' | 'GAME_OVER', HighScore, Audio Mute)     |
+-----------------------------------------------------------------------------------+
       |                                      |                               |
       v                                      v                               v
+---------------+                   +--------------------+          +--------------------+
|  StartScreen  |                   |   GameHUD (DOM Ref)|          |   GameOverScreen   |
| (Briefing UI) |                   | (60 FPS Direct DOM)|          | (Stats Telemetry)  |
+---------------+                   +--------------------+          +--------------------+
                                              ^
                                              | onHUDUpdate (Decoupled Micro-Callback)
                                    +--------------------+
                                    |    GameEngine.js   |
                                    | (Three.js Renderer)|
                                    +--------------------+
                                      /   |     \      \
                                     /    |      \      \
                                    v     v       v      v
                          +-----------+ +-------+ +-----+ +-----------------+
                          | Spaceship | |Obstacle| |Star-| | ExplosionEffect |
                          |  Entity   | | Pool  | |field| |  (Particles)    |
                          +-----------+ +-------+ +-----+ +-----------------+
```

---

## Directory & File Structure

```
spacegame/
├── index.html                   # HTML5 entry with Google Fonts (Orbitron, Rajdhani)
├── package.json                 # Project dependencies and run/build scripts
├── vite.config.js               # Vite build configuration (Port 5001, React plugin)
├── flow.md                      # Master development workflow and phase tracking
├── architecture.md              # Technical design and architectural documentation
├── task-tracker.md              # Live task status, verification records, test logs
├── README.md                    # Project overview, setup, and control guide
└── src/
    ├── main.jsx                 # React root DOM mounting
    ├── App.jsx                  # Root game controller, state coordinator
    ├── index.css                # Pure Vanilla CSS design system (Cyberpunk/Sci-Fi)
    ├── audio/
    │   └── SoundManager.js      # Web Audio API procedural sound synthesizer
    ├── components/
    │   ├── StartScreen.jsx      # Mission briefing, controls, launch button
    │   ├── GameHUD.jsx          # High-speed decoupled HUD (score, speed, timer)
    │   ├── GameOverScreen.jsx   # Mission debrief, stats telemetry, restart
    │   └── MobileControls.jsx   # On-screen touch steering controls for mobile
    └── game/
        ├── GameEngine.js        # Core Three.js game loop, camera, collision
        ├── utils/
        │   └── textures.js      # Procedural canvas radial glow texture generator
        └── entities/
            ├── Spaceship.js     # Procedural 3D interceptor, banking & flames
            ├── ObstaclePool.js  # Zero-GC obstacle pooling & safe-lane solver
            ├── Starfield.js     # GPU-scrolled cosmic warp starfield
            └── ExplosionEffect.js# Particle blast & camera shake system
```

---

## Component & Module Responsibilities

### 1. `App.jsx` — Game Coordinator
- **Role**: Coordinates the lifecycle between React view overlays and the Three.js `GameEngine`.
- **State Managed**:
  - `gameState`: `'START'`, `'PLAYING'`, `'GAME_OVER'`.
  - `highScore`: Loaded from and persisted to `localStorage`.
  - `isMuted`: Audio preferences.
  - `gameOverStats`: Telemetry metrics passed to `GameOverScreen`.
- **Performance Strategy**: Binds `onHUDUpdate` directly to DOM refs in `GameHUD`, avoiding React render cycles on animation frames.

### 2. `GameEngine.js` — Three.js Graphics & Physics Controller
- **Role**: Manages the WebGL context, scene graph, cameras, lighting, delta time, collision checking, and the single persistent animation loop.
- **Key Subsystems**:
  - **Atmospheric Setup**: `THREE.FogExp2(0x030712, 0.0055)` provides atmospheric depth. `THREE.ACESFilmicToneMapping` ensures realistic contrast.
  - **Dynamic Camera**: Smooth third-person chase camera that tracks spaceship lateral movement with interpolation and applies trauma decay camera shake on impact.
  - **Input Management**: Tracks keyboard input (`A`/`D`, `←`/`→`) and mobile virtual touches, supporting auto-start from preview mode.
  - **Collision System**: Tests bounding sphere intersections between the player ship and active pooled obstacles every tick.

### 3. `Spaceship.js` — Player Interceptor Entity
- **Role**: Renders the 3D player ship and calculates flight physics.
- **Visuals**:
  - Fuselage: Faceted metallic cone geometry with dark carbon material.
  - Cockpit: Glowing cyan neon canopy with high emissive intensity.
  - Wings: Swept delta wings with neon edge indicator strips.
  - Thrusters: Dual plasma flame cones with dynamic scaling pulse and trailing spark particles.
- **Physics**:
  - Smooth acceleration and damping towards target lateral velocity.
  - Natural banking roll up to $\pm 32^\circ$ proportionally scaled to horizontal velocity.
  - Hard boundary clamping within the playable corridor ($X \in [-14, +14]$).

### 4. `ObstaclePool.js` — Object Pooling & Solvable Lane Solver
- **Role**: Manages obstacle instantiation, reuse, and spatial distribution.
- **Zero-GC Object Pooling**:
  - Pre-allocates 45 mesh instances on initialization.
  - Reuses shared geometries (deformed dodecahedron, faceted icosahedron, oblong asteroid, cyber hazard pylon).
  - Reuses shared materials (charcoal rock, glowing magma fissure, cobalt crystal, cyber alert).
  - Recycles passed obstacles behind camera back into the inactive pool.
- **Guaranteed Solvable Lane Algorithm**:
  - Divides track into 7 virtual corridors ($[-11, -7.3, -3.6, 0, 3.6, 7.3, 11]$).
  - Dynamically guarantees at least 1–2 adjacent lanes remain clear in every wave.
- **Initial Wave Injection**: Spawns an immediate obstacle cluster at $Z \in [-55, -90, -125, -160, -195]$ so action begins instantly upon mission launch.

### 5. `Starfield.js` — Warp Motion Particle System
- **Role**: Creates the sensation of forward warp velocity.
- **Dual-Layer Architecture**:
  - **Background Celestial Dust**: 800 static twinkling stars distributed across deep space.
  - **Warp Speed Chambers**: Dual cylindrical star groups that scroll along $+Z$ and wrap around smoothly.
- **Performance**: Moves entire `THREE.Group` positions on the GPU, avoiding expensive CPU vertex buffer re-uploads (`needsUpdate = true`). Uses circular radial glow textures to eliminate square quad artifacts.

### 6. `ExplosionEffect.js` — Hull Breach Particle System
- **Role**: Emits 120 colored spark particles with spherical blast velocities upon collision, decaying smoothly over 1.4 seconds.

### 7. `SoundManager.js` — Procedural Web Audio Engine
- **Role**: Synthesizes real-time sound effects via Web Audio API oscillators, biquad filters, and noise buffers:
  - Thruster sound: Continuous low-frequency oscillator modulated by ship speed.
  - Dodge whoosh: Exponential frequency sweep with high-pass resonance.
  - Collision explosion: Sub-bass oscillator combined with brown noise burst.
  - UI clicks: Crisp high-pitch triangle chirps.

### 8. `GameHUD.jsx` — High-Performance Decoupled Overlay
- **Role**: Displays live score, warp velocity meter, survival time, combo multiplier, and dodged count.
- **Architecture**: Implements `useImperativeHandle` with direct element refs (`scoreValRef.current.innerText = ...`), executing at 60 FPS without triggering React reconciler cycles.

---

## Difficulty Scaling Model

Difficulty scales continuously and logarithmically without arbitrary caps or predefined endpoints:

1. **Velocity Scaling**:
   $$\text{Speed} = \text{BaseSpeed} + 1.35 \times \sqrt{\text{Score}} + 0.38 \times \text{SurvivalTime}$$
2. **Spawn Interval Scaling**:
   $$\text{Interval} = \max\left(0.35\,\text{s}, \frac{1.05\,\text{s}}{1 + 0.0004 \times \text{Score}}\right)$$
3. **Delta-Time Movement**:
   $$\Delta \text{pos}_z = \text{Speed} \times \Delta t$$
   Guarantees identical speed on 60 FPS, 120 FPS, and variable refresh rate monitors.
