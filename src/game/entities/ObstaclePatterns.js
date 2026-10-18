import * as THREE from 'three';

export class ObstaclePatterns {
  constructor() {
    // Distinct 3-Way Path System: Left (X = -7), Center (X = 0), Right (X = +7)
    // 7.0 units between path centers guarantees massive lateral breathing room for the ship
    this.paths = [-7.0, 0, 7.0];
    this.currentSafePath = 1; // Center path start
  }

  // Solvable 3-Way Path Solver: picks the next safe route guaranteeing fair lateral agility
  getNextSafePath() {
    // Pick next safe path (shift at most by 1 step: Left <-> Center <-> Right)
    const step = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    this.currentSafePath = THREE.MathUtils.clamp(this.currentSafePath + step, 0, 2);
    return this.currentSafePath;
  }

  // Generate an obstacle wave guaranteeing at least 1 or 2 paths are 100% open
  generateWave(score) {
    const safePathIdx = this.getNextSafePath();
    const safeX = this.paths[safePathIdx];

    const items = [];
    const roll = Math.random();

    // Archetype selection
    let hazardType = 'PILLAR';
    if (roll < 0.35) hazardType = 'PILLAR';
    else if (roll < 0.60) hazardType = 'GATE';
    else if (roll < 0.80) hazardType = 'SPIRE';
    else if (roll < 0.92) hazardType = 'FALLING';
    else hazardType = 'CRYSTAL';

    if (hazardType === 'GATE') {
      // Ancient Alien Gate: centered on one path, leaving the other 2 paths completely open,
      // while also offering a safe fly-through opening right through the archway!
      items.push({
        type: 'GATE',
        x: safeX,
        y: 0,
        scale: 0.75
      });
    } else {
      // Find the non-safe paths
      const blockedPathIndices = [0, 1, 2].filter(idx => idx !== safePathIdx);

      // Early / normal gameplay: block only 1 path, leaving 2 entire paths wide open!
      // High score (> 1500): 40% chance to block 2 paths, leaving 1 dedicated clear path
      const blockCount = (score > 1500 && Math.random() < 0.40) ? 2 : 1;
      const pathsToBlock = blockedPathIndices.slice(0, blockCount);

      for (const idx of pathsToBlock) {
        const posX = this.paths[idx];

        if (hazardType === 'PILLAR') {
          items.push({
            type: 'PILLAR',
            x: posX,
            y: 0,
            scale: 0.65 // Compact width ~2.2 units, perfectly contained inside the 7-unit path
          });
        } else if (hazardType === 'SPIRE') {
          items.push({
            type: 'SPIRE',
            x: posX,
            y: -1.0,
            scale: 0.75
          });
        } else if (hazardType === 'FALLING') {
          items.push({
            type: 'FALLING',
            x: posX,
            y: 20.0,
            scale: 0.80
          });
        } else if (hazardType === 'CRYSTAL') {
          items.push({
            type: 'CRYSTAL',
            x: posX,
            y: 0,
            scale: 0.75
          });
        }
      }
    }

    return items;
  }
}
