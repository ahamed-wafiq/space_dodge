import * as THREE from 'three';
import { PlanetEnvironment } from './entities/PlanetEnvironment';
import { Spaceship } from './entities/Spaceship';
import { ObstacleManager } from './entities/ObstacleManager';
import { ExplosionEffect } from './entities/ExplosionEffect';
import { soundManager } from '../audio/SoundManager';

export class GameEngine {
  constructor(canvasContainer, callbacks = {}) {
    this.container = canvasContainer;
    this.callbacks = callbacks; // onGameOver, onHUDUpdate, onDodgeAlert, onAutoStart

    // Game state: 'READY', 'RUNNING', 'GAME_OVER'
    this.gameState = 'READY';

    // Performance & Scoring
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('astrovanguard_highscore') || '0', 10);
    this.survivalTime = 0;
    this.obstaclesDodged = 0;
    this.baseSpeed = 40;
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

    // Animation frame tracking
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

    // 1. Scene with Deep Alien Twilight Atmospheric Canyon Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0e071e, 0.0072);

    // 2. Camera: Third-Person Canyon Chase Camera
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    this.cameraBasePos = new THREE.Vector3(0, 4.0, 9.0);
    this.camera.position.copy(this.cameraBasePos);
    this.camera.lookAt(0, 1.2, -22);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setClearColor(0x0e071e, 1);

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting: Alien Sun, Twilight Ambient, Magma Ground Reflection
    const ambientLight = new THREE.AmbientLight(0x241442, 1.5);
    this.scene.add(ambientLight);

    // Golden Amber Alien Sun casting sharp rims on canyon cliffs
    const sunLight = new THREE.DirectionalLight(0xffa436, 2.4);
    sunLight.position.set(-20, 35, 15);
    this.scene.add(sunLight);

    // Volcanic Magma Bounce Light from below
    const magmaLight = new THREE.DirectionalLight(0xff3300, 1.2);
    magmaLight.position.set(0, -15, -10);
    this.scene.add(magmaLight);

    // Ship Thruster Point Light
    this.thrusterLight = new THREE.PointLight(0x00f0ff, 2.5, 16);
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
    this.planetEnv = new PlanetEnvironment(this.scene);
    this.spaceship = new Spaceship(this.scene);

    // Obstacle manager with dodge reward callback
    this.obstacleManager = new ObstacleManager(this.scene, (obstacle) => {
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
    this.obstacleManager.spawnInitialWave(this.currentSpeed);

    if (!this.rafId) {
      this.tick();
    }
  }

  handleObstacleDodged(obstacle) {
    if (this.gameState !== 'RUNNING') return;

    this.obstaclesDodged++;
    this.combo++;
    this.comboTimer = 2.4;
    this.comboMultiplier = Math.min(8, 1 + Math.floor(this.combo / 3));

    // Bonus points: Crystal hazards give +200, Gates give +180, Pillars give +120
    let baseBonus = 120;
    if (obstacle.type === 'CRYSTAL') baseBonus = 200;
    else if (obstacle.type === 'GATE') baseBonus = 180;
    else if (obstacle.type === 'FALLING') baseBonus = 150;

    const bonus = baseBonus * this.comboMultiplier;
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

    const isHit = this.obstacleManager.checkCollision(this.spaceship.group.position, 1.25);
    if (isHit) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.gameState = 'GAME_OVER';

    // Visual & Audio destruction
    this.spaceship.setVisible(false);
    this.explosion.trigger(this.spaceship.group.position);
    this.cameraShakeIntensity = 1.6;

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
    this.planetEnv.reset();
    this.obstacleManager.reset();
    this.obstacleManager.spawnInitialWave(this.currentSpeed);
    this.explosion.reset();

    // Reset clock and start
    this.clock.start();
    this.gameState = 'RUNNING';
    soundManager.startEngine();

    if (!this.rafId) {
      this.tick();
    }
  }

  tick = () => {
    if (this.isDisposed) return;

    this.rafId = requestAnimationFrame(this.tick);

    const rawDelta = this.clock.getDelta();
    const delta = Math.min(rawDelta, 0.08);

    if (this.gameState === 'RUNNING') {
      this.survivalTime += delta;

      // Truly Endless Difficulty Scaling (Gradual, continuous, sub-linear)
      const scoreProgress = Math.sqrt(this.score) * 1.4;
      const timeProgress = this.survivalTime * 0.4;
      this.currentSpeed = this.baseSpeed + scoreProgress + timeProgress;

      if (this.currentSpeed > this.maxSpeedReached) {
        this.maxSpeedReached = this.currentSpeed;
      }

      // Continuous Survival Score
      this.score += delta * (this.currentSpeed * 2.0);

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
      this.planetEnv.update(delta, this.currentSpeed);
      this.obstacleManager.update(delta, this.currentSpeed, this.score, this.spaceship.group.position);
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
      // Ship controls remain live in preview
      this.spaceship.update(delta, this.inputDir);
      this.planetEnv.update(delta, 20);
    }

    this.explosion.update(delta);

    // Camera follow & Camera Shake
    this.updateCamera(delta);

    this.renderer.render(this.scene, this.camera);
  };

  updateCamera(delta) {
    // Third-person smooth camera tracking of ship's X position with subtle bank
    const targetCamX = this.spaceship.group.position.x * 0.48;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, delta * 6.5);

    // Camera tilt following spaceship bank
    const targetRoll = - (this.spaceship.group.position.x / 14) * 0.08;
    this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, targetRoll, delta * 5);

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
    if (this.planetEnv) this.planetEnv.dispose();
    if (this.spaceship) this.spaceship.dispose();
    if (this.obstacleManager) this.obstacleManager.dispose();
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
