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

    // 1. Natural Volcanic Canyon Floor Bedrock (W: 42, L: 160)
    this.shared.floorGeo = new THREE.PlaneGeometry(42, this.segmentLength, 32, 48);
    this.displaceFloorVertices(this.shared.floorGeo);

    // 2. 3-Way Flight Path Centerline Ribbons (W: 0.35, L: 160)
    this.shared.pathRouteGeo = new THREE.PlaneGeometry(0.35, this.segmentLength, 2, 10);

    // 3. 3-Way Path Lane Divider Strips (W: 0.12, L: 160)
    this.shared.pathDividerGeo = new THREE.PlaneGeometry(0.12, this.segmentLength, 2, 10);

    // 4. Corridor Outer Boundary Ribbons (W: 0.18, L: 160)
    this.shared.boundaryGeo = new THREE.PlaneGeometry(0.18, this.segmentLength, 2, 10);

    // 5. Subtle Selective Magma Fissure Veins (W: 0.4, L: 160)
    this.shared.subLavaGeo = new THREE.PlaneGeometry(0.4, this.segmentLength, 2, 12);

    // 5. Multi-tiered Canyon Cliff Walls (Height: 36, Length: 160)
    this.shared.wallGeo = new THREE.PlaneGeometry(this.segmentLength, 36, 32, 12);
    this.displaceWallVertices(this.shared.wallGeo);
    this.shared.wallGeo.rotateY(Math.PI / 2); // Align facing inward along Z

    // 6. Jagged Stone Buttresses & Spires jutting from canyon walls
    this.shared.buttressGeo = new THREE.DodecahedronGeometry(5.5, 1);
    this.shared.buttressGeo.scale(0.85, 2.2, 1.3);

    // 7. Overhead Ancient Alien Stone Arch
    const archShape = new THREE.Shape();
    archShape.moveTo(-19, 0);
    archShape.lineTo(-19, 5);
    archShape.quadraticCurveTo(0, 11, 19, 5);
    archShape.lineTo(19, 0);
    archShape.quadraticCurveTo(0, 4.5, -19, 0);
    const extrudeSettings = { depth: 9, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.6, bevelThickness: 0.6 };
    this.shared.overheadArchGeo = new THREE.ExtrudeGeometry(archShape, extrudeSettings);

    // 8. Luminescent Crystal Cluster Prism
    this.shared.crystalClusterGeo = new THREE.ConeGeometry(0.85, 4.8, 5);
    this.shared.crystalClusterGeo.rotateX(Math.PI / 2);

    // Shared Materials
    // A. Volcanic Basalt Canyon Bedrock (Rich charcoal slate with surface texture)
    this.shared.basaltMat = new THREE.MeshStandardMaterial({
      color: 0x181c26,
      roughness: 0.88,
      metalness: 0.18,
      flatShading: true
    });

    // B. Subtle Flight Path Route Centerline Material
    this.shared.routeGuideMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45
    });

    // C. 3-Way Path Lane Divider Material (Subtle electric cyan)
    this.shared.dividerMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.40
    });

    // D. Glowing Flight Corridor Outer Boundary Material
    this.shared.boundaryMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.70
    });

    // E. Subtle Molten Lava Fissure Vein Material
    this.shared.lavaMat = new THREE.MeshBasicMaterial({
      color: 0xff4500
    });

    // E. Jagged Cliff Wall Material (Charcoal-violet basalt with rim definition)
    this.shared.rockCliffMat = new THREE.MeshStandardMaterial({
      color: 0x1b1f2e,
      roughness: 0.84,
      metalness: 0.22,
      flatShading: true
    });

    // F. Ancient Alien Ruin Stone Material
    this.shared.ancientStoneMat = new THREE.MeshStandardMaterial({
      color: 0x221f35,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.15,
      roughness: 0.72,
      metalness: 0.35,
      flatShading: true
    });

    // G. Luminescent Alien Crystal Material
    this.shared.cyanCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.9,
      roughness: 0.18,
      metalness: 0.3,
      transparent: true,
      opacity: 0.92
    });
  }

  displaceFloorVertices(geo) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const distFromCenter = Math.abs(x);
      // Gentle basalt undulation, smooth in central corridor for clean flight readability
      const ripple = (Math.sin(x * 0.35) * Math.cos(y * 0.2) + Math.sin(y * 0.7) * 0.35) * 0.6;
      const bank = distFromCenter > 13 ? (distFromCenter - 13) * 0.45 : 0;
      pos.setZ(i, ripple + bank);
    }
    geo.computeVertexNormals();
  }

  displaceWallVertices(geo) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const crag = (Math.sin(u * 0.28) * Math.cos(v * 0.35) + Math.sin(u * 0.65 + v) * 0.55) * 2.4;
      pos.setZ(i, crag);
    }
    geo.computeVertexNormals();
  }

  initAtmosphereAndSky() {
    // Alien Ringed Celestial Moon & Distant Horizon Mountain Silhouettes
    const horizonGroup = new THREE.Group();

    // Giant Ringed Celestial Planet in Sky
    const planetGeo = new THREE.SphereGeometry(75, 24, 24);
    const planetMat = new THREE.MeshBasicMaterial({
      color: 0x3b1d75,
      fog: false
    });
    this.celestialPlanet = new THREE.Mesh(planetGeo, planetMat);
    this.celestialPlanet.position.set(45, 62, -430);
    horizonGroup.add(this.celestialPlanet);

    // Planet Rings
    const ringGeo = new THREE.RingGeometry(85, 125, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      fog: false
    });
    const rings = new THREE.Mesh(ringGeo, ringMat);
    rings.rotation.x = Math.PI / 2.7;
    rings.rotation.y = -Math.PI / 8;
    rings.position.copy(this.celestialPlanet.position);
    horizonGroup.add(rings);

    // Distant Atmospheric Mountain Peaks
    const peaksCount = 10;
    const peakGeo = new THREE.ConeGeometry(34, 75, 4);
    const peakMat = new THREE.MeshBasicMaterial({
      color: 0x121726,
      fog: true
    });
    for (let i = 0; i < peaksCount; i++) {
      const peak = new THREE.Mesh(peakGeo, peakMat);
      const angle = (i / peaksCount - 0.5) * 1.7;
      peak.position.set(Math.sin(angle) * 390, 28, -430 + Math.cos(angle) * 40);
      peak.scale.set(1 + Math.random() * 0.5, 0.8 + Math.random() * 0.6, 1);
      horizonGroup.add(peak);
    }

    this.group.add(horizonGroup);
  }

  initThermalSpores() {
    // Bioluminescent energy spores and subtle embers drifting through canyon air
    this.sporeCount = 200;
    this.sporeGeo = new THREE.BufferGeometry();
    this.sporePositions = new Float32Array(this.sporeCount * 3);
    this.sporeVelocities = new Float32Array(this.sporeCount * 3);

    const glowTex = getRadialGlowTexture();

    for (let i = 0; i < this.sporeCount; i++) {
      const i3 = i * 3;
      this.sporePositions[i3] = (Math.random() - 0.5) * 34;
      this.sporePositions[i3 + 1] = -1.5 + Math.random() * 22;
      this.sporePositions[i3 + 2] = -Math.random() * 240;

      this.sporeVelocities[i3] = (Math.random() - 0.5) * 0.8;
      this.sporeVelocities[i3 + 1] = 0.8 + Math.random() * 1.5;
      this.sporeVelocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    this.sporeGeo.setAttribute('position', new THREE.BufferAttribute(this.sporePositions, 3));

    this.sporeMat = new THREE.PointsMaterial({
      size: 0.85,
      color: 0x38bdf8,
      map: glowTex,
      transparent: true,
      opacity: 0.68,
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

      if (seg.getPositionZ() > 50) {
        seg.translateZ(-this.totalCorridorLength);
      }
    }

    // 2. Animate atmospheric spores
    const pos = this.sporeGeo.attributes.position.array;
    for (let i = 0; i < this.sporeCount; i++) {
      const i3 = i * 3;
      pos[i3] += this.sporeVelocities[i3] * delta;
      pos[i3 + 1] += this.sporeVelocities[i3 + 1] * delta;
      pos[i3 + 2] += (this.sporeVelocities[i3 + 2] + shipSpeed) * delta;

      if (pos[i3 + 1] > 24) pos[i3 + 1] = -1.8;
      if (pos[i3 + 2] > 20) {
        pos[i3] = (Math.random() - 0.5) * 34;
        pos[i3 + 1] = -1.5 + Math.random() * 20;
        pos[i3 + 2] = -220 - Math.random() * 40;
      }
    }
    this.sporeGeo.attributes.position.needsUpdate = true;

    // 3. Subtle celestial rotation
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

    for (const key of Object.keys(this.shared)) {
      if (this.shared[key] && typeof this.shared[key].dispose === 'function') {
        this.shared[key].dispose();
      }
    }

    if (this.sporeGeo) this.sporeGeo.dispose();
    if (this.sporeMat) this.sporeMat.dispose();
  }
}
