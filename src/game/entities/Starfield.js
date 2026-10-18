import * as THREE from 'three';
import { getRadialGlowTexture } from '../utils/textures';

export class Starfield {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    const glowTex = getRadialGlowTexture();

    // 1. Distant Cosmic Dust & Deep Galaxy Stars (Twinkling background sphere)
    const bgCount = 800;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgCount * 3);
    const bgCol = new Float32Array(bgCount * 3);

    const colors = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xa5f3fc),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xc084fc),
      new THREE.Color(0xf472b6)
    ];

    for (let i = 0; i < bgCount; i++) {
      const i3 = i * 3;
      bgPos[i3] = (Math.random() - 0.5) * 300;
      bgPos[i3 + 1] = (Math.random() - 0.5) * 300;
      bgPos[i3 + 2] = -50 - Math.random() * 400;

      const c = colors[Math.floor(Math.random() * colors.length)];
      bgCol[i3] = c.r;
      bgCol[i3 + 1] = c.g;
      bgCol[i3 + 2] = c.b;
    }

    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute('color', new THREE.BufferAttribute(bgCol, 3));

    const bgMat = new THREE.PointsMaterial({
      size: 0.85,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.bgPoints = new THREE.Points(bgGeo, bgMat);
    this.group.add(this.bgPoints);

    // 2. High-Performance Dual-Chamber Warp Tunnel (Zero-CPU vertex update)
    // We create two star groups that move in Z. When one passes behind camera, it loops back.
    this.tunnelLength = 260;
    this.tunnelGroups = [];

    for (let g = 0; g < 2; g++) {
      const chamber = this.createWarpChamber(glowTex);
      chamber.position.z = -g * this.tunnelLength;
      this.tunnelGroups.push(chamber);
      this.group.add(chamber);
    }

    this.scene.add(this.group);
  }

  createWarpChamber(glowTex) {
    const chamber = new THREE.Group();
    const count = 220;

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Cylinder tunnel distribution around flight corridor
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 55;
      pos[i3] = Math.cos(angle) * radius;
      pos[i3 + 1] = Math.sin(angle) * (radius * 0.65);
      pos[i3 + 2] = -Math.random() * this.tunnelLength;

      // Subtle cyan/white tint
      col[i3] = 0.5 + Math.random() * 0.5;
      col[i3 + 1] = 0.8 + Math.random() * 0.2;
      col[i3 + 2] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.1,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    chamber.add(points);
    chamber.userData = { geo, mat };

    return chamber;
  }

  update(delta, shipSpeed) {
    // Gentle cosmic rotation
    this.bgPoints.rotation.z += delta * 0.015;

    // Move warp chambers forward along Z
    const travel = shipSpeed * delta;
    for (let i = 0; i < this.tunnelGroups.length; i++) {
      const chamber = this.tunnelGroups[i];
      chamber.position.z += travel;

      // Loop back smoothly behind the other chamber
      if (chamber.position.z > 40) {
        chamber.position.z -= this.tunnelLength * 2;
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.bgPoints.geometry.dispose();
    this.bgPoints.material.dispose();

    for (const chamber of this.tunnelGroups) {
      if (chamber.userData) {
        chamber.userData.geo.dispose();
        chamber.userData.mat.dispose();
      }
    }
    this.tunnelGroups = [];
  }
}
