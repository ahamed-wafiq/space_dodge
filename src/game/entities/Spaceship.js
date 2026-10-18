import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getRadialGlowTexture } from '../utils/textures';

export class Spaceship {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);

    // Movement state
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = 0;
    this.targetVelocity = 0;
    this.speed = 36; // Snappy lateral agility across the 3 paths
    this.boundsX = 10.5; // Aligned with the outer boundaries of the 3-way path

    // Collision sphere
    this.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.25);

    // Track allocated resources for clean disposal
    this.disposables = [];

    // Engine thruster offset coordinates
    this.engineOffsets = [
      { x: -0.98, y: 0.05, z: 2.2 },
      { x: 0.98, y: 0.05, z: 2.2 }
    ];

    // Build procedural fallback first so ship is instantly visible
    this.createProceduralShip();
    this.createThrusterFlames();
    this.createEngineParticles();

    // Load detailed Blender GLTF model
    this.loadGLTFModel('/models/spaceship.glb');

    this.group.position.set(0, 0, 0);
    this.scene.add(this.group);
  }

  loadGLTFModel(url) {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // Traverse to tune materials for optimal metallic and emissive response
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.envMapIntensity = 1.2;
              // Ensure neon/emissive materials pop
              if (child.material.name && child.material.name.includes('Neon')) {
                child.material.emissiveIntensity = 2.8;
              } else if (child.material.name && child.material.name.includes('Thruster')) {
                child.material.emissiveIntensity = 4.5;
              }
            }
          }
        });

        // Clear procedural geometry and mount GLTF model
        while (this.modelGroup.children.length > 0) {
          const c = this.modelGroup.children[0];
          this.modelGroup.remove(c);
        }

        // Adjust scale and orientation so nose faces forward down the canyon (-Z)
        model.scale.set(0.9, 0.9, 0.9);
        model.rotation.y = Math.PI;
        model.position.set(0, 0, 0);
        this.modelGroup.add(model);
      },
      undefined,
      (err) => {
        console.warn('GLTF spaceship load fallback to procedural geometry:', err);
      }
    );
  }

  createProceduralShip() {
    // High-fidelity procedural mesh matching Image 2 reference:
    // Sleek metallic graphite fuselage, silver bevels, swept delta wings, cyan neon accents

    const matHull = new THREE.MeshStandardMaterial({
      color: 0x161a22,
      metalness: 0.88,
      roughness: 0.22,
      flatShading: false
    });

    const matSilver = new THREE.MeshStandardMaterial({
      color: 0xb0b8c4,
      metalness: 0.94,
      roughness: 0.16
    });

    const matCanopy = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.2,
      roughness: 0.05,
      transparent: true,
      opacity: 0.92,
      emissive: 0x0369a1,
      emissiveIntensity: 0.3
    });

    const matNeon = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });

    // 1. Central Aerodynamic Fuselage
    const fuseGeo = new THREE.CylinderGeometry(0.85, 0.95, 3.8, 16);
    fuseGeo.rotateX(Math.PI / 2);
    fuseGeo.scale(1.35, 0.44, 1.0);
    const fuse = new THREE.Mesh(fuseGeo, matHull);
    this.modelGroup.add(fuse);
    this.disposables.push(fuseGeo, matHull);

    // 2. Needle Tapered Nose
    const noseGeo = new THREE.ConeGeometry(0.95, 2.2, 12);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.scale(1.3, 0.40, 1.0);
    const nose = new THREE.Mesh(noseGeo, matSilver);
    nose.position.set(0, 0.02, -2.6);
    this.modelGroup.add(nose);
    this.disposables.push(noseGeo, matSilver);

    // 3. Cockpit Canopy Bubble Glass
    const canopyGeo = new THREE.SphereGeometry(0.55, 16, 12);
    canopyGeo.scale(0.75, 0.5, 2.1);
    const canopy = new THREE.Mesh(canopyGeo, matCanopy);
    canopy.position.set(0, 0.3, -0.6);
    this.modelGroup.add(canopy);
    this.disposables.push(canopyGeo, matCanopy);

    // 4. Swept Delta Wings
    const wingGeo = new THREE.BoxGeometry(5.8, 0.12, 1.8);
    const wings = new THREE.Mesh(wingGeo, matHull);
    wings.position.set(0, -0.04, 0.35);
    this.modelGroup.add(wings);
    this.disposables.push(wingGeo);

    // Wingtip Stabilizer Winglets and Cyan Strips
    for (const side of [-1, 1]) {
      const tipGeo = new THREE.BoxGeometry(0.12, 0.75, 1.4);
      const tip = new THREE.Mesh(tipGeo, matSilver);
      tip.position.set(side * 2.9, 0.32, 0.35);
      tip.rotation.z = -0.22 * side;
      this.modelGroup.add(tip);
      this.disposables.push(tipGeo);

      const stripGeo = new THREE.BoxGeometry(1.8, 0.06, 0.08);
      const strip = new THREE.Mesh(stripGeo, matNeon);
      strip.position.set(side * 1.95, 0.04, 0.3);
      this.modelGroup.add(strip);
      this.disposables.push(stripGeo);
    }

    // 5. Dual Heavy Engine Cowlings
    for (const off of this.engineOffsets) {
      const cowGeo = new THREE.CylinderGeometry(0.44, 0.48, 2.3, 16);
      cowGeo.rotateX(Math.PI / 2);
      const cow = new THREE.Mesh(cowGeo, matSilver);
      cow.position.set(off.x, off.y, off.z - 1.15);
      this.modelGroup.add(cow);
      this.disposables.push(cowGeo);

      // Neon Trim Ring
      const ringGeo = new THREE.TorusGeometry(0.46, 0.05, 8, 20);
      const ring = new THREE.Mesh(ringGeo, matNeon);
      ring.position.set(off.x, off.y, off.z - 0.4);
      this.modelGroup.add(ring);
      this.disposables.push(ringGeo);
    }
  }

  createThrusterFlames() {
    this.flameMeshes = [];
    this.innerFlameMeshes = [];

    const flameGeo = new THREE.ConeGeometry(0.32, 1.6, 12);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.88
    });

    const innerGeo = new THREE.ConeGeometry(0.16, 1.1, 10);
    innerGeo.rotateX(-Math.PI / 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });

    for (const off of this.engineOffsets) {
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(off.x, off.y, off.z + 0.8);
      this.group.add(flame);
      this.flameMeshes.push(flame);

      const inner = new THREE.Mesh(innerGeo, innerMat);
      inner.position.set(off.x, off.y, off.z + 0.55);
      this.group.add(inner);
      this.innerFlameMeshes.push(inner);
    }

    this.disposables.push(flameGeo, flameMat, innerGeo, innerMat);
  }

  createEngineParticles() {
    this.particleCount = 60;
    this.particlesGeo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleLife = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      this.resetParticle(i, true);
    }

    this.particlesGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    this.particlesMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.38,
      map: getRadialGlowTexture(),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.engineParticleSystem = new THREE.Points(this.particlesGeo, this.particlesMat);
    this.group.add(this.engineParticleSystem);
    this.disposables.push(this.particlesGeo, this.particlesMat);
  }

  resetParticle(index, randomizeZ = false) {
    const i3 = index * 3;
    const off = this.engineOffsets[index % this.engineOffsets.length];
    this.particlePositions[i3] = off.x + (Math.random() - 0.5) * 0.22;
    this.particlePositions[i3 + 1] = off.y + (Math.random() - 0.5) * 0.2;
    this.particlePositions[i3 + 2] = randomizeZ ? off.z + 0.8 + Math.random() * 4.5 : off.z + 0.8;
    this.particleLife[index] = Math.random();
  }

  update(delta, inputDir) {
    // 1. Smooth horizontal movement with agile acceleration
    this.targetVelocity = inputDir * this.speed;
    this.velocity = THREE.MathUtils.lerp(this.velocity, this.targetVelocity, delta * 15);

    this.group.position.x += this.velocity * delta;

    // Hard boundary clamping
    if (this.group.position.x > this.boundsX) {
      this.group.position.x = this.boundsX;
      this.velocity = 0;
    } else if (this.group.position.x < -this.boundsX) {
      this.group.position.x = -this.boundsX;
      this.velocity = 0;
    }

    // 2. Smooth Banking / Roll Rotation
    const targetRoll = - (this.velocity / this.speed) * 0.55;
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetRoll, delta * 12);

    // Subtle pitch and idle engine tremor
    const targetPitch = Math.sin(Date.now() * 0.0035) * 0.025;
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetPitch, delta * 8);

    // 3. Thruster Flame Dynamics
    const flicker = 0.92 + Math.sin(Date.now() * 0.05) * 0.18 + (Math.abs(inputDir) * 0.2);
    for (const flame of this.flameMeshes) {
      flame.scale.set(1, 1, flicker);
    }
    for (const inner of this.innerFlameMeshes) {
      inner.scale.set(1, 1, flicker * 0.92);
    }

    // 4. Update Engine Particles
    const pos = this.particlesGeo.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      pos[i3 + 2] += delta * 26; // Stream back
      this.particleLife[i] -= delta * 3.2;

      if (this.particleLife[i] <= 0 || pos[i3 + 2] > 8) {
        this.resetParticle(i, false);
      }
    }
    this.particlesGeo.attributes.position.needsUpdate = true;

    // 5. Update Collision Sphere
    this.boundingSphere.center.copy(this.group.position);
    this.boundingSphere.center.z += 0.2;
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
