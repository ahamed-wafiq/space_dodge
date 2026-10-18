import * as THREE from 'three';

export class ObstaclePool {
  constructor(scene, onDodge) {
    this.scene = scene;
    this.onDodge = onDodge;

    this.activeObstacles = [];
    this.inactivePool = [];
    this.poolCapacity = 45;

    // Shared Geometries & Materials (ZERO allocations per spawn)
    this.sharedGeometries = [];
    this.sharedMaterials = [];

    this.initSharedResources();
    this.preallocatePool();

    // Spawning parameters & endless scaling
    this.spawnTimer = 0;
    this.minZDistance = 22; // Safe distance between obstacles in nearby lanes
    this.lastSpawnZ = -300;
    this.lastSafeLane = 0;
    this.totalDodged = 0;
  }

  initSharedResources() {
    // 1. Deformed Rocky Dodecahedron
    const geo1 = new THREE.DodecahedronGeometry(1.6, 1);
    this.displaceVertices(geo1, 0.35);
    geo1.computeVertexNormals();
    this.sharedGeometries.push({ geo: geo1, baseRadius: 1.5 });

    // 2. Faceted Jagged Icosahedron
    const geo2 = new THREE.IcosahedronGeometry(1.8, 0);
    this.displaceVertices(geo2, 0.45);
    geo2.computeVertexNormals();
    this.sharedGeometries.push({ geo: geo2, baseRadius: 1.7 });

    // 3. Elongated Oblong Asteroid
    const geo3 = new THREE.OctahedronGeometry(1.9, 1);
    geo3.scale(1.2, 0.7, 0.9);
    this.displaceVertices(geo3, 0.3);
    geo3.computeVertexNormals();
    this.sharedGeometries.push({ geo: geo3, baseRadius: 1.6 });

    // 4. Cyber Hazard Pylon / Space Barrier (Torus / Ring with hazard blocks)
    const geo4 = new THREE.TorusGeometry(1.5, 0.45, 8, 16);
    this.sharedGeometries.push({ geo: geo4, baseRadius: 1.8 });

    // Shared Materials
    // Mat 0: Dark Charcoal Rocky Asteroid
    const matRock = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true
    });
    this.sharedMaterials.push(matRock);

    // Mat 1: Magma Core Asteroid (Neon Orange Emissive)
    const matMagma = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      emissive: 0xff5500,
      emissiveIntensity: 0.65,
      roughness: 0.75,
      metalness: 0.3,
      flatShading: true
    });
    this.sharedMaterials.push(matMagma);

    // Mat 2: Cobalt Crystalline Asteroid (Neon Cyan Emissive)
    const matCobalt = new THREE.MeshStandardMaterial({
      color: 0x0c4a6e,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
      roughness: 0.6,
      metalness: 0.4,
      flatShading: true
    });
    this.sharedMaterials.push(matCobalt);

    // Mat 3: Cyber Hazard Pylon (Dark Metallic with Alert Neon)
    const matCyber = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0xff2a5f,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.85
    });
    this.sharedMaterials.push(matCyber);
  }

  displaceVertices(geometry, intensity) {
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      // Deterministic pseudo-random displacement using sin/cos noise
      const noise = Math.sin(vx * 3.5) * Math.cos(vy * 3.5) * Math.sin(vz * 3.5);
      const factor = 1 + noise * intensity;

      pos.setXYZ(i, vx * factor, vy * factor, vz * factor);
    }
  }

  preallocatePool() {
    for (let i = 0; i < this.poolCapacity; i++) {
      const item = this.createPooledMesh();
      item.mesh.visible = false;
      this.inactivePool.push(item);
    }
  }

  createPooledMesh() {
    const geoIndex = Math.floor(Math.random() * this.sharedGeometries.length);
    const matIndex = Math.floor(Math.random() * this.sharedMaterials.length);

    const geoDef = this.sharedGeometries[geoIndex];
    const mesh = new THREE.Mesh(geoDef.geo, this.sharedMaterials[matIndex]);

    const item = {
      mesh,
      geoDef,
      boundingSphere: new THREE.Sphere(new THREE.Vector3(), geoDef.baseRadius),
      rotSpeedX: 0,
      rotSpeedY: 0,
      rotSpeedZ: 0,
      hasScored: false
    };

    this.scene.add(mesh);
    return item;
  }

  spawn(speed, score, overrideZ) {
    let item;
    if (this.inactivePool.length > 0) {
      item = this.inactivePool.pop();
    } else {
      // Expand pool dynamically if ever needed
      item = this.createPooledMesh();
    }

    // Assign randomized shared geometry and material
    const geoIndex = Math.floor(Math.random() * this.sharedGeometries.length);
    const matIndex = Math.floor(Math.random() * this.sharedMaterials.length);
    item.geoDef = this.sharedGeometries[geoIndex];
    item.mesh.geometry = item.geoDef.geo;
    item.mesh.material = this.sharedMaterials[matIndex];

    // Scale variation: small, medium, large
    const scale = 0.75 + Math.random() * 0.95; // 0.75 to 1.7
    item.mesh.scale.set(scale, scale, scale);
    item.boundingSphere.radius = item.geoDef.baseRadius * scale * 0.88; // Fair collision radius

    // Rotation speeds
    item.rotSpeedX = (Math.random() - 0.5) * 2.2;
    item.rotSpeedY = (Math.random() - 0.5) * 2.5;
    item.rotSpeedZ = (Math.random() - 0.5) * 1.8;

    // Guaranteed Solvable Lane Algorithm:
    // Playable bounds: -13 to +13 (approx 26 units wide)
    // 7 virtual lanes: -11, -7.3, -3.6, 0, 3.6, 7.3, 11
    const lanes = [-11, -7.3, -3.6, 0, 3.6, 7.3, 11];
    
    // Choose a safe corridor lane that is guaranteed empty
    let safeLaneIdx = THREE.MathUtils.clamp(
      this.lastSafeLane + (Math.random() > 0.5 ? 1 : -1),
      0,
      lanes.length - 1
    );
    this.lastSafeLane = safeLaneIdx;

    // Pick a lane other than the safe lane for this obstacle
    let candidateLanes = lanes.filter((_, idx) => idx !== safeLaneIdx && idx !== (safeLaneIdx + 1) && idx !== (safeLaneIdx - 1));
    if (candidateLanes.length === 0) candidateLanes = lanes.filter((_, idx) => idx !== safeLaneIdx);

    const laneX = candidateLanes[Math.floor(Math.random() * candidateLanes.length)];
    // Add small jitter
    const xPos = laneX + (Math.random() - 0.5) * 1.2;
    const yPos = (Math.random() - 0.5) * 1.6; // Slight vertical drift
    const zPos = overrideZ !== undefined ? overrideZ : (-165 - Math.random() * 20);

    item.mesh.position.set(xPos, yPos, zPos);
    item.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    item.boundingSphere.center.copy(item.mesh.position);
    item.hasScored = false;
    item.mesh.visible = true;

    this.activeObstacles.push(item);
  }

  spawnInitialWave(speed = 38) {
    const initialDistances = [-55, -90, -125, -160, -195];
    for (const z of initialDistances) {
      this.spawn(speed, 0, z);
    }
  }

  update(delta, shipSpeed, score, shipPosition) {
    // 1. Spawning with progressive difficulty
    // Starts at ~1.05s, scales smoothly towards ~0.35s at very high scores
    const spawnInterval = Math.max(0.35, 1.05 / (1 + 0.0004 * score));
    this.spawnTimer += delta;

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawn(shipSpeed, score);

      // At higher scores, spawn extra staggered obstacle
      if (score > 1200 && Math.random() < Math.min(0.4, (score - 1200) * 0.0001)) {
        this.spawn(shipSpeed, score, -185);
      }
    }

    // 2. Move & Animate Active Obstacles
    const recycleThreshold = 25; // Passed behind camera at z=10
    const dodgeZ = shipPosition.z + 1.2;

    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const item = this.activeObstacles[i];

      // Move toward player in +Z
      item.mesh.position.z += shipSpeed * delta;

      // Tumbling rotation
      item.mesh.rotation.x += item.rotSpeedX * delta;
      item.mesh.rotation.y += item.rotSpeedY * delta;
      item.mesh.rotation.z += item.rotSpeedZ * delta;

      // Update collision bounding sphere
      item.boundingSphere.center.copy(item.mesh.position);

      // Check Dodge event (safely evaded player)
      if (!item.hasScored && item.mesh.position.z >= dodgeZ) {
        item.hasScored = true;
        this.totalDodged++;
        if (this.onDodge) {
          this.onDodge(item);
        }
      }

      // Recycle obstacle if passed behind the camera
      if (item.mesh.position.z > recycleThreshold) {
        item.mesh.visible = false;
        this.activeObstacles.splice(i, 1);
        this.inactivePool.push(item);
      }
    }
  }

  reset() {
    this.spawnTimer = 0;
    this.totalDodged = 0;
    this.lastSafeLane = 3;

    // Return all active obstacles back to the inactive pool cleanly
    for (let i = 0; i < this.activeObstacles.length; i++) {
      const item = this.activeObstacles[i];
      item.mesh.visible = false;
      this.inactivePool.push(item);
    }
    this.activeObstacles.length = 0;
  }

  dispose() {
    // Remove all meshes from scene
    for (const item of [...this.activeObstacles, ...this.inactivePool]) {
      this.scene.remove(item.mesh);
    }
    this.activeObstacles = [];
    this.inactivePool = [];

    // Dispose shared geometries
    for (const def of this.sharedGeometries) {
      def.geo.dispose();
    }
    this.sharedGeometries = [];

    // Dispose shared materials
    for (const mat of this.sharedMaterials) {
      mat.dispose();
    }
    this.sharedMaterials = [];
  }
}
