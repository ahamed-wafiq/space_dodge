import * as THREE from 'three';

let cachedGlowTexture = null;

export function getRadialGlowTexture() {
  if (cachedGlowTexture) return cachedGlowTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Draw soft circular radial glow
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(180, 245, 255, 0.9)');
  gradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.4)');
  gradient.addColorStop(0.8, 'rgba(0, 119, 254, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  cachedGlowTexture = new THREE.CanvasTexture(canvas);
  cachedGlowTexture.generateMipmaps = true;
  return cachedGlowTexture;
}
