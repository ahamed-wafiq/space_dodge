# Space Dodge: Alien Canyon — Master Six-Phase Development Workflow

## Project Objective & Technology Stack
- **Objective**: Transform the game from an empty-space asteroid dodge into an immersive, production-grade 3D alien planetary canyon survival flight game. The player pilots a star interceptor through a volcanic alien trench filled with stone monoliths, ancient alien ruin gates, jagged spires, falling debris, and glowing crystal hazards with continuous progressive difficulty, zero-GC memory recycling, and procedural audio.
- **Technology Stack**:
  - **Core**: React 18, Vite 5, JavaScript (ES Modules, JSX)
  - **3D Graphics Engine**: Three.js r169 (WebGL, ACESFilmicToneMapping, FogExp2, Shader-grade lighting)
  - **Styling**: Pure Vanilla CSS with glassmorphism, CRT scanline aesthetics, and CSS variables
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

## Six Development Phases

### Phase 1: Audit and Planning `[DONE]`
- **Dependencies**: None.
- **Tasks**:
  1. Audit existing Three.js scene, entities, and lifecycle in `GameEngine.js`.
  2. Plan modular architecture: `PlanetEnvironment.js`, `TerrainSegment.js`, `ObstacleManager.js`, `ObstaclePatterns.js`, `Spaceship.js`, `CollisionSystem.js`.
  3. Design procedural geometries and shared materials for canyon walls, cracked volcanic terrain, stone pillars, alien ruin gates, and crystals.
  4. Update `flow.md`, `architecture.md`, `task-tracker.md`, and `README.md`.
- **Acceptance Criteria**: Architectural roadmap defined with zero dependency bloat.
- **Verification**: Code review and static architecture validation.

---

### Phase 2: 3D Alien Planet Environment `[DONE]`
- **Dependencies**: Phase 1.
- **Tasks**:
  1. Atmospheric Setup: Deep alien twilight fog (`THREE.FogExp2` with muted purple/obsidian tone `0x0f071e`), directional alien starlight, warm lava ground glow, and cyan crystal illumination.
  2. Procedural Canyon Trench: High-performance recycling `TerrainSegment` pipeline comprising volcanic cracked bedrock, glowing lava fissures, and flanking cliff walls ($X = \pm 18$).
  3. Overhead Alien Arches & Geological Strata: Massive stone bridges spanning the canyon.
  4. Atmospheric Floating Dust & Lava Sparks: Dynamic particle system creating the illusion of hot updrafts and alien atmospheric spores.
  5. Chase Camera & Lighting: Enhanced camera tracking with lateral banking and collision trauma shake.
- **Acceptance Criteria**:
  - Cohesive alien planet aesthetic: volcanic dark rock, purple atmospheric haze, cyan crystal highlights, orange lava veins.
  - Zero visible gaps or seams between cycling canyon segments.
- **Verification**: WebGL scene execution, visual validation, 60+ FPS stability.

---

### Phase 3: Endless Gameplay & Realistic Obstacles `[DONE]`
- **Dependencies**: Phase 2.
- **Tasks**:
  1. Implement reusable obstacle classes:
     - **Tall Stone Pillars**: Monolithic columns with irregular geometric profiles.
     - **Pillar Pairs / Slaloms**: Paired columns requiring rapid lateral steering.
     - **Ancient Alien Ruin Gates**: Massive arched gates with safe openings.
     - **Jagged Rock Spires**: Tilted obsidian needles rising from floor or walls.
     - **Falling Seismic Debris**: Overhead boulders that tremble and collapse as ship approaches.
     - **Glowing Alien Crystals**: Clustered crystal hazards offering near-miss combo boosts.
  2. Procedural Pattern Engine (`ObstaclePatterns.js`):
     - Curated obstacle patterns with algorithmic safe-lane solver ensuring at least one navigable route at all times.
  3. Progressive Difficulty Scaling:
     - Continuous uncapped speed scaling based on survival time and score.
     - Dynamic spawn interval scaling down to high-intensity reaction thresholds.
  4. Accurate 3D Collision Detection:
     - Multi-box and bounding cylinder hitboxes for ruin gates (openings are fully safe to fly through).
  5. Immediate Initial Route: Pre-populated obstacle corridor so action starts immediately upon mission launch.
- **Acceptance Criteria**:
  - Every obstacle pattern is guaranteed solvable; impossible walls are mathematically prevented.
  - Falling debris activates dynamically when the player approaches within reaction distance.
- **Verification**: Collision testing, passage through gate openings, difficulty scaling validation.

---

### Phase 4: Professional Sci-Fi UI/UX `[DONE]`
- **Dependencies**: Phase 3.
- **Tasks**:
  1. Update UI theme to "Alien Canyon Expeditions — Void Drift".
  2. Start Screen: Mission briefing for planetary canyon survival, controls guide, high score badge, audio toggle.
  3. Live Decoupled HUD: Direct-DOM 60 FPS update of score, velocity, survival timer, combo multiplier, and dodged count.
  4. Game Over Screen: Critical telemetry debrief (Distance Traveled, Canyon Obstacles Cleared, Max Velocity, New Record).
  5. Responsive touch steering pads for mobile/tablet.
  6. Keyboard shortcuts: `Space` and `Enter` for instant launch and restart.
- **Acceptance Criteria**:
  - UI accurately reflects real-time planetary flight telemetry with zero React re-render overhead.
- **Verification**: Responsive layout inspection, button interactions, keyboard trigger checks.

---

### Phase 5: Memory Management & Performance `[DONE]`
- **Dependencies**: Phase 4.
- **Tasks**:
  1. Object pooling for all canyon obstacles (pillars, gates, spires, falling rocks, crystals).
  2. Segment recycling: Passed canyon segments are shifted forward along $+Z$, preventing heap allocations.
  3. Shared geometries and materials: Volcanic rock, alien glyph stone, glowing lava, and cyan crystal materials shared across all instances.
  4. Resource disposal: Complete cleanup of WebGL buffers, textures, materials, and event listeners on component unmount.
  5. RAF Loop Management: Single loop tracked with ID, preventing duplicate loops across restarts.
- **Acceptance Criteria**:
  - Flat memory heap profile during extended gameplay sessions.
  - Zero garbage collection pauses or frame rate dips.
- **Verification**: Memory profiling, extended session loop check, clean restart verification.

---

### Phase 6: QA, Build & Delivery `[DONE]`
- **Dependencies**: Phase 1–5.
- **Tasks**:
  1. Run `npm run build` and resolve any bundling issues.
  2. Verify HTTP 200 response on local dev server (port 5001).
  3. Verify all documentation (`flow.md`, `architecture.md`, `task-tracker.md`, `README.md`).
  4. Commit and push changes to GitHub repository.
- **Acceptance Criteria**:
  - Clean production build with 0 errors.
  - All verified features documented with exact run commands.
- **Verification**: Production build output, HTTP curl check, Git push verification.

---

## Known Issues & Outstanding Risks
- **Browser Extension Injections**: Harmless `contentscript.js` logs from third-party browser extensions do not affect gameplay.
- **GitHub Remote Authentication**: Local credential helper configured to `manager`; authenticated push supported.
