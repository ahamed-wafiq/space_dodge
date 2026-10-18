import * as THREE from 'three';

export class ObstaclePatterns {
  constructor() {
    // 7 virtual flight corridors across playable canyon width [-13, +13]
    this.lanes = [-10.5, -7.0, -3.5, 0, 3.5, 7.0, 10.5];
    this.currentSafeLane = 3; // Center start
  }

  // Solvable Corridor Solver: picks the next safe lane within reachable agility
  getNextSafeLane() {
    // Change lane by at most 1 or 2 slots to guarantee reachability at any speed
    const step = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    let next = this.currentSafeLane + step;

    // Occasionally shift by 2 if in wide lanes
    if (Math.random() < 0.3) {
      next += (Math.random() > 0.5 ? 1 : -1);
    }

    this.currentSafeLane = THREE.MathUtils.clamp(next, 0, this.lanes.length - 1);
    return this.currentSafeLane;
  }

  // Generate an obstacle wave guaranteed to leave the safe lane open
  generateWave(score) {
    const safeIdx = this.getNextSafeLane();
    const safeX = this.lanes[safeIdx];

    // Pick obstacle wave type
    // High score introduces more complex archetypes
    const roll = Math.random();
    let type = 'PILLAR';

    if (roll < 0.32) {
      type = 'PILLAR'; // Single or paired tall pillars
    } else if (roll < 0.58) {
      type = 'GATE'; // Ancient alien ruin gate centered around safe opening
    } else if (roll < 0.80) {
      type = 'SPIRE'; // Jagged rock spires
    } else if (roll < 0.92) {
      type = 'FALLING'; // Seismic falling boulder in non-safe lane
    } else {
      type = 'CRYSTAL'; // Alien crystal hazard
    }

    const items = [];

    if (type === 'GATE') {
      // Ancient Ruin Gate: centered such that safeX is the open portal!
      items.push({
        type: 'GATE',
        x: safeX,
        y: 0,
        scale: 1.0
      });
    } else if (type === 'PILLAR') {
      // Place pillars in 1 or 2 non-safe lanes
      const availableLanes = this.lanes
        .map((x, idx) => ({ x, idx }))
        .filter(l => Math.abs(l.idx - safeIdx) >= 1);

      // 1 or 2 pillars
      const count = (score > 1000 && Math.random() < 0.5) ? 2 : 1;
      const shuffled = availableLanes.sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        items.push({
          type: 'PILLAR',
          x: shuffled[i].x + (Math.random() - 0.5) * 0.8,
          y: 0,
          scale: 0.85 + Math.random() * 0.4
        });
      }
    } else if (type === 'SPIRE') {
      // Jagged spires placed in non-safe lanes
      const availableLanes = this.lanes.filter((_, idx) => Math.abs(idx - safeIdx) >= 1);
      const x = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      items.push({
        type: 'SPIRE',
        x: x + (Math.random() - 0.5) * 1.0,
        y: -1.0,
        scale: 1.0 + Math.random() * 0.5
      });
    } else if (type === 'FALLING') {
      // Falling boulder suspended high, drops as player nears
      const availableLanes = this.lanes.filter((_, idx) => Math.abs(idx - safeIdx) >= 1);
      const x = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      items.push({
        type: 'FALLING',
        x: x,
        y: 18.0, // Starts high up, falls down
        scale: 1.3 + Math.random() * 0.5
      });
    } else {
      // Crystal formation
      const availableLanes = this.lanes.filter((_, idx) => Math.abs(idx - safeIdx) >= 1);
      const x = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      items.push({
        type: 'CRYSTAL',
        x: x,
        y: 0,
        scale: 1.1 + Math.random() * 0.4
      });
    }

    return items;
  }
}
