# Space Dodge: Alien Canyon — Application Architecture & Systems Design

## Architecture Overview

Space Dodge: Alien Canyon is built as a high-performance 3D flight survival game combining **React 18**, **Three.js (r169)**, and **Blender 5.2 3D Asset Automation**. The architecture immerses the player in a continuous **Alien Planetary Canyon** with high-fidelity metallic spacecraft, carved alien ruin portals, and stratified stone pillars.

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
                          |(GLTF/Mesh)|  |Environment|  | (Blender Models:|
                          +-----------+  +-----------+  | Gates, Pillars, |
                                                |       | Spires, Boulders|
                                                v       +-----------------+
                                         +--------------+        |
                                         |TerrainSegment|        v
                                         |   Pipeline   | +--------------+
                                         +--------------+ |ObstaclePattern
                                                          |    Solver    |
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
├── scripts/
│   └── generate_models.py       # Blender 5.2 headless model generation & export script
├── public/
│   └── models/                  # Exported 3D GLTF/GLB models
│       ├── spaceship.glb        # High-detail metallic graphite/silver star interceptor
│       ├── alien_gate.glb       # Carved stone portal with runic inscriptions
│       └── rock_pillar.glb      # Multi-tiered stratified basalt column
└── src/
    ├── main.jsx                 # React root DOM mounting
    ├── App.jsx                  # Root game controller and state coordinator
    ├── index.css                # Pure Vanilla CSS design system (softened scanlines)
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
        │   └── textures.js      # Canvas procedural radial glow & particle textures
        └── entities/
            ├── Spaceship.js     # 3D star interceptor with GLTF loading & thruster flares
            ├── PlanetEnvironment.js # Canyon atmosphere, lighting, volcanic spores
            ├── TerrainSegment.js# Recyclable canyon trench (floor, cliff walls, arches)
            ├── ObstacleManager.js# Object pool with GLTF gates and rock pillars
            ├── ObstaclePatterns.js# Curated patterns with guaranteed solvable lanes
            └── ExplosionEffect.js# Particle blast and camera trauma shake system
```

---

## Core Systems & Modular Responsibilities

### 1. `Spaceship.js` — Futuristic Star Interceptor
- **3D Geometry & Material System**:
  - High-detail GLTF asset `/models/spaceship.glb` generated via Blender 5.2 Python API, with procedural fallback.
  - Metallic graphite hull (`#161a22`, metalness: 0.88, roughness: 0.22) and silver trim (`#b0b8c4`, metalness: 0.94).
  - Swept delta wings with stabilizer winglets and cyan neon trim.
  - Cockpit bubble glass canopy (`#0284c7`, roughness: 0.05, transparent, emissive accent).
  - Dual cylindrical turbine engines with exhaust cowlings.
- **Dynamic Thruster System**:
  - Twin afterburners featuring multi-stage glowing plumes: inner white-hot core cone, outer vibrant cyan flame with dynamic pulse/flicker.
  - Plasma particle trails streaming backward into the slipstream.
- **Camera Viewport Integration**:
  - Third-person chase camera positioned at $Y = 3.6, Z = 9.2$, lookAt $Y = 1.1, Z = -28$.
  - Ship is crisply visible in the lower-middle viewport (~18% height), keeping the canyon path and upcoming obstacles completely unobstructed.

### 2. `PlanetEnvironment.js` & `TerrainSegment.js` — Endless Canyon Pipeline
- **Continuous 3-Segment Canyon Trench ($3 \times 160 = 480\,\text{units}$)**:
  - **Canyon Floor**: Natural undulating volcanic basalt bedrock floor (`#181c26`, roughness 0.88, metalness 0.18, flat-shaded), completely replacing the giant flat orange road.
  - **Flight Corridor Guide Ribbons**:
    - Subtle glowing route centerline ribbon: width 0.35, soft cyan (`#00f0ff`, opacity 0.38).
    - Boundary guide ribbons: width 0.12 at $X = \pm 12.5$, emissive cyan/teal (`#0284c7`, opacity 0.65).
    - Subtle selective magma fissure cracks (width 0.4) weaving through rock crevices.
  - **Canyon Walls**: Multi-tiered cliff walls ($X = \pm 19$, height 36) with rocky buttresses, basalt columns, and crags.
  - **High-Altitude Arches**: Ancient alien stone arches spanning high above the trench ($Y = 17$).
  - **Bioluminescent Wall Crystals**: Clusters nestled in cliff crevices emitting a cool cyan glow.
  - **Sky & Horizon**: Alien ringed gas giant planet and mountain silhouettes with deep atmospheric cyan/indigo fog (`THREE.FogExp2(0x0c1322, 0.0058)`).

### 3. Lighting Architecture (Eliminating Crushed Blacks)
- **Hemisphere Lighting**:
  - `THREE.HemisphereLight(0x38bdf8, 0x1a1228, 1.4)` provides cyan sky luminescence and dark warm violet ground bounce, illuminating rock overhangs, undersides, and hull contours.
- **Directional Key Sun**:
  - `THREE.DirectionalLight(0x93c5fd, 2.2)` at `(-28, 48, 18)` casting sharp alien rim highlights on stone spires and spaceship panels.
- **Directional Fill Light**:
  - `THREE.DirectionalLight(0xf59e0b, 0.65)` at `(28, 16, -14)` adding complementary warm amber accents.
- **Dynamic Ship Thruster Light**:
  - `THREE.PointLight(0x00f0ff, 2.2, 18)` follows the ship, lighting up nearby rocks as the player passes them.
- **Tone Mapping**:
  - `ACESFilmicToneMapping` with exposure 1.32.

### 4. `ObstacleManager.js` & `ObstaclePatterns.js` — Realistic 3D Obstacles
- **Obstacle Types**:
  1. **Stratified Basalt Pillars**: Multi-tiered columns loaded from `rock_pillar.glb` with octagonal facets and strata shelves.
  2. **Ancient Alien Ruin Gates**: Carved monolith archways loaded from `alien_gate.glb` with runic inscriptions and open doorways ($6.4\,\text{units wide}$).
  3. **Jagged Volcanic Spires**: Obsidian needles rising from the rock floor.
  4. **Seismic Falling Boulders**: Overhead boulders that drop when the ship gets within 85 units.
  5. **Luminescent Cyan Crystals**: High-point hazard near-misses.
- **Compound Collision System**:
  - Alien gates feature compound hitboxes: the central archway ($X \in [-2.8, 2.8], Y < 6.5$) is 100% open and safe to fly through, rewarding the player with a dodge bonus!
- **Solvable Corridor Solver**:
  - 7 virtual flight lanes ($[-10.5, -7.0, -3.5, 0, 3.5, 7.0, 10.5]$).
  - Algorithmic generator ensures at least one adjacent reachable lane is clear at all speeds.

---

## Memory Management & Performance Architecture

1. **Geometry & Material Sharing**:
   - Geometries and materials are instantiated once and shared across pooled meshes.
2. **Object Pooling**:
   - Fixed pre-allocated pool of 45 obstacles. Zero GC churn during active gameplay.
3. **Decoupled 60 FPS HUD**:
   - Live telemetry updates bypass React reconciler passes via `useImperativeHandle` and direct DOM refs.
