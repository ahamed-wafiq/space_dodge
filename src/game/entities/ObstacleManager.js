import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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

    // GLTF model templates loaded from Blender
    this.gateTemplate = null;
    this.pillarTemplate = null;

    this.initSharedResources();
    this.preallocatePool();
    this.loadGLTFModels();
  }

  loadGLTFModels() {
    const loader = new GLTFLoader();

    // 1. Load Alien Gate GLB
    loader.load(
      '/models/alien_gate.glb',
      (gltf) => {
        this.gateTemplate = gltf.scene;
        this.gateTemplate.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material && child.material.name && child.material.name.includes('Rune')) {
              child.material.emissiveIntensity = 3.5;
            } else if (child.material && child.material.name && child.material.name.includes('Amber')) {
              child.material.emissiveIntensity = 4.0;
            }
          }
        });
        // Attach to pool items that haven't been customized yet
        this.applyTemplateToPool('GATE', this.gateTemplate);
      },
      undefined,
      (err) => console.warn('GLTF alien gate fallback to procedural mesh:', err)
    );

    // 2. Load Stratified Rock Pillar GLB
    loader.load(
      '/models/rock_pillar.glb',
      (gltf) => {
        this.pillarTemplate = gltf.scene;
        this.pillarTemplate.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        this.applyTemplateToPool('PILLAR', this.pillarTemplate);
      },
      undefined,
      (err) => console.warn('GLTF rock pillar fallback to procedural mesh:', err)
    );
  }

  applyTemplateToPool(type, template) {
    const allItems = [...this.inactivePool, ...this.activeObstacles];
    for (const item of allItems) {
      if (type === 'GATE' && !item.gltfGate) {
        item.gltfGate = template.clone();
        item.gltfGate.visible = false;
        item.group.add(item.gltfGate);
        if (item.type === 'GATE' && item.group.visible) {
          item.gateGroup.visible = false;
          item.gltfGate.visible = true;
        }
      } else if (type === 'PILLAR' && !item.gltfPillar) {
        item.gltfPillar = template.clone();
        item.gltfPillar.visible = false;
        item.group.add(item.gltfPillar);
        if (item.type === 'PILLAR' && item.group.visible) {
          item.pillarMesh.visible = false;
          item.gltfPillar.visible = true;
        }
      }
    }
  }

  initSharedResources() {
    this.geos = {};
    this.mats = {};

    // 1. Basalt Stone Pillar (Multi-tiered Column with strata edges, H: 22, R: 1.7)
    this.geos.pillar = new THREE.CylinderGeometry(1.5, 1.9, 22, 9);
    this.geos.pillar.translate(0, 11, 0);

    // 2. Ancient Alien Ruin Gate (Compound: Left Pillar, Right Pillar, Top Lintel)
    this.geos.gatePillar = new THREE.BoxGeometry(2.2, 15, 3.2);
    this.geos.gatePillar.translate(0, 7.5, 0);

    this.geos.gateLintel = new THREE.BoxGeometry(11.0, 2.6, 3.6);
    this.geos.gateLintel.translate(0, 14.0, 0);

    this.geos.gateKeystone = new THREE.OctahedronGeometry(1.4, 0);
    this.geos.gateKeystone.translate(0, 12.2, 0);

    // 3. Jagged Rock Spire (Cone with vertex tilt, H: 16)
    this.geos.spire = new THREE.ConeGeometry(2.2, 17, 7);
    this.geos.spire.translate(0, 8.5, 0);

    // 4. Seismic Falling Boulder (Faceted fractured sphere)
    this.geos.boulder = new THREE.DodecahedronGeometry(2.3, 1);
    this.geos.boulder.scale(1.2, 1.0, 1.15);

    // 5. Alien Crystal Cluster (Prismatic glowing shards)
    this.geos.crystal = new THREE.ConeGeometry(1.3, 7.5, 5);
    this.geos.crystal.translate(0, 3.75, 0);

    // Shared Materials with Rich PBR Response
    // Basalt Stone Material (Dark charcoal slate with slight sheen)
    this.mats.basalt = new THREE.MeshStandardMaterial({
      color: 0x1f2430,
      roughness: 0.85,
      metalness: 0.22,
      flatShading: true
    });

    // Ancient Ruin Stone Material with Subtle Cyan Sigils
    this.mats.ancientGate = new THREE.MeshStandardMaterial({
      color: 0x1a1e2b,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.16,
      roughness: 0.72,
      metalness: 0.35,
      flatShading: true
    });

    // Glowing Rune Core Material
    this.mats.runeCore = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });

    // Volcanic Obsidian Spire Material
    this.mats.spire = new THREE.MeshStandardMaterial({
      color: 0x151821,
      roughness: 0.45,
      metalness: 0.65,
      flatShading: true
    });

    // Magma Cracked Boulder Material
    this.mats.boulder = new THREE.MeshStandardMaterial({
      color: 0x241724,
      emissive: 0xff4500,
      emissiveIntensity: 0.42,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true
    });

    // Luminescent Alien Crystal Material
    this.mats.crystal = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.35,
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

    // 1. Procedural Pillar Mesh
    const pillarMesh = new THREE.Mesh(this.geos.pillar, this.mats.basalt);
    pillarMesh.visible = false;
    group.add(pillarMesh);

    // 2. Procedural Ancient Gate Group
    const gateGroup = new THREE.Group();
    gateGroup.visible = false;

    const leftCol = new THREE.Mesh(this.geos.gatePillar, this.mats.ancientGate);
    leftCol.position.x = -4.4;
    const rightCol = new THREE.Mesh(this.geos.gatePillar, this.mats.ancientGate);
    rightCol.position.x = 4.4;
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

    // GLTF clone holders
    let gltfGate = null;
    if (this.gateTemplate) {
      gltfGate = this.gateTemplate.clone();
      gltfGate.visible = false;
      group.add(gltfGate);
    }

    let gltfPillar = null;
    if (this.pillarTemplate) {
      gltfPillar = this.pillarTemplate.clone();
      gltfPillar.visible = false;
      group.add(gltfPillar);
    }

    this.scene.add(group);

    return {
      group,
      pillarMesh,
      gateGroup,
      spireMesh,
      boulderMesh,
      crystalMesh,
      gltfGate,
      gltfPillar,
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

    // Hide all sub-meshes
    item.pillarMesh.visible = false;
    item.gateGroup.visible = false;
    item.spireMesh.visible = false;
    item.boulderMesh.visible = false;
    item.crystalMesh.visible = false;
    if (item.gltfGate) item.gltfGate.visible = false;
    if (item.gltfPillar) item.gltfPillar.visible = false;

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

    // Display appropriate visual mesh (GLTF preferred, procedural fallback)
    if (def.type === 'PILLAR') {
      if (item.gltfPillar) {
        item.gltfPillar.visible = true;
        item.gltfPillar.rotation.y = Math.random() * Math.PI;
      } else {
        item.pillarMesh.visible = true;
        item.pillarMesh.rotation.y = Math.random() * Math.PI;
      }
    } else if (def.type === 'GATE') {
      if (item.gltfGate) {
        item.gltfGate.visible = true;
      } else {
        item.gateGroup.visible = true;
      }
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
    // Generous runway on initial launch: first obstacle starts at -140 units (over 3.5s reaction time)
    const initialZ = [-140, -220, -300, -380];
    for (const z of initialZ) {
      const wave = this.patternEngine.generateWave(0);
      for (const def of wave) {
        this.spawnItem(def, z);
      }
    }
  }

  update(delta, shipSpeed, score, shipPosition) {
    // 1. Spawning with progressive distance spacing (guaranteeing spacious breathing room)
    const speed = shipSpeed * delta;
    this.distanceTraveledSinceSpawn = (this.distanceTraveledSinceSpawn || 0) + speed;

    const minWaveDistance = Math.max(68, 92 - (score * 0.003));
    if (this.distanceTraveledSinceSpawn >= minWaveDistance) {
      this.distanceTraveledSinceSpawn = 0;
      const wave = this.patternEngine.generateWave(score);
      const spawnZ = -260;
      for (const def of wave) {
        this.spawnItem(def, spawnZ);
      }
    }

    // 2. Move active obstacles toward camera and handle custom behaviors
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const item = this.activeObstacles[i];
      item.group.position.z += speed;

      // Falling boulder dynamics: triggers when player is within 85 units
      if (item.type === 'FALLING') {
        item.boulderMesh.rotation.x += item.rotSpeedX * delta;
        item.boulderMesh.rotation.y += item.rotSpeedY * delta;

        const distToShip = -(item.group.position.z - shipPosition.z);
        if (distToShip < 85 && !item.isFallingTriggered) {
          item.isFallingTriggered = true;
        }

        if (item.isFallingTriggered && item.group.position.y > 0) {
          item.velocityY -= delta * 36; // Gravity
          item.group.position.y += item.velocityY * delta;
          if (item.group.position.y < 0) {
            item.group.position.y = 0;
          }
        }
      }

      // 3. Dodge reward check (when obstacle safely passes behind spaceship)
      if (!item.hasScored && item.group.position.z > (shipPosition.z + 1.8)) {
        item.hasScored = true;
        this.totalDodged++;
        if (this.onDodge) {
          this.onDodge(item);
        }
      }

      // 4. Recycle obstacles when far behind camera (z > 25)
      if (item.group.position.z > 25) {
        item.group.visible = false;
        this.activeObstacles.splice(i, 1);
        this.inactivePool.push(item);
      }
    }
  }

  checkCollision(shipPosition, shipRadius = 0.95) {
    for (let i = 0; i < this.activeObstacles.length; i++) {
      const item = this.activeObstacles[i];
      const pos = item.group.position;

      // Quick Z distance cull
      const dz = Math.abs(pos.z - shipPosition.z);
      if (dz > 4.5) continue;

      if (item.type === 'GATE') {
        // Ancient Ruin Gate:
        // Doorway width: 6.4 * scale units wide, centered at pos.x
        const dx = shipPosition.x - pos.x;
        const dy = shipPosition.y;

        // Inside open door width & height? 100% SAFE fly-through!
        const safePortalWidth = 3.0 * item.scale;
        if (Math.abs(dx) < safePortalWidth && dy < (7.2 * item.scale)) {
          continue;
        }

        // Check if hitting left column, right column, or top lintel
        const colDist = 4.4 * item.scale;
        const hitLeftCol = Math.abs(dx - (-colDist)) < (1.1 * item.scale + shipRadius) && dz < (1.8 + shipRadius);
        const hitRightCol = Math.abs(dx - colDist) < (1.1 * item.scale + shipRadius) && dz < (1.8 + shipRadius);
        const hitTopLintel = Math.abs(dx) < (5.8 * item.scale) && dy > (7.2 * item.scale) && dz < (1.8 + shipRadius);

        if (hitLeftCol || hitRightCol || hitTopLintel) {
          return true;
        }
      } else if (item.type === 'PILLAR') {
        const dx = shipPosition.x - pos.x;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        const pillarRadius = 1.25 * item.scale;
        if (distXZ < (pillarRadius + shipRadius)) {
          return true;
        }
      } else if (item.type === 'SPIRE') {
        const dx = shipPosition.x - pos.x;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        const spireRadius = 1.15 * item.scale;
        if (distXZ < (spireRadius + shipRadius)) {
          return true;
        }
      } else if (item.type === 'FALLING') {
        const dx = shipPosition.x - pos.x;
        const dy = shipPosition.y - pos.y;
        const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const boulderRadius = 1.35 * item.scale;
        if (dist3D < (boulderRadius + shipRadius)) {
          return true;
        }
      } else if (item.type === 'CRYSTAL') {
        const dx = shipPosition.x - pos.x;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        const crystalRadius = 1.05 * item.scale;
        if (distXZ < (crystalRadius + shipRadius)) {
          return true;
        }
      }
    }

    return false;
  }

  reset() {
    this.spawnTimer = 0;
    this.distanceTraveledSinceSpawn = 0;
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

    for (const key of Object.keys(this.geos)) {
      if (this.geos[key]) this.geos[key].dispose();
    }
    for (const key of Object.keys(this.mats)) {
      if (this.mats[key]) this.mats[key].dispose();
    }
  }
}
