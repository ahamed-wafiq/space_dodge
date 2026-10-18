import * as THREE from 'three';
import { getRadialGlowTexture } from '../utils/textures';

export class Spaceship {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Movement state
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = 0;
    this.targetVelocity = 0;
    this.speed = 32; // Horizontal agility
    this.boundsX = 14; // Horizontal boundary

    // Collision sphere
    this.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.25);

    // Track allocated resources for clean disposal
    this.disposables = [];

    this.createShipMesh();
    this.createThrusterFlames();
    this.createEngineParticles();

    this.group.position.set(0, 0, 0);
    this.scene.add(this.group);
  }

  createShipMesh() {
    // 1. Sleek Central Fuselage
    const hullGeo = new THREE.ConeGeometry(0.9, 4.2, 5);
    hullGeo.rotateX(Math.PI / 2);
    hullGeo.scale(1.2, 0.6, 1);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.25,
      flatShading: true
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.z = 0;
    this.group.add(hull);
    this.disposables.push(hullGeo, hullMat);

    // 2. Cockpit Canopy with Neon Glow
    const cockpitGeo = new THREE.ConeGeometry(0.42, 1.8, 4);
    cockpitGeo.rotateX(Math.PI / 2);
    cockpitGeo.scale(1.0, 0.65, 1.0);
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.32, -0.4);
    this.group.add(cockpit);
    this.disposables.push(cockpitGeo, cockpitMat);

    // 3. Swept-Back Main Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0.4);
    wingShape.lineTo(3.2, -1.2);
    wingShape.lineTo(3.1, -1.8);
    wingShape.lineTo(0.6, -1.3);
    wingShape.lineTo(0, -1.6);
    wingShape.lineTo(-0.6, -1.3);
    wingShape.lineTo(-3.1, -1.8);
    wingShape.lineTo(-3.2, -1.2);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeo.rotateX(Math.PI / 2);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.7,
      roughness: 0.3
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0, 0.4);
    this.group.add(wings);
    this.disposables.push(wingGeo, wingMat);

    // 4. Neon Wingtip Glow Strips
    const glowStripGeo = new THREE.BoxGeometry(0.12, 0.08, 1.2);
    const glowStripMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });
    const leftStrip = new THREE.Mesh(glowStripGeo, glowStripMat);
    leftStrip.position.set(-3.05, 0.05, 0.8);
    const rightStrip = new THREE.Mesh(glowStripGeo, glowStripMat);
    rightStrip.position.set(3.05, 0.05, 0.8);
    this.group.add(leftStrip, rightStrip);
    this.disposables.push(glowStripGeo, glowStripMat);

    // 5. Twin Engine Thruster Housings
    const engineGeo = new THREE.CylinderGeometry(0.28, 0.32, 1.2, 8);
    engineGeo.rotateX(Math.PI / 2);
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      metalness: 0.9,
      roughness: 0.2
    });

    const leftEngine = new THREE.Mesh(engineGeo, engineMat);
    leftEngine.position.set(-0.7, 0, 1.6);
    const rightEngine = new THREE.Mesh(engineGeo, engineMat);
    rightEngine.position.set(0.7, 0, 1.6);
    this.group.add(leftEngine, rightEngine);
    this.disposables.push(engineGeo, engineMat);
  }

  createThrusterFlames() {
    // Twin Glowing Plasma Thruster Cones
    const flameGeo = new THREE.ConeGeometry(0.24, 1.4, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9
    });

    this.leftFlame = new THREE.Mesh(flameGeo, flameMat);
    this.leftFlame.position.set(-0.7, 0, 2.5);

    this.rightFlame = new THREE.Mesh(flameGeo, flameMat);
    this.rightFlame.position.set(0.7, 0, 2.5);

    this.group.add(this.leftFlame, this.rightFlame);
    this.disposables.push(flameGeo, flameMat);

    // Inner bright core flame
    const innerFlameGeo = new THREE.ConeGeometry(0.12, 1.0, 8);
    innerFlameGeo.rotateX(-Math.PI / 2);
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });

    this.leftInnerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    this.leftInnerFlame.position.set(-0.7, 0, 2.3);

    this.rightInnerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    this.rightInnerFlame.position.set(0.7, 0, 2.3);

    this.group.add(this.leftInnerFlame, this.rightInnerFlame);
    this.disposables.push(innerFlameGeo, innerFlameMat);
  }

  createEngineParticles() {
    this.particleCount = 50;
    this.particlesGeo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleLife = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      this.resetParticle(i, true);
    }

    this.particlesGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    this.particlesMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.35,
      map: getRadialGlowTexture(),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.engineParticleSystem = new THREE.Points(this.particlesGeo, this.particlesMat);
    this.group.add(this.engineParticleSystem);
    this.disposables.push(this.particlesGeo, this.particlesMat);
  }

  resetParticle(index, randomizeZ = false) {
    const i3 = index * 3;
    const side = index % 2 === 0 ? -0.7 : 0.7;
    this.particlePositions[i3] = side + (Math.random() - 0.5) * 0.2;
    this.particlePositions[i3 + 1] = (Math.random() - 0.5) * 0.2;
    this.particlePositions[i3 + 2] = randomizeZ ? 2.2 + Math.random() * 4.0 : 2.2;
    this.particleLife[index] = Math.random();
  }

  update(delta, inputDir) {
    // 1. Smooth horizontal movement with acceleration & damping
    this.targetVelocity = inputDir * this.speed;
    this.velocity = THREE.MathUtils.lerp(this.velocity, this.targetVelocity, delta * 14);

    this.group.position.x += this.velocity * delta;

    // Hard clamp to playable track with soft edge deceleration
    if (this.group.position.x > this.boundsX) {
      this.group.position.x = this.boundsX;
      this.velocity = 0;
    } else if (this.group.position.x < -this.boundsX) {
      this.group.position.x = -this.boundsX;
      this.velocity = 0;
    }

    // 2. Smooth Banking / Roll Rotation
    // Roll when steering: bank up to ~32 degrees
    const targetRoll = - (this.velocity / this.speed) * 0.58;
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetRoll, delta * 12);

    // Subtle natural nose pitch and idle sway
    const targetPitch = Math.sin(Date.now() * 0.003) * 0.03;
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetPitch, delta * 8);

    // 3. Thruster Flame Flicker & Pulsing
    const flameScale = 0.9 + Math.sin(Date.now() * 0.04) * 0.2 + (Math.abs(inputDir) * 0.15);
    this.leftFlame.scale.set(1, 1, flameScale);
    this.rightFlame.scale.set(1, 1, flameScale);
    this.leftInnerFlame.scale.set(1, 1, flameScale * 0.9);
    this.rightInnerFlame.scale.set(1, 1, flameScale * 0.9);

    // 4. Update Engine Particles
    const pos = this.particlesGeo.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      pos[i3 + 2] += delta * 24; // Stream back
      this.particleLife[i] -= delta * 3.5;

      if (this.particleLife[i] <= 0 || pos[i3 + 2] > 7) {
        this.resetParticle(i, false);
      }
    }
    this.particlesGeo.attributes.position.needsUpdate = true;

    // 5. Update Collision Sphere
    this.boundingSphere.center.copy(this.group.position);
    this.boundingSphere.center.z += 0.2; // Center of mass
  }

  reset() {
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.velocity = 0;
    this.targetVelocity = 0;
    this.boundingSphere.center.set(0, 0, 0.2);
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  getBoundingSphere() {
    return this.boundingSphere;
  }

  dispose() {
    this.scene.remove(this.group);
    for (const item of this.disposables) {
      if (item && typeof item.dispose === 'function') {
        item.dispose();
      }
    }
    this.disposables = [];
  }
}
