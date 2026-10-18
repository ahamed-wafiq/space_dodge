import * as THREE from 'three';

export class TerrainSegment {
  constructor(scene, length = 160, sharedResources) {
    this.scene = scene;
    this.length = length;
    this.shared = sharedResources;
    this.group = new THREE.Group();

    this.buildFloor();
    this.buildCanyonWalls();
    this.buildOverheadArch();
    this.buildLedgeCrystals();

    this.scene.add(this.group);
  }

  buildFloor() {
    // 1. Volcanic Bedrock Ground Plane
    const floorMesh = new THREE.Mesh(this.shared.floorGeo, this.shared.basaltMat);
    floorMesh.position.set(0, -2.5, -this.length / 2);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // 2. Central Magma Lava Fissure Ribbon
    const lavaMesh = new THREE.Mesh(this.shared.lavaGeo, this.shared.lavaMat);
    lavaMesh.position.set(0, -2.44, -this.length / 2);
    lavaMesh.rotation.x = -Math.PI / 2;
    this.group.add(lavaMesh);

    // 3. Flanking Lava Crack Lines (subtle glowing veins)
    const leftCrack = new THREE.Mesh(this.shared.subLavaGeo, this.shared.lavaMat);
    leftCrack.position.set(-7.5, -2.43, -this.length / 2);
    leftCrack.rotation.x = -Math.PI / 2;
    const rightCrack = new THREE.Mesh(this.shared.subLavaGeo, this.shared.lavaMat);
    rightCrack.position.set(7.5, -2.43, -this.length / 2);
    rightCrack.rotation.x = -Math.PI / 2;
    this.group.add(leftCrack, rightCrack);
  }

  buildCanyonWalls() {
    // Flanking cliff walls on Left (X = -18) and Right (X = +18)
    // Left Wall
    const leftWall = new THREE.Mesh(this.shared.wallGeo, this.shared.rockCliffMat);
    leftWall.position.set(-18.5, 12, -this.length / 2);
    leftWall.rotation.y = 0;
    this.group.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(this.shared.wallGeo, this.shared.rockCliffMat);
    rightWall.position.set(18.5, 12, -this.length / 2);
    rightWall.rotation.y = Math.PI;
    this.group.add(rightWall);

    // Additional rocky buttresses along the wall to create organic silhouette
    const buttressZ = [-25, -65, -105, -145];
    for (let i = 0; i < buttressZ.length; i++) {
      const z = buttressZ[i];
      // Left rocky jut
      const leftButtress = new THREE.Mesh(this.shared.buttressGeo, this.shared.rockCliffMat);
      leftButtress.position.set(-17.2, 8, z);
      leftButtress.rotation.set((i % 2) * 0.2, (i * 0.7), 0.1);
      leftButtress.scale.set(1.4, 1.8, 1.4);
      this.group.add(leftButtress);

      // Right rocky jut
      const rightButtress = new THREE.Mesh(this.shared.buttressGeo, this.shared.rockCliffMat);
      rightButtress.position.set(17.2, 8, z - 15);
      rightButtress.rotation.set(-(i % 2) * 0.2, -(i * 0.7), -0.1);
      rightButtress.scale.set(1.5, 1.7, 1.3);
      this.group.add(rightButtress);
    }
  }

  buildOverheadArch() {
    // Majestic alien stone bridge spanning high over the canyon (Y = 17, well above flight path)
    const arch = new THREE.Mesh(this.shared.overheadArchGeo, this.shared.ancientStoneMat);
    arch.position.set(0, 16.5, -this.length * 0.5);
    this.group.add(arch);
  }

  buildLedgeCrystals() {
    // Glowing cyan alien crystals nestled on canyon wall niches
    const crystalSpots = [
      { x: -16.8, y: 3.5, z: -35 },
      { x: 16.8, y: 5.0, z: -85 },
      { x: -16.5, y: 4.2, z: -125 }
    ];

    for (const spot of crystalSpots) {
      const crystalCluster = new THREE.Mesh(this.shared.crystalClusterGeo, this.shared.cyanCrystalMat);
      crystalCluster.position.set(spot.x, spot.y, spot.z);
      crystalCluster.rotation.set(0.3, Math.random() * Math.PI, (spot.x > 0 ? -0.4 : 0.4));
      crystalCluster.scale.set(1.2, 1.5, 1.2);
      this.group.add(crystalCluster);
    }
  }

  setPositionZ(z) {
    this.group.position.z = z;
  }

  getPositionZ() {
    return this.group.position.z;
  }

  translateZ(amount) {
    this.group.position.z += amount;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
