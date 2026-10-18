import * as THREE from 'three';
import { TerrainSegment } from './TerrainSegment';
import { getRadialGlowTexture } from '../utils/textures';

export class PlanetEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.segmentLength = 160;
    this.segmentCount = 3;
    this.totalCorridorLength = this.segmentLength * this.segmentCount; // 480

    this.initSharedResources();
    this.initAtmosphereAndSky();
    this.initThermalSpores();
    this.initSegments();

    this.scene.add(this.group);
  }

  initSharedResources() {
    this.shared = {};

    // 1. Volcanic Canyon Floor (W: 38, L: 160)
    this.shared.floorGeo = new THREE.PlaneGeometry(38, this.segmentLength, 24, 40);
    this.displaceFloorVertices(this.shared.floorGeo);

    // 2. Central Molten Lava Fissure (W: 4.5, L: 160)
    this.shared.lavaGeo = new THREE.PlaneGeometry(4.5, this.segmentLength, 6, 20);

    // 3. Sub-vein lava cracks (W: 1.2, L: 160)
    this.shared.subLavaGeo = new THREE.PlaneGeometry(1.2, this.segmentLength, 2, 10);

    // 4. Canyon Cliff Walls (Height: 34, Length: 160)
    this.shared.wallGeo = new THREE.PlaneGeometry(this.segmentLength, 34, 30, 10);
    this.displaceWallVertices(this.shared.wallGeo);
    this.shared.wallGeo.rotateY(Math.PI / 2); // Align facing inward along Z

    // 5. Rocky Buttresses (Irregular rock pillars on cliffs)
    this.shared.buttressGeo = new THREE.DodecahedronGeometry(5, 1);
    this.shared.buttressGeo.scale(0.8, 2.2, 1.2);

    // 6. Overhead Ancient Stone Arch
    const archShape = new THREE.Shape();
    archShape.moveTo(-18, 0);
    archShape.lineTo(-18, 5);
    archShape.quadraticCurveTo(0, 10, 18, 5);
    archShape.lineTo(18, 0);
    archShape.quadraticCurveTo(0, 4, -18, 0);
    const extrudeSettings = { depth: 8, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.6, bevelThickness: 0.6 };
    this.shared.overheadArchGeo = new THREE.ExtrudeGeometry(archShape, extrudeSettings);

    // 7. Crystal Cluster Prism
    this.shared.crystalClusterGeo = new THREE.ConeGeometry(0.8, 4.5, 5);
    this.shared.crystalClusterGeo.rotateX(Math.PI / 2);

    // Shared Materials
    // A. Volcanic Basalt Rock Bedrock
    this.shared.basaltMat = new THREE.MeshStandardMaterial({
      color: 0x181320,
      roughness: 0.9,
      metalness: 0.15,
      flatShading: true
    });

    // B. Glowing Molten Lava Core
    this.shared.lavaMat = new THREE.MeshBasicMaterial({
      color: 0xff4500
    });

    // C. Jagged Cliff Wall Material (Dark volcanic slate with purple rim)
    this.shared.rockCliffMat = new THREE.MeshStandardMaterial({
      color: 0x1a1226,
      roughness: 0.85,
      metalness: 0.2,
      flatShading: true
    });

    // D. Ancient Alien Ruin Stone Material
    this.shared.ancientStoneMat = new THREE.MeshStandardMaterial({
      color: 0x241d33,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.15,
      roughness: 0.7,
      metalness: 0.4
    });

    // E. Glowing Cyan Alien Crystal Material
    this.shared.cyanCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9
    });
  }

  displaceFloorVertices(geo) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Gentle basalt ripples, dips near center where lava runs
      const distFromCenter = Math.abs(x);
      const craterNoise = (Math.sin(x * 0.4) * Math.cos(y * 0.2) + Math.sin(y * 0.8) * 0.4) * 0.75;
      const valley = distFromCenter < 3.5 ? -0.4 : (distFromCenter > 14 ? 1.5 : 0);
      pos.setZ(i, craterNoise + valley);
    }
    geo.computeVertexNormals();
  }

  displaceWallVertices(geo) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const noise = (Math.sin(u * 0.3) * Math.cos(v * 0.4) + Math.sin(u * 0.7 + v) * 0.6) * 2.2;
      pos.setZ(i, noise);
    }
    geo.computeVertexNormals();
  }

  initAtmosphereAndSky() {
    // 1. Alien Ringed Planet Moon & Distant Horizon Mountains
    const horizonGroup = new THREE.Group();

    // Giant Ringed Gas Giant Planet in Sky
    const planetGeo = new THREE.SphereGeometry(75, 24, 24);
    const planetMat = new THREE.MeshBasicMaterial({
      color: 0x4c1d95,
      fog: false
    });
    this.celestialPlanet = new THREE.Mesh(planetGeo, planetMat);
    this.celestialPlanet.position.set(45, 60, -420);
    horizonGroup.add(this.celestialPlanet);

    // Planet Rings
    const ringGeo = new THREE.RingGeometry(85, 120, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      fog: false
    });
    const rings = new THREE.Mesh(ringGeo, ringMat);
    rings.rotation.x = Math.PI / 2.8;
    rings.rotation.y = -Math.PI / 8;
    rings.position.copy(this.celestialPlanet.position);
    horizonGroup.add(rings);

    // Distant Volcanic Horizon Peaks
    const peaksCount = 9;
    const peakGeo = new THREE.ConeGeometry(32, 70, 4);
    const peakMat = new THREE.MeshBasicMaterial({
      color: 0x170b28,
      fog: true
    });
    for (let i = 0; i < peaksCount; i++) {
      const peak = new THREE.Mesh(peakGeo, peakMat);
      const angle = (i / peaksCount - 0.5) * 1.6;
      peak.position.set(Math.sin(angle) * 380, 25, -420 + Math.cos(angle) * 40);
      peak.scale.set(1 + Math.random() * 0.5, 0.8 + Math.random() * 0.6, 1);
      horizonGroup.add(peak);
    }

    this.group.add(horizonGroup);
  }

  initThermalSpores() {
    // Atmospheric glowing ember sparks & spores drifting upward
    this.sporeCount = 200;
    this.sporeGeo = new THREE.BufferGeometry();
    this.sporePositions = new Float32Array(this.sporeCount * 3);
    this.sporeVelocities = new Float32Array(this.sporeCount * 3);

    const glowTex = getRadialGlowTexture();

    for (let i = 0; i < this.sporeCount; i++) {
      const i3 = i * 3;
      this.sporePositions[i3] = (Math.random() - 0.5) * 32;
      this.sporePositions[i3 + 1] = -1.5 + Math.random() * 22;
      this.sporePositions[i3 + 2] = -Math.random() * 240;

      this.sporeVelocities[i3] = (Math.random() - 0.5) * 0.8;
      this.sporeVelocities[i3 + 1] = 0.8 + Math.random() * 1.5; // Upward thermal drift
      this.sporeVelocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    this.sporeGeo.setAttribute('position', new THREE.BufferAttribute(this.sporePositions, 3));

    this.sporeMat = new THREE.PointsMaterial({
      size: 0.9,
      color: 0xff7700,
      map: glowTex,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.spores = new THREE.Points(this.sporeGeo, this.sporeMat);
    this.group.add(this.spores);
  }

  initSegments() {
    this.segments = [];
    for (let i = 0; i < this.segmentCount; i++) {
      const seg = new TerrainSegment(this.scene, this.segmentLength, this.shared);
      seg.setPositionZ(-i * this.segmentLength);
      this.segments.push(seg);
    }
  }

  update(delta, shipSpeed) {
    const travel = shipSpeed * delta;

    // 1. Move and seamlessly recycle canyon segments
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      seg.translateZ(travel);

      // When a segment fully crosses behind the camera (z > 50),
      // seamlessly loop it forward by total corridor length
      if (seg.getPositionZ() > 50) {
        seg.translateZ(-this.totalCorridorLength);
      }
    }

    // 2. Animate thermal spores (stream back with flight + drift up)
    const pos = this.sporeGeo.attributes.position.array;
    for (let i = 0; i < this.sporeCount; i++) {
      const i3 = i * 3;
      pos[i3] += this.sporeVelocities[i3] * delta;
      pos[i3 + 1] += this.sporeVelocities[i3 + 1] * delta;
      pos[i3 + 2] += (this.sporeVelocities[i3 + 2] + shipSpeed) * delta;

      // Wrap spores within flight corridor bounds
      if (pos[i3 + 1] > 24) pos[i3 + 1] = -1.8;
      if (pos[i3 + 2] > 20) {
        pos[i3] = (Math.random() - 0.5) * 32;
        pos[i3 + 1] = -1.5 + Math.random() * 20;
        pos[i3 + 2] = -220 - Math.random() * 40;
      }
    }
    this.sporeGeo.attributes.position.needsUpdate = true;

    // 3. Subtle celestial pulse
    if (this.celestialPlanet) {
      this.celestialPlanet.rotation.y += delta * 0.02;
    }
  }

  reset() {
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].setPositionZ(-i * this.segmentLength);
    }
  }

  dispose() {
    this.scene.remove(this.group);
    for (const seg of this.segments) {
      seg.dispose();
    }
    this.segments = [];

    // Dispose shared geometries
    for (const key of Object.keys(this.shared)) {
      if (this.shared[key] && typeof this.shared[key].dispose === 'function') {
        this.shared[key].dispose();
      }
    }

    if (this.sporeGeo) this.sporeGeo.dispose();
    if (this.sporeMat) this.sporeMat.dispose();
  }
}
