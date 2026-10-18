import * as THREE from 'three';
import { ObstaclePatterns } from './ObstaclePatterns';

export class ObstacleManager {
  constructor(scene, onDodge) {
    this.scene = scene;
    this.onDodge = onDodge;

    this.patternEngine = new ObstaclePatterns();
    this.activeObstacles = [];
    this.inactivePool = [];
    this.poolCapacity = 45;

    this.spawnTimer = 0;
    this.totalDodged = 0;

    this.initSharedResources();
    this.preallocatePool();
  }

  initSharedResources() {
    this.geos = {};
    this.mats = {};

    // 1. Basalt Stone Pillar (Octagonal Column, H: 22, R: 1.6)
    this.geos.pillar = new THREE.CylinderGeometry(1.4, 1.8, 22, 8);
    this.geos.pillar.translate(0, 11, 0); // Base at y=0

    // 2. Ancient Alien Ruin Gate (Compound: Left Pillar, Right Pillar, Top Lintel)
    // Left & Right Gate Pillars (W: 1.8, H: 14, D: 2.5)
    this.geos.gatePillar = new THREE.BoxGeometry(1.8, 14, 2.8);
    this.geos.gatePillar.translate(0, 7, 0);

    // Top Arch Lintel (W: 9.0, H: 2.2, D: 3.2)
    this.geos.gateLintel = new THREE.BoxGeometry(9.0, 2.2, 3.2);
    this.geos.gateLintel.translate(0, 12.8, 0);

    // Glowing Gate Keystone Rune
    this.geos.gateKeystone = new THREE.OctahedronGeometry(1.2, 0);
    this.geos.gateKeystone.translate(0, 11.2, 0);

    // 3. Jagged Rock Spire (Cone with vertex displacement)
    this.geos.spire = new THREE.ConeGeometry(2.0, 16, 6);
    this.geos.spire.translate(0, 8, 0);

    // 4. Seismic Falling Boulder
    this.geos.boulder = new THREE.DodecahedronGeometry(2.2, 1);
    this.geos.boulder.scale(1.2, 1.0, 1.1);

    // 5. Alien Crystal Cluster
    this.geos.crystal = new THREE.ConeGeometry(1.2, 7.0, 5);
    this.geos.crystal.translate(0, 3.5, 0);

    // Shared Materials
    // Basalt Stone Material
    this.mats.basalt = new THREE.MeshStandardMaterial({
      color: 0x221a2e,
      roughness: 0.85,
      metalness: 0.2,
      flatShading: true
    });

    // Ancient Ruin Stone Material with Subtle Cyan Sigils
    this.mats.ancientGate = new THREE.MeshStandardMaterial({
      color: 0x1f1930,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.18,
      roughness: 0.7,
      metalness: 0.35,
      flatShading: true
    });

    // Glowing Rune Core Material
    this.mats.runeCore = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });

    // Volcanic Obsidian Spire Material (Dark Glossy Slate)
    this.mats.spire = new THREE.MeshStandardMaterial({
      color: 0x130e1c,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true
    });

    // Magma Cracked Boulder Material
    this.mats.boulder = new THREE.MeshStandardMaterial({
      color: 0x2c1520,
      emissive: 0xff4500,
      emissiveIntensity: 0.45,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true
    });

    // Luminescent Alien Crystal Material
    this.mats.crystal = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.95
    });
  }

  preallocatePool() {
    for (let i = 0; i < this.poolCapacity; i++) {
      const item = this.createPooledContainer();
      item.group.visible = false;
      this.inactivePool.push(item);
    }
  }

  createPooledContainer() {
    const group = new THREE.Group();

    // 1. Pillar Mesh
    const pillarMesh = new THREE.Mesh(this.geos.pillar, this.mats.basalt);
    pillarMesh.visible = false;
    group.add(pillarMesh);

    // 2. Ancient Gate Group (Compound: Left, Right, Lintel, Rune)
    const gateGroup = new THREE.Group();
    gateGroup.visible = false;

    const leftCol = new THREE.Mesh(this.geos.gatePillar, this.mats.ancientGate);
    leftCol.position.x = -3.8;
    const rightCol = new THREE.Mesh(this.geos.gatePillar, this.mats.ancientGate);
    rightCol.position.x = 3.8;
    const lintel = new THREE.Mesh(this.geos.gateLintel, this.mats.ancientGate);
    const keystone = new THREE.Mesh(this.geos.gateKeystone, this.mats.runeCore);

    gateGroup.add(leftCol, rightCol, lintel, keystone);
    group.add(gateGroup);

    // 3. Spire Mesh
    const spireMesh = new THREE.Mesh(this.geos.spire, this.mats.spire);
    spireMesh.visible = false;
    group.add(spireMesh);

    // 4. Boulder Mesh
    const boulderMesh = new THREE.Mesh(this.geos.boulder, this.mats.boulder);
    boulderMesh.visible = false;
    group.add(boulderMesh);

    // 5. Crystal Mesh
    const crystalMesh = new THREE.Mesh(this.geos.crystal, this.mats.crystal);
    crystalMesh.visible = false;
    group.add(crystalMesh);

    this.scene.add(group);

    return {
      group,
      pillarMesh,
      gateGroup,
      spireMesh,
      boulderMesh,
      crystalMesh,
      type: null,
      x: 0,
      y: 0,
      z: 0,
      scale: 1,
      velocityY: 0,
      isFallingTriggered: false,
      rotSpeedX: 0,
      rotSpeedY: 0,
      hasScored: false
    };
  }

  spawnItem(def, spawnZ) {
    let item;
    if (this.inactivePool.length > 0) {
      item = this.inactivePool.pop();
    } else {
      item = this.createPooledContainer();
    }

    // Hide all sub-meshes first
    item.pillarMesh.visible = false;
    item.gateGroup.visible = false;
    item.spireMesh.visible = false;
    item.boulderMesh.visible = false;
    item.crystalMesh.visible = false;

    item.type = def.type;
    item.x = def.x;
    item.y = def.y;
    item.z = spawnZ;
    item.scale = def.scale || 1.0;
    item.hasScored = false;
    item.velocityY = 0;
    item.isFallingTriggered = false;

    item.group.position.set(item.x, item.y, item.z);
    item.group.scale.set(item.scale, item.scale, item.scale);
    item.group.rotation.set(0, 0, 0);

    // Show appropriate sub-mesh
    if (def.type === 'PILLAR') {
      item.pillarMesh.visible = true;
      item.pillarMesh.rotation.y = Math.random() * Math.PI;
    } else if (def.type === 'GATE') {
      item.gateGroup.visible = true;
    } else if (def.type === 'SPIRE') {
      item.spireMesh.visible = true;
      item.spireMesh.rotation.set((Math.random() - 0.5) * 0.35, Math.random() * Math.PI, (Math.random() - 0.5) * 0.35);
    } else if (def.type === 'FALLING') {
      item.boulderMesh.visible = true;
      item.rotSpeedX = 1.5 + Math.random() * 2.0;
      item.rotSpeedY = 1.0 + Math.random() * 2.0;
    } else if (def.type === 'CRYSTAL') {
      item.crystalMesh.visible = true;
      item.crystalMesh.rotation.set(0.2, Math.random() * Math.PI, -0.2);
    }

    item.group.visible = true;
    this.activeObstacles.push(item);
  }

  spawnInitialWave(speed = 38) {
    const initialZ = [-55, -95, -135, -175, -215];
    for (const z of initialZ) {
      const wave = this.patternEngine.generateWave(0);
      for (const def of wave) {
        this.spawnItem(def, z);
      }
    }
  }

  update(delta, shipSpeed, score, shipPosition) {
    // 1. Spawning with progressive difficulty
    const spawnInterval = Math.max(0.32, 1.1 / (1 + 0.00045 * score));
    this.spawnTimer += delta;

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      const wave = this.patternEngine.generateWave(score);
      const spawnZ = -170 - Math.random() * 20;
      for (const def of wave) {
        this.spawnItem(def, spawnZ);
      }
    }

    // 2. Move & Animate Active Obstacles
    const recycleThreshold = 25;
    const dodgeZ = shipPosition.z + 1.2;

    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const item = this.activeObstacles[i];

      // Move toward player along +Z
      item.group.position.z += shipSpeed * delta;

      // Handle falling boulder seismic trigger
      if (item.type === 'FALLING') {
        const distZ = Math.abs(item.group.position.z - shipPosition.z);
        if (distZ < 90) {
          item.isFallingTriggered = true;
        }

        if (item.isFallingTriggered && item.group.position.y > -1.0) {
          item.velocityY += delta * 24; // Gravity acceleration
          item.group.position.y -= item.velocityY * delta;
          if (item.group.position.y < -1.0) {
            item.group.position.y = -1.0;
          }
        }

        // Boulder tumble rotation
        item.boulderMesh.rotation.x += item.rotSpeedX * delta;
        item.boulderMesh.rotation.y += item.rotSpeedY * delta;
      }

      // Check Dodge event (safely cleared player)
      if (!item.hasScored && item.group.position.z >= dodgeZ) {
        item.hasScored = true;
        this.totalDodged++;
        if (this.onDodge) {
          this.onDodge(item);
        }
      }

      // Recycle obstacle behind camera
      if (item.group.position.z > recycleThreshold) {
        item.group.visible = false;
        this.activeObstacles.splice(i, 1);
        this.inactivePool.push(item);
      }
    }
  }

  // Precise 3D Collision Detection
  checkCollision(shipPosition, shipRadius = 1.25) {
    for (let i = 0; i < this.activeObstacles.length; i++) {
      const item = this.activeObstacles[i];
      const pos = item.group.position;

      // Quick Z distance cull
      const dz = Math.abs(pos.z - shipPosition.z);
      if (dz > 4.5) continue;

      if (item.type === 'GATE') {
        // Compound Ancient Ruin Gate collision:
        // Left Column: centered at pos.x - 3.8
        // Right Column: centered at pos.x + 3.8
        // Top Lintel: centered at pos.y + 12.8
        // Safe Open Gateway: X between [pos.x - 2.8, pos.x + 2.8], Y under 6.0
        const dx = shipPosition.x - pos.x;
        const dy = shipPosition.y;

        // Inside open door width & height? SAFE!
        if (Math.abs(dx) < 2.7 && dy < 5.8) {
          continue; // Safely navigating through gate archway!
        }

        // Check if hitting left column
        const hitLeftCol = Math.abs(dx - (-3.8)) < (0.95 + shipRadius) && dz < (1.5 + shipRadius);
        // Check if hitting right column
        const hitRightCol = Math.abs(dx - 3.8) < (0.95 + shipRadius) && dz < (1.5 + shipRadius);
        // Check if hitting top lintel
        const hitTopLintel = Math.abs(dx) < 4.5 && dy > 5.5 && dz < (1.6 + shipRadius);

        if (hitLeftCol || hitRightCol || hitTopLintel) {
          return true;
        }
      } else if (item.type === 'PILLAR') {
        // Cylindrical distance test (X & Z)
        const dx = shipPosition.x - pos.x;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        const pillarRadius = 1.55 * item.scale;
        if (distXZ < (pillarRadius + shipRadius)) {
          return true;
        }
      } else if (item.type === 'SPIRE') {
        // Tilted spire collision
        const dx = shipPosition.x - pos.x;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        const spireRadius = 1.65 * item.scale;
        if (distXZ < (spireRadius + shipRadius)) {
          return true;
        }
      } else if (item.type === 'FALLING') {
        // Sphere distance test in 3D
        const dx = shipPosition.x - pos.x;
        const dy = shipPosition.y - pos.y;
        const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const boulderRadius = 2.1 * item.scale;
        if (dist3D < (boulderRadius + shipRadius)) {
          return true;
        }
      } else if (item.type === 'CRYSTAL') {
        // Crystal cluster test
        const dx = shipPosition.x - pos.x;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        const crystalRadius = 1.35 * item.scale;
        if (distXZ < (crystalRadius + shipRadius)) {
          return true;
        }
      }
    }

    return false;
  }

  reset() {
    this.spawnTimer = 0;
    this.totalDodged = 0;

    for (let i = 0; i < this.activeObstacles.length; i++) {
      const item = this.activeObstacles[i];
      item.group.visible = false;
      this.inactivePool.push(item);
    }
    this.activeObstacles.length = 0;
  }

  dispose() {
    for (const item of [...this.activeObstacles, ...this.inactivePool]) {
      this.scene.remove(item.group);
    }
    this.activeObstacles = [];
    this.inactivePool = [];

    // Dispose shared geometries
    for (const key of Object.keys(this.geos)) {
      if (this.geos[key]) this.geos[key].dispose();
    }
    // Dispose shared materials
    for (const key of Object.keys(this.mats)) {
      if (this.mats[key]) this.mats[key].dispose();
    }
  }
}
