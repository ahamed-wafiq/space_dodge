import * as THREE from 'three';
import { Starfield } from './entities/Starfield';
import { Spaceship } from './entities/Spaceship';
import { ObstaclePool } from './entities/ObstaclePool';
import { ExplosionEffect } from './entities/ExplosionEffect';
import { soundManager } from '../audio/SoundManager';

export class GameEngine {
  constructor(canvasContainer, callbacks = {}) {
    this.container = canvasContainer;
    this.callbacks = callbacks; // onGameOver, onHUDUpdate, onDodgeAlert

    // Game state: 'READY', 'RUNNING', 'GAME_OVER'
    this.gameState = 'READY';

    // Performance & Scoring
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('astrovanguard_highscore') || '0', 10);
    this.survivalTime = 0;
    this.obstaclesDodged = 0;
    this.baseSpeed = 38;
    this.currentSpeed = this.baseSpeed;
    this.maxSpeedReached = this.baseSpeed;

    // Combo system
    this.combo = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;

    // Controls
    this.inputDir = 0; // -1 (left), 0 (none), 1 (right)
    this.keys = { left: false, right: false };

    // Camera shake
    this.cameraShakeIntensity = 0;
    this.cameraShakeDecay = 2.5;

    // Animation frame tracking (prevent duplicate loops)
    this.rafId = null;
    this.isDisposed = false;
    this.clock = new THREE.Clock();

    this.initThree();
    this.initEntities();
    this.initInputListeners();

    // Initial render
    this.renderer.render(this.scene, this.camera);
  }

  initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene with Deep Space Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030712, 0.0055);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    this.cameraBasePos = new THREE.Vector3(0, 3.8, 8.5);
    this.camera.position.copy(this.cameraBasePos);
    this.camera.lookAt(0, 0.5, -20);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setClearColor(0x030712, 1);

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 2.0);
    dirLight.position.set(-15, 25, 12);
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.4);
    rimLight.position.set(0, -10, -20);
    this.scene.add(rimLight);

    // Ship thruster point light
    this.thrusterLight = new THREE.PointLight(0x00f0ff, 2.5, 15);
    this.thrusterLight.position.set(0, 0, 3);
    this.scene.add(this.thrusterLight);

    // Handle Window Resize
    this.onResize = () => {
      if (this.isDisposed || !this.container) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this.onResize);
  }

  initEntities() {
    this.starfield = new Starfield(this.scene);
    this.spaceship = new Spaceship(this.scene);

    // Obstacle pool with dodge reward callback
    this.obstaclePool = new ObstaclePool(this.scene, (obstacle) => {
      this.handleObstacleDodged(obstacle);
    });

    this.explosion = new ExplosionEffect(this.scene);
  }

  initInputListeners() {
    this.onKeyDown = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = true;
      }
      this.updateKeyboardInputDir();

      if (this.gameState === 'READY') {
        if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'Enter'].includes(e.code)) {
          if (this.callbacks.onAutoStart) {
            this.callbacks.onAutoStart();
          } else {
            this.start();
          }
        }
      }
    };

    this.onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = false;
      }
      this.updateKeyboardInputDir();
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  updateKeyboardInputDir() {
    if (this.keys.left && !this.keys.right) {
      this.inputDir = -1;
    } else if (this.keys.right && !this.keys.left) {
      this.inputDir = 1;
    } else {
      this.inputDir = 0;
    }
  }

  setVirtualInput(dir) {
    this.inputDir = dir;
  }

  start() {
    if (this.gameState === 'RUNNING') return;
    this.gameState = 'RUNNING';
    this.clock.start();
    soundManager.startEngine();
    this.obstaclePool.spawnInitialWave(this.currentSpeed);

    // Start single loop if not running
    if (!this.rafId) {
      this.tick();
    }
  }

  handleObstacleDodged(obstacle) {
    if (this.gameState !== 'RUNNING') return;

    this.obstaclesDodged++;
    this.combo++;
    this.comboTimer = 2.4; // 2.4 seconds to keep combo alive
    this.comboMultiplier = Math.min(8, 1 + Math.floor(this.combo / 3));

    const bonus = 120 * this.comboMultiplier;
    this.score += bonus;

    soundManager.playDodge();

    if (this.callbacks.onDodgeAlert) {
      this.callbacks.onDodgeAlert({
        points: bonus,
        multiplier: this.comboMultiplier,
        combo: this.combo
      });
    }
  }

  checkCollisions() {
    if (this.gameState !== 'RUNNING') return;

    const shipSphere = this.spaceship.getBoundingSphere();
    const active = this.obstaclePool.activeObstacles;

    for (let i = 0; i < active.length; i++) {
      const obstacle = active[i];
      if (shipSphere.intersectsSphere(obstacle.boundingSphere)) {
        this.triggerGameOver();
        break;
      }
    }
  }

  triggerGameOver() {
    this.gameState = 'GAME_OVER';

    // Visual & Audio destruction
    this.spaceship.setVisible(false);
    this.explosion.trigger(this.spaceship.group.position);
    this.cameraShakeIntensity = 1.4;

    soundManager.stopEngine();
    soundManager.playExplosion();

    // High Score tracking
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('astrovanguard_highscore', this.highScore.toString());
    }

    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver({
        finalScore: Math.floor(this.score),
        highScore: this.highScore,
        survivalTime: this.survivalTime,
        obstaclesDodged: this.obstaclesDodged,
        maxSpeed: Math.floor(this.maxSpeedReached),
        isNewRecord: this.score >= this.highScore
      });
    }
  }

  restart() {
    // Reset state & stats
    this.score = 0;
    this.survivalTime = 0;
    this.obstaclesDodged = 0;
    this.combo = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.currentSpeed = this.baseSpeed;
    this.maxSpeedReached = this.baseSpeed;
    this.cameraShakeIntensity = 0;

    // Reset entities
    this.spaceship.reset();
    this.spaceship.setVisible(true);
    this.obstaclePool.reset();
    this.obstaclePool.spawnInitialWave(this.currentSpeed);
    this.explosion.reset();

    // Reset clock and start
    this.clock.start();
    this.gameState = 'RUNNING';
    soundManager.startEngine();

    // Ensure loop continues without creating duplicates
    if (!this.rafId) {
      this.tick();
    }
  }

  tick = () => {
    if (this.isDisposed) return;

    this.rafId = requestAnimationFrame(this.tick);

    const rawDelta = this.clock.getDelta();
    // Clamp delta to prevent physics jumps on lag spikes or tab switching
    const delta = Math.min(rawDelta, 0.08);

    if (this.gameState === 'RUNNING') {
      this.survivalTime += delta;

      // Truly Endless Difficulty Scaling (Gradual, continuous, sub-linear logarithmic)
      // Score-based & Time-based smooth acceleration with no hard cap
      const scoreProgress = Math.sqrt(this.score) * 1.35;
      const timeProgress = this.survivalTime * 0.38;
      this.currentSpeed = this.baseSpeed + scoreProgress + timeProgress;

      if (this.currentSpeed > this.maxSpeedReached) {
        this.maxSpeedReached = this.currentSpeed;
      }

      // Continuous Survival Score
      this.score += delta * (this.currentSpeed * 1.8);

      // Combo Decay
      if (this.comboTimer > 0) {
        this.comboTimer -= delta;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.comboMultiplier = 1;
        }
      }

      // Update Audio Pitch
      soundManager.updateEnginePitch(this.currentSpeed / this.baseSpeed);

      // Update Entities
      this.spaceship.update(delta, this.inputDir);
      this.obstaclePool.update(delta, this.currentSpeed, this.score, this.spaceship.group.position);
      this.checkCollisions();

      // Update Thruster Light position to follow ship
      this.thrusterLight.position.x = this.spaceship.group.position.x;
      this.thrusterLight.position.y = this.spaceship.group.position.y;

      // 60fps HUD update via micro-callback (direct DOM update without React re-render)
      if (this.callbacks.onHUDUpdate) {
        this.callbacks.onHUDUpdate({
          score: Math.floor(this.score),
          highScore: this.highScore,
          speed: Math.floor(this.currentSpeed),
          time: this.survivalTime,
          combo: this.combo,
          multiplier: this.comboMultiplier,
          dodged: this.obstaclesDodged
        });
      }
    } else if (this.gameState === 'READY') {
      // Ship controls remain live so user can test steering before launch
      this.spaceship.update(delta, this.inputDir);
    }

    // Always update visual background, explosion particles, and camera
    this.starfield.update(delta, this.gameState === 'RUNNING' ? this.currentSpeed : 22);
    this.explosion.update(delta);

    // Camera follow & Camera Shake
    this.updateCamera(delta);

    this.renderer.render(this.scene, this.camera);
  };

  updateCamera(delta) {
    // Third-person smooth camera tracking of ship's X position
    const targetCamX = this.spaceship.group.position.x * 0.45;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, delta * 6);

    // Apply Camera Shake on collision
    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity * 1.5;
      this.camera.position.y = this.cameraBasePos.y + (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * this.cameraShakeDecay);
    } else {
      this.camera.position.y = this.cameraBasePos.y;
    }
  }

  dispose() {
    this.isDisposed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    soundManager.stopEngine();

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    // Dispose entities
    if (this.starfield) this.starfield.dispose();
    if (this.spaceship) this.spaceship.dispose();
    if (this.obstaclePool) this.obstaclePool.dispose();
    if (this.explosion) this.explosion.dispose();

    // Dispose WebGLRenderer and remove DOM
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
