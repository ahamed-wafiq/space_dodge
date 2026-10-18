import * as THREE from 'three';

export class ObstaclePatterns {
  constructor() {
    // 5 spacious flight lanes across playable canyon width [-13, +13]
    // 5.0 units between lane centers guarantees ample lateral space for the ship
    this.lanes = [-10.0, -5.0, 0, 5.0, 10.0];
    this.currentSafeLane = 2; // Center lane start
  }

  // Solvable Corridor Solver: picks the next safe lane with smooth reachable agility
  getNextSafeLane() {
    const step = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    let next = this.currentSafeLane + step;

    // Keep safe lane comfortably within bounds
    this.currentSafeLane = THREE.MathUtils.clamp(next, 0, this.lanes.length - 1);
    return this.currentSafeLane;
  }

  // Generate an obstacle wave guaranteed to leave the safe lane open and spacious
  generateWave(score) {
    const safeIdx = this.getNextSafeLane();
    const safeX = this.lanes[safeIdx];

    const roll = Math.random();
    let type = 'PILLAR';

    if (roll < 0.32) {
      type = 'PILLAR';
    } else if (roll < 0.58) {
      type = 'GATE';
    } else if (roll < 0.78) {
      type = 'SPIRE';
    } else if (roll < 0.90) {
      type = 'FALLING';
    } else {
      type = 'CRYSTAL';
    }

    const items = [];

    if (type === 'GATE') {
      // Ancient Ruin Gate: centered directly on safe lane so the open portal is the fly-through route!
      items.push({
        type: 'GATE',
        x: safeX,
        y: 0,
        scale: 0.8
      });
    } else if (type === 'PILLAR') {
      // Place pillars in 1 non-safe lane (or 2 at high scores), leaving ample side space
      const availableLanes = this.lanes
        .map((x, idx) => ({ x, idx }))
        .filter(l => Math.abs(l.idx - safeIdx) >= 1);

      const count = (score > 1200 && Math.random() < 0.45) ? 2 : 1;
      const shuffled = availableLanes.sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        items.push({
          type: 'PILLAR',
          x: shuffled[i].x,
          y: 0,
          scale: 0.65 + Math.random() * 0.15 // Scaled to ~2.5 units width, leaving 2.5+ units clear space in lane
        });
      }
    } else if (type === 'SPIRE') {
      const availableLanes = this.lanes.filter((_, idx) => Math.abs(idx - safeIdx) >= 1);
      const x = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      items.push({
        type: 'SPIRE',
        x: x,
        y: -1.0,
        scale: 0.75 + Math.random() * 0.2
      });
    } else if (type === 'FALLING') {
      const availableLanes = this.lanes.filter((_, idx) => Math.abs(idx - safeIdx) >= 1);
      const x = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      items.push({
        type: 'FALLING',
        x: x,
        y: 20.0, // Drops from high above as player nears
        scale: 0.8 + Math.random() * 0.2
      });
    } else {
      const availableLanes = this.lanes.filter((_, idx) => Math.abs(idx - safeIdx) >= 1);
      const x = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      items.push({
        type: 'CRYSTAL',
        x: x,
        y: 0,
        scale: 0.75 + Math.random() * 0.2
      });
    }

    return items;
  }
}
