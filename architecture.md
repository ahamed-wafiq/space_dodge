# Space Dodge: Alien Canyon — Application Architecture & Systems Design

## Architecture Overview

Space Dodge: Alien Canyon is built as a high-performance 3D flight survival game combining **React 18** and **Three.js (r169)**. The architecture transitions the game from a void-based asteroid dodge into an immersive, continuous **Alien Planetary Canyon**.

```
+------------------------------------------------------------------------------------+
|                                  App.jsx                                           |
|       (Game State: 'START' | 'PLAYING' | 'GAME_OVER', HighScore, Audio Mute)       |
+------------------------------------------------------------------------------------+
        |                                      |                               |
        v                                      v                               v
+---------------+                    +--------------------+          +--------------------+
|  StartScreen  |                    |  GameHUD (DOM Ref) |          |   GameOverScreen   |
| (Briefing UI) |                    | (60 FPS Direct DOM)|          | (Stats Telemetry)  |
+---------------+                    +--------------------+          +--------------------+
                                               ^
                                               | onHUDUpdate (Decoupled Micro-Callback)
                                     +--------------------+
                                     |    GameEngine.js   |
                                     | (Three.js Renderer)|
                                     +--------------------+
                                       /        |       \
                                      /         |        \
                                     v          v         v
                          +-----------+  +-----------+  +-----------------+
                          | Spaceship |  |  Planet   |  | ObstacleManager |
                          |  Entity   |  |Environment|  | (Pillars, Gates,|
                          +-----------+  +-----------+  | Spires, Debris) |
                                                |       +-----------------+
                                                v                |
                                         +--------------+        v
                                         |TerrainSegment| +--------------+
                                         |   Pipeline   | |ObstaclePattern
                                         +--------------+ |    Solver    |
                                                          +--------------+
```

---

## Directory & File Structure

```
spacegame/
├── flow.md                      # Master six-phase development workflow
├── architecture.md              # Technical systems design and scaling equations
├── task-tracker.md              # Live task status, verification matrix, test logs
├── README.md                    # Project overview, setup, and control guide
├── package.json                 # Dependencies and build scripts
├── vite.config.js               # Vite config (Port 5001, React plugin)
├── index.html                   # HTML5 entry with Orbitron & Rajdhani fonts
└── src/
    ├── main.jsx                 # React root DOM mounting
    ├── App.jsx                  # Root game controller and state coordinator
    ├── index.css                # Pure Vanilla CSS design system
    ├── audio/
    │   └── SoundManager.js      # Web Audio API procedural sound synthesizer
    ├── components/
    │   ├── StartScreen.jsx      # Planetary expedition briefing & launch UI
    │   ├── GameHUD.jsx          # Decoupled 60 FPS flight telemetry HUD
    │   ├── GameOverScreen.jsx   # Hull breach report, telemetry stats, redeploy
    │   └── MobileControls.jsx   # On-screen touch steering controls for mobile
    └── game/
        ├── GameEngine.js        # Core Three.js game loop, lighting, collision
        ├── utils/
        │   └── textures.js      # Canvas procedural radial glow & lava textures
        └── entities/
            ├── Spaceship.js     # 3D star interceptor with banking & thruster glow
            ├── PlanetEnvironment.js # Canyon atmosphere, lighting, volcanic spores
            ├── TerrainSegment.js# Recyclable canyon trench (floor, cliff walls, arches)
            ├── ObstacleManager.js# Object pool for pillars, gates, spires, falling rocks
            ├── ObstaclePatterns.js# Curated patterns with guaranteed solvable lanes
            └── ExplosionEffect.js# Particle blast and camera trauma shake system
```

---

## Core Systems & Modular Responsibilities

### 1. `PlanetEnvironment.js` & `TerrainSegment.js` — Endless Canyon Pipeline
- **Continuous 3-Segment Trench**:
  - Three seamless segments of length $L = 160$ units (total corridor length 480 units).
  - Each segment includes:
    - **Canyon Floor**: Volcanic cracked basalt plane with glowing lava veins (`THREE.MeshStandardMaterial` with emissive orange `0xff4500`).
    - **Cliff Walls**: Left and right jagged rock buttresses ($X \approx \pm 18$, height 35 units) flanking the route.
    - **Ancient Arches**: Overhead stone arches spanning across the canyon at intervals.
    - **Atmospheric Particles**: Volcanic ember sparks and alien spores drifting on thermals.
- **Zero-GC Recycling**:
  - When a segment's position passes behind the camera ($Z > 50$), its group position is translated forward by $3 \times L = 480$ units along $-Z$.
  - Zero mesh destruction, zero memory allocations, zero hitching.

### 2. `ObstacleManager.js` & `ObstaclePatterns.js` — Realistic 3D Obstacles
- **Obstacle Archetypes**:
  1. **Monolithic Stone Pillars**: Massive polygonal stone pillars rising from the canyon floor.
  2. **Pillar Pairs / Slaloms**: Paired columns requiring prompt lateral steering.
  3. **Ancient Alien Ruin Gates**: Arched stone gateways with open passageways that the ship must fly through.
  4. **Jagged Rock Spires**: Obsidian needles thrusting upward or jutting from canyon walls.
  5. **Falling Seismic Debris**: Overhead boulders that begin trembling and drop downward as the ship enters proximity.
  6. **Alien Crystal Clusters**: Glowing cyan crystal formations providing near-miss combo boosts.
- **Guaranteed Solvable Pattern Engine**:
  - Track is partitioned into 7 virtual corridors ($[-11, -7.3, -3.6, 0, 3.6, 7.3, 11]$).
  - Every procedural pattern guarantees at least 1–2 adjacent lanes are completely open, preventing mathematically impossible barrier walls.

### 3. Collision System & Accurate Hitboxes
- **Pillars & Spires**: Bounding cylinders/spheres mapped to the active 3D obstacle models.
- **Ancient Gates**: Composed of left pillar hitbox, right pillar hitbox, and overhead lintel hitbox. The central doorway ($6\,\text{units wide} \times 8\,\text{units high}$) is completely open, allowing thrilling, safe flight through the archway!
- **Falling Debris**: Dynamic sphere collider updated continuously as the boulder drops.
- **Canyon Side Boundaries**: Hard-clamped lateral bounds ($X \in [-14, +14]$) prevent the ship from clipping into the canyon cliffs.

### 4. Difficulty Scaling & Flight Physics
- **Uncapped Sub-Linear Difficulty**:
  $$\text{Speed} = \text{BaseSpeed} + 1.4 \times \sqrt{\text{Score}} + 0.4 \times \text{SurvivalTime}$$
  $$\text{SpawnInterval} = \max\left(0.32\,\text{s}, \frac{1.1\,\text{s}}{1 + 0.00045 \times \text{Score}}\right)$$
- **Delta-Time Movement**: All translation and physics steps use $\Delta t$, ensuring frame-rate independence (60Hz, 120Hz, 144Hz, variable).
- **Third-Person Chase Camera**: Dynamic camera with lateral interpolation, smooth banking angle following the spaceship, and trauma-decay camera shake upon collision.

---

## Memory Management & Performance Architecture

1. **Geometry & Material Sharing**:
   - Geometries (cylinder pillars, extruded arches, faceted spires, crystal prisms, fractured boulders) and materials (basalt stone, glowing lava, alien cyan crystal, ancient stone) are created once in memory.
2. **Object Pooling**:
   - Obstacles are allocated in a fixed pool of 40 instances. Inactive items are hidden (`visible = false`) and popped on demand.
3. **Decoupled 60 FPS HUD**:
   - Live telemetry updates bypass React reconciler passes via `useImperativeHandle` and direct DOM refs.
