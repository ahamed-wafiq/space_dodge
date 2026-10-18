# Space Dodge: Alien Canyon — Master Six-Phase Development Workflow

## Project Objective & Technology Stack
- **Objective**: Transform the game into a breathtaking, production-grade 3D alien planetary canyon survival flight experience. The player pilots a futuristic star interceptor through an alien volcanic trench filled with stone monoliths, ancient alien ruin gates, jagged spires, falling boulders, and glowing crystal hazards with continuous progressive difficulty, zero-GC memory recycling, and procedural audio.
- **Technology Stack**:
  - **Core**: React 18, Vite 5, JavaScript (ES Modules, JSX)
  - **3D Graphics Engine**: Three.js r169 (WebGL, ACESFilmicToneMapping, FogExp2, HemisphereLight, GLTFLoader)
  - **3D Asset Pipeline**: Blender 5.2 (Python API automation & GLTF 2.0 export for spaceship, carved gates, and basalt pillars)
  - **Styling**: Pure Vanilla CSS with subtle CRT scanline aesthetics, glassmorphism, and responsive layouts
  - **Audio Engine**: Web Audio API (procedural synthesis for thruster hum, dodge chimes, seismic rumbles, crash explosions, UI feedback)
  - **Icons**: Lucide React

---

## Workflow Verification Rule
> [!IMPORTANT]
> **MANDATORY VERIFICATION RULE**: No phase may be marked **DONE** merely because code was written. A phase can only transition to **DONE** after all associated tasks and acceptance criteria have been verified through actual runtime execution, automated build checks, or interactive inspection.

---

## Status Legend
- `[TODO]` — Not yet started
- `[IN PROGRESS]` — Currently active
- `[BLOCKED]` — Halted by an unresolved issue
- `[DONE]` — Completely implemented and verified against acceptance criteria

---

## Development Phases

### Phase 1: Audit and Planning `[DONE]`
- **Tasks**:
  1. Audit existing Three.js scene, entities, and lifecycle in `GameEngine.js`.
  2. Plan modular architecture: `PlanetEnvironment.js`, `TerrainSegment.js`, `ObstacleManager.js`, `ObstaclePatterns.js`, `Spaceship.js`.
  3. Design 3D assets via Blender MCP: `spaceship.glb`, `alien_gate.glb`, `rock_pillar.glb`.
  4. Update `flow.md`, `architecture.md`, `task-tracker.md`, and `README.md`.
- **Verification**: Code review and static architecture validation.

---

### Phase 2: 3D Alien Planet Environment `[DONE]`
- **Tasks**:
  1. Atmospheric Setup: Emerald/cyan and indigo atmospheric canyon fog (`THREE.FogExp2` with tone `0x0c1322`, density `0.0058`).
  2. Balanced Lighting: `THREE.HemisphereLight(0x38bdf8, 0x1a1228, 1.4)` eliminates crushed blacks and reveals rock contours. Directional sun (`0x93c5fd`, 2.2) and warm amber fill (`0xf59e0b`, 0.65).
  3. Procedural Canyon Trench: Textured volcanic basalt bedrock floor (`#181c26`, roughness: 0.88), removing the giant flat orange road polygon.
  4. Subtle Flight Guide Corridor: Narrow cyan route centerline (width 0.35, opacity 0.38) and thin boundary edge ribbons ($X = \pm 12.5$).
  5. Flanking multi-tiered cliff walls ($X = \pm 19$) with basalt outcroppings, ancient high-altitude arches, and bioluminescent wall crystals.
  6. Dynamic atmospheric spore particles with dual cyan/amber thermal drift.
- **Verification**: WebGL scene execution, visual validation, 60+ FPS stability.

---

### Phase 3: Endless Gameplay & Realistic 3D Obstacles `[DONE]`
- **Tasks**:
  1. Blender 3D Model Integration:
     - `spaceship.glb`: Metallic graphite and silver fuselage, bubble canopy glass, swept delta wings, dual turbine engines.
     - `alien_gate.glb`: Carved stone archway with runic glyphs and 6.4-unit wide open fly-through portal.
     - `rock_pillar.glb`: Multi-tiered faceted basalt pillar with stratified stone shelves.
  2. Procedural Geometries & Materials Fallbacks:
     - Obsidian spires, seismic falling boulders, and luminescent cyan crystal clusters.
  3. Compound Collision Detection:
     - Accurate compound hitboxes for alien gates: ships safely fly through the central archway without collision!
  4. Algorithmic Solvable Corridor Solver (`ObstaclePatterns.js`):
     - Curated obstacle patterns guaranteeing at least one navigable safe lane at all speeds.
  5. Progressive Difficulty Scaling:
     - Continuous uncapped speed scaling based on survival time and score.
- **Verification**: Collision testing, passage through gate openings, difficulty scaling validation.

---

### Phase 4: Professional Sci-Fi UI/UX `[DONE]`
- **Tasks**:
  1. UI Theme: "Alien Canyon Expeditions — Volcanic Trench Run".
  2. Start Screen: Mission briefing for planetary canyon survival, controls guide, high score badge, audio toggle.
  3. Live Decoupled HUD: Direct-DOM 60 FPS update of score, velocity, survival timer, combo multiplier, and dodged count.
  4. Game Over Screen: Critical telemetry debrief (Distance Traveled, Canyon Obstacles Cleared, Max Velocity, New Record).
  5. Responsive touch steering pads for mobile/tablet.
  6. Keyboard shortcuts: `Space` and `Enter` for instant launch and restart.
- **Verification**: Responsive layout inspection, button interactions, keyboard trigger checks.

---

### Phase 5: Memory Management & Performance `[DONE]`
- **Tasks**:
  1. Object pooling for all canyon obstacles (pillars, gates, spires, falling rocks, crystals).
  2. Segment recycling: Passed canyon segments are shifted forward along $+Z$, preventing heap allocations.
  3. Shared geometries and materials: Volcanic rock, alien glyph stone, glowing lava, and cyan crystal materials shared across all instances.
  4. Resource disposal: Complete cleanup of WebGL buffers, textures, materials, and event listeners on component unmount.
  5. RAF Loop Management: Single loop tracked with ID, preventing duplicate loops across restarts.
- **Verification**: Memory profiling, extended session loop check, clean restart verification.

---

### Phase 6: QA, Build & Delivery `[DONE]`
- **Tasks**:
  1. Run `npm run build` and resolve any bundling issues (completed with 0 errors).
  2. Verify HTTP 200 response on local dev server (port 5001).
  3. Soften scanlines and vignette in CSS to preserve visual clarity.
  4. Verify all documentation (`flow.md`, `architecture.md`, `task-tracker.md`, `README.md`).
  5. Commit and push changes to GitHub repository.
- **Verification**: Production build output, HTTP curl check, Git push verification.
