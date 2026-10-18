import * as THREE from 'three';
import { getRadialGlowTexture } from '../utils/textures';

export class ExplosionEffect {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 120;
    this.active = false;
    this.life = 0;
    this.maxLife = 1.4;

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);

    const palette = [
      new THREE.Color(0xffffff), // Core flash
      new THREE.Color(0x00f0ff), // Cyan plasma
      new THREE.Color(0xff7700), // Fire orange
      new THREE.Color(0xff2a5f)  // Hull red
    ];

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const col = palette[Math.floor(Math.random() * palette.length)];
      this.colors[i3] = col.r;
      this.colors[i3 + 1] = col.g;
      this.colors[i3 + 2] = col.b;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 1.2,
      map: getRadialGlowTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.visible = false;
    this.scene.add(this.points);
  }

  trigger(position) {
    this.active = true;
    this.life = this.maxLife;
    this.points.visible = true;
    this.material.opacity = 1.0;

    const pos = this.geometry.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      pos[i3] = position.x;
      pos[i3 + 1] = position.y;
      pos[i3 + 2] = position.z;

      // Random spherical blast velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 12 + Math.random() * 32;

      this.velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      this.velocities[i3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
      this.velocities[i3 + 2] = speed * Math.cos(phi);
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  update(delta) {
    if (!this.active) return;

    this.life -= delta;
    if (this.life <= 0) {
      this.active = false;
      this.points.visible = false;
      return;
    }

    // Fade out
    this.material.opacity = Math.max(0, this.life / this.maxLife);

    const pos = this.geometry.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      // Expand and apply gentle drag
      pos[i3] += this.velocities[i3] * delta;
      pos[i3 + 1] += this.velocities[i3 + 1] * delta;
      pos[i3 + 2] += this.velocities[i3 + 2] * delta;

      this.velocities[i3] *= 0.94;
      this.velocities[i3 + 1] *= 0.94;
      this.velocities[i3 + 2] *= 0.94;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  reset() {
    this.active = false;
    this.points.visible = false;
  }

  dispose() {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}
