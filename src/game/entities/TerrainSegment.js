import * as THREE from 'three';

export class TerrainSegment {
  constructor(scene, length = 160, sharedResources) {
    this.scene = scene;
    this.length = length;
    this.shared = sharedResources;
    this.group = new THREE.Group();

    this.buildFloor();
    this.buildFlightPathIndicators();
    this.buildCanyonWalls();
    this.buildOverheadArch();
    this.buildLedgeCrystals();

    this.scene.add(this.group);
  }

  buildFloor() {
    // 1. Natural Volcanic Basalt Bedrock Ground Plane (Full canyon floor)
    const floorMesh = new THREE.Mesh(this.shared.floorGeo, this.shared.basaltMat);
    floorMesh.position.set(0, -2.5, -this.length / 2);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // 2. Selective subtle magma fissure cracks (thin, organic, NOT dominating)
    const leftCrack = new THREE.Mesh(this.shared.subLavaGeo, this.shared.lavaMat);
    leftCrack.position.set(-6.5, -2.44, -this.length / 2);
    leftCrack.rotation.x = -Math.PI / 2;

    const rightCrack = new THREE.Mesh(this.shared.subLavaGeo, this.shared.lavaMat);
    rightCrack.position.set(6.5, -2.44, -this.length / 2);
    rightCrack.rotation.x = -Math.PI / 2;

    this.group.add(leftCrack, rightCrack);
  }

  buildFlightPathIndicators() {
    // Replaces the giant flat orange polygon with a sleek, subtle flight corridor

    // 1. Subtle glowing centerline route indicator (thin ribbon)
    const centerLine = new THREE.Mesh(this.shared.centerRouteGeo, this.shared.routeGuideMat);
    centerLine.position.set(0, -2.42, -this.length / 2);
    centerLine.rotation.x = -Math.PI / 2;
    this.group.add(centerLine);

    // 2. Flight corridor boundary edge markers (thin cyan guidance lines at X = +/-12)
    const leftBoundary = new THREE.Mesh(this.shared.boundaryGeo, this.shared.boundaryMat);
    leftBoundary.position.set(-12.5, -2.41, -this.length / 2);
    leftBoundary.rotation.x = -Math.PI / 2;

    const rightBoundary = new THREE.Mesh(this.shared.boundaryGeo, this.shared.boundaryMat);
    rightBoundary.position.set(12.5, -2.41, -this.length / 2);
    rightBoundary.rotation.x = -Math.PI / 2;

    this.group.add(leftBoundary, rightBoundary);
  }

  buildCanyonWalls() {
    // Flanking multi-tiered cliff walls on Left (X = -19) and Right (X = +19)
    const leftWall = new THREE.Mesh(this.shared.wallGeo, this.shared.rockCliffMat);
    leftWall.position.set(-19.0, 13, -this.length / 2);
    leftWall.rotation.y = 0;
    this.group.add(leftWall);

    const rightWall = new THREE.Mesh(this.shared.wallGeo, this.shared.rockCliffMat);
    rightWall.position.set(19.0, 13, -this.length / 2);
    rightWall.rotation.y = Math.PI;
    this.group.add(rightWall);

    // Columnar basalt outcroppings and stone pillars jutting from the canyon walls
    const buttressZ = [-20, -55, -90, -125, -150];
    for (let i = 0; i < buttressZ.length; i++) {
      const z = buttressZ[i];
      // Left rocky spire / buttress
      const leftButtress = new THREE.Mesh(this.shared.buttressGeo, this.shared.rockCliffMat);
      leftButtress.position.set(-17.5, 9, z);
      leftButtress.rotation.set((i % 2) * 0.15, (i * 0.8), 0.08);
      leftButtress.scale.set(1.3, 1.9, 1.3);
      this.group.add(leftButtress);

      // Right rocky spire / buttress
      const rightButtress = new THREE.Mesh(this.shared.buttressGeo, this.shared.rockCliffMat);
      rightButtress.position.set(17.5, 9, z - 16);
      rightButtress.rotation.set(-(i % 2) * 0.15, -(i * 0.8), -0.08);
      rightButtress.scale.set(1.4, 1.8, 1.2);
      this.group.add(rightButtress);
    }
  }

  buildOverheadArch() {
    // Ancient alien stone bridge spanning high over the canyon (Y = 17, safely above flight corridor)
    const arch = new THREE.Mesh(this.shared.overheadArchGeo, this.shared.ancientStoneMat);
    arch.position.set(0, 17.0, -this.length * 0.5);
    this.group.add(arch);
  }

  buildLedgeCrystals() {
    // Glowing cyan alien crystals nestled in canyon wall niches
    const crystalSpots = [
      { x: -17.2, y: 3.8, z: -35 },
      { x: 17.2, y: 5.2, z: -80 },
      { x: -17.0, y: 4.5, z: -125 }
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
