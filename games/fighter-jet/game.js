/*
 * Sky Striker — a 1942-style 2D arcade shooter.
 *
 * ARCHITECTURE
 * ============
 * Single-file game, organized top-to-bottom into independent sections:
 *
 *   1. CONFIG    — every tunable number (speeds, timers, scores) in one place.
 *   2. Utils     — small math helpers shared by everything below.
 *   3. Sound     — Web Audio synthesizer; all SFX are generated, no assets.
 *   4. Input     — keyboard state tracker (WASD / arrows / space).
 *   5. Entities  — Star, Particle, Bullet, PowerUp, Player, Enemy. Each is a
 *                  class with update(dt) and draw(ctx); they hold no game
 *                  rules beyond their own motion and appearance.
 *   6. Game      — owns all entity lists, the state machine
 *                  (START → PLAYING → GAME_OVER), spawning, difficulty
 *                  scaling, collision resolution, scoring and the HUD.
 *   7. Bootstrap — DOM wiring and the requestAnimationFrame loop.
 *
 * The loop runs continuously from page load; the Game's state decides what
 * gets simulated (the starfield always scrolls, even behind the menus).
 * All timing is delta-time based, so the game speed is frame-rate
 * independent.
 */
'use strict';

/* ===================================================================== *
 * 1. CONFIG
 * ===================================================================== */

const CONFIG = {
  width: 480,
  height: 640,

  player: {
    speed: 270,            // px/s
    radius: 13,            // collision circle
    fireCooldown: 0.26,    // s between shots
    rapidFireCooldown: 0.10,
    lives: 3,
    invulnTime: 2.2,       // s of blinking invulnerability after a hit
  },

  bullets: {
    playerSpeed: 540,
    enemySpeed: 190,
    playerRadius: 3,
    enemyRadius: 4,
  },

  powerUp: {
    dropChance: 0.12,      // per destroyed enemy
    fallSpeed: 85,
    duration: 15,          // s of rapid fire
    radius: 11,
  },

  // Three enemy archetypes. `score` is awarded on kill, `fireInterval` is a
  // [min, max] range a fresh timer is rolled from after every shot.
  enemies: {
    scout:   { hp: 1, score: 10, speed: 160, radius: 12, size: 24, color: '#ff5a36', fires: false },
    weaver:  { hp: 2, score: 25, speed: 95,  radius: 13, size: 28, color: '#ff9f1c', fires: true, fireInterval: [1.6, 3.0] },
    gunship: { hp: 4, score: 50, speed: 48,  radius: 19, size: 44, color: '#d7263d', fires: true, fireInterval: [2.0, 3.4] },
  },

  // Difficulty ramps linearly from 0 → 1 over rampDuration seconds, then
  // holds. It shortens the spawn interval and speeds up enemies/bullets.
  difficulty: {
    rampDuration: 300,         // ~5 minutes to reach max intensity
    spawnIntervalStart: 1.5,   // s between spawns at t=0
    spawnIntervalEnd: 0.45,    // s between spawns at max difficulty
    speedMulEnd: 1.6,          // enemy speed multiplier at max difficulty
    gunshipUnlockTime: 45,     // s before gunships may spawn
  },

  // Parallax starfield: three depth layers, far → near.
  starLayers: [
    { count: 45, speed: 14, size: 1,   color: '#3a4a6b' },
    { count: 28, speed: 30, size: 1.6, color: '#7488b8' },
    { count: 14, speed: 55, size: 2.2, color: '#c9d6f5' },
  ],

  highScoreKey: 'fighterJetHighScore',
};

/* ===================================================================== *
 * 2. Utils
 * ===================================================================== */

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

/** Circle-vs-circle overlap test — the only collision primitive we need. */
function circlesHit(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy < r * r;
}

/* ===================================================================== *
 * 3. Sound — Web Audio API synthesizer
 * ===================================================================== */

const Sound = {
  ctx: null,
  master: null,

  /**
   * Browsers only allow audio after a user gesture, so the context is
   * created/resumed lazily from the first click or keypress (see Bootstrap).
   * If Web Audio is unavailable the game silently plays without sound.
   */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.4;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  /** Short descending square-wave blip. */
  shoot() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(rand(820, 900), t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.09);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.1);
  },

  /** Filtered white-noise burst with a falling cutoff — a classic boom. */
  explosion(big = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const dur = big ? 0.6 : 0.35;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(big ? 1400 : 1000, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(big ? 0.5 : 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
  },

  /** Two quick rising sine notes for power-up pickup. */
  powerUp() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 784].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);
      gain.gain.setValueAtTime(0.0001, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.18, t + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.18);
      osc.connect(gain).connect(this.master);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.2);
    });
  },
};

/* ===================================================================== *
 * 4. Input — keyboard state
 * ===================================================================== */

const Input = {
  keys: new Set(),

  init() {
    window.addEventListener('keydown', (e) => {
      // Stop arrows/space from scrolling the page.
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      Sound.unlock();
      game.handleMenuKey(e.key);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    });
    // Drop stuck keys when the tab loses focus.
    window.addEventListener('blur', () => this.keys.clear());
  },

  left()  { return this.keys.has('a') || this.keys.has('ArrowLeft'); },
  right() { return this.keys.has('d') || this.keys.has('ArrowRight'); },
  up()    { return this.keys.has('w') || this.keys.has('ArrowUp'); },
  down()  { return this.keys.has('s') || this.keys.has('ArrowDown'); },
  fire()  { return this.keys.has(' '); },
};

/* ===================================================================== *
 * 5. Entities
 * ===================================================================== */

/** One dot of the parallax starfield. Wraps from bottom back to top. */
class Star {
  constructor(layer) {
    this.layer = layer;
    this.x = rand(0, CONFIG.width);
    this.y = rand(0, CONFIG.height);
  }

  update(dt) {
    this.y += this.layer.speed * dt;
    if (this.y > CONFIG.height) {
      this.y -= CONFIG.height;
      this.x = rand(0, CONFIG.width);
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.layer.color;
    ctx.fillRect(this.x, this.y, this.layer.size, this.layer.size);
  }
}

/** Explosion debris: a square that flies out, shrinks and fades. */
class Particle {
  constructor(x, y, color) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(40, 240);
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.35, 0.8);
    this.maxLife = this.life;
    this.size = rand(2, 5);
    this.color = color;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 1 - 1.5 * dt; // light drag
    this.vy *= 1 - 1.5 * dt;
    this.life -= dt;
  }

  get dead() { return this.life <= 0; }

  draw(ctx) {
    const k = this.life / this.maxLife;
    ctx.globalAlpha = k;
    ctx.fillStyle = this.color;
    const s = this.size * k;
    ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
    ctx.globalAlpha = 1;
  }
}

/** Shared bullet for both sides; `fromPlayer` decides color and collisions. */
class Bullet {
  constructor(x, y, vx, vy, fromPlayer) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.fromPlayer = fromPlayer;
    this.radius = fromPlayer ? CONFIG.bullets.playerRadius : CONFIG.bullets.enemyRadius;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y < -20 || this.y > CONFIG.height + 20 || this.x < -20 || this.x > CONFIG.width + 20) {
      this.dead = true;
    }
  }

  draw(ctx) {
    if (this.fromPlayer) {
      ctx.fillStyle = '#9af1ff';
      ctx.fillRect(this.x - 2, this.y - 7, 4, 14);
    } else {
      ctx.fillStyle = '#ffb1a0';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Falling rapid-fire pickup, drawn as a pulsing "P" badge. */
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.powerUp.radius;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    this.y += CONFIG.powerUp.fallSpeed * dt;
    if (this.y > CONFIG.height + 20) this.dead = true;
  }

  draw(ctx) {
    const pulse = 1 + Math.sin(this.age * 6) * 0.12;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1408';
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', 0, 1);
    ctx.restore();
  }
}

/** The player's jet: a cyan delta-wing pointing up, with an engine flame. */
class Player {
  constructor() {
    this.radius = CONFIG.player.radius;
    this.reset();
  }

  /** Re-center after spawning or losing a life. */
  reset() {
    this.x = CONFIG.width / 2;
    this.y = CONFIG.height - 70;
    this.fireTimer = 0;
    this.invulnTimer = CONFIG.player.invulnTime; // brief grace on (re)spawn
  }

  get invulnerable() { return this.invulnTimer > 0; }

  update(dt, game) {
    const speed = CONFIG.player.speed;
    if (Input.left())  this.x -= speed * dt;
    if (Input.right()) this.x += speed * dt;
    if (Input.up())    this.y -= speed * dt;
    if (Input.down())  this.y += speed * dt;
    this.x = clamp(this.x, 18, CONFIG.width - 18);
    this.y = clamp(this.y, 30, CONFIG.height - 24);

    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.fireTimer -= dt;

    if (Input.fire() && this.fireTimer <= 0) {
      const cooldown = game.rapidFireTimer > 0
        ? CONFIG.player.rapidFireCooldown
        : CONFIG.player.fireCooldown;
      this.fireTimer = cooldown;
      game.bullets.push(new Bullet(this.x, this.y - 18, 0, -CONFIG.bullets.playerSpeed, true));
      Sound.shoot();
    }
  }

  draw(ctx, time) {
    // Blink while invulnerable.
    if (this.invulnerable && Math.floor(time * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Engine flame (flickers).
    const flame = 8 + Math.sin(time * 40) * 3;
    ctx.fillStyle = '#ffae42';
    ctx.beginPath();
    ctx.moveTo(-4, 14);
    ctx.lineTo(0, 14 + flame);
    ctx.lineTo(4, 14);
    ctx.closePath();
    ctx.fill();

    // Fuselage: delta wing.
    ctx.fillStyle = '#35d0ff';
    ctx.beginPath();
    ctx.moveTo(0, -18);   // nose
    ctx.lineTo(14, 12);   // right wingtip
    ctx.lineTo(0, 6);     // tail notch
    ctx.lineTo(-14, 12);  // left wingtip
    ctx.closePath();
    ctx.fill();

    // Cockpit.
    ctx.fillStyle = '#dff7ff';
    ctx.beginPath();
    ctx.arc(0, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Enemy jet. Behavior is driven by its type entry in CONFIG.enemies:
 *  - scout:   dives straight down, fast, never fires.
 *  - weaver:  drifts down on a sine wave, fires single aimed shots.
 *  - gunship: slow and wide, fires a 3-bullet downward spread.
 * Enemies are drawn nose-down in warm colors so they read instantly as
 * hostile against the player's cool cyan.
 */
class Enemy {
  constructor(type, speedMul) {
    const spec = CONFIG.enemies[type];
    this.type = type;
    this.spec = spec;
    this.hp = spec.hp;
    this.radius = spec.radius;
    this.speed = spec.speed * speedMul;
    this.x = rand(spec.size, CONFIG.width - spec.size);
    this.y = -spec.size;
    this.baseX = this.x;          // sine-wave anchor for weavers
    this.wavePhase = rand(0, Math.PI * 2);
    this.age = 0;
    this.dead = false;
    this.fireTimer = spec.fires ? rand(spec.fireInterval[0], spec.fireInterval[1]) : Infinity;
  }

  update(dt, game) {
    this.age += dt;
    this.y += this.speed * dt;

    if (this.type === 'weaver') {
      this.x = this.baseX + Math.sin(this.age * 2.2 + this.wavePhase) * 70;
      this.x = clamp(this.x, this.spec.size, CONFIG.width - this.spec.size);
    }

    if (this.y > CONFIG.height + this.spec.size) {
      this.dead = true; // escaped off-screen, no score awarded
      return;
    }

    // Fire only once fully on screen so shots are always dodgeable.
    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && this.y > 20 && this.y < CONFIG.height - 120) {
      this.fire(game);
      this.fireTimer = rand(this.spec.fireInterval[0], this.spec.fireInterval[1]) / game.fireRateMul;
    }
  }

  fire(game) {
    const speed = CONFIG.bullets.enemySpeed * game.speedMul;
    if (this.type === 'gunship') {
      // Symmetric 3-way spread aimed straight down.
      for (const angle of [-0.35, 0, 0.35]) {
        game.enemyBullets.push(new Bullet(
          this.x, this.y + 14,
          Math.sin(angle) * speed, Math.cos(angle) * speed,
          false
        ));
      }
    } else {
      // Single shot aimed at the player's current position.
      const dx = game.player.x - this.x;
      const dy = game.player.y - this.y;
      const len = Math.hypot(dx, dy) || 1;
      game.enemyBullets.push(new Bullet(
        this.x, this.y + 12,
        (dx / len) * speed, (dy / len) * speed,
        false
      ));
    }
  }

  draw(ctx) {
    const s = this.spec.size / 2;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Inverted delta wing — nose pointing down toward the player.
    ctx.fillStyle = this.spec.color;
    ctx.beginPath();
    ctx.moveTo(0, s);        // nose (down)
    ctx.lineTo(s, -s * 0.7);
    ctx.lineTo(0, -s * 0.3);
    ctx.lineTo(-s, -s * 0.7);
    ctx.closePath();
    ctx.fill();

    // Dark canopy stripe.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Gunships show a damage bar once they've been hit.
    if (this.type === 'gunship' && this.hp < this.spec.hp) {
      const w = this.spec.size;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-w / 2, -s - 8, w, 3);
      ctx.fillStyle = '#7CFC00';
      ctx.fillRect(-w / 2, -s - 8, w * (this.hp / this.spec.hp), 3);
    }

    ctx.restore();
  }
}

/* ===================================================================== *
 * 6. Game — state machine, spawning, collisions, scoring, HUD
 * ===================================================================== */

const State = { START: 'start', PLAYING: 'playing', GAME_OVER: 'gameover' };

class Game {
  constructor(ctx, ui) {
    this.ctx = ctx;
    this.ui = ui; // cached DOM references, see Bootstrap
    this.state = State.START;
    this.time = 0; // wall-clock for animation effects

    // The starfield exists in every state, so build it once here.
    this.stars = [];
    for (const layer of CONFIG.starLayers) {
      for (let i = 0; i < layer.count; i++) this.stars.push(new Star(layer));
    }

    this.highScore = this.loadHighScore();
    this.resetWorld();
  }

  /* ---------- lifecycle ---------- */

  resetWorld() {
    this.player = new Player();
    this.enemies = [];
    this.bullets = [];       // player bullets
    this.enemyBullets = [];
    this.particles = [];
    this.powerUps = [];
    this.score = 0;
    this.lives = CONFIG.player.lives;
    this.elapsed = 0;        // run time, drives difficulty
    this.spawnTimer = 1.0;   // first enemy appears quickly
    this.rapidFireTimer = 0;
    // Difficulty-derived multipliers, recomputed every frame.
    this.speedMul = 1;
    this.fireRateMul = 1;
  }

  start() {
    this.resetWorld();
    this.state = State.PLAYING;
    this.ui.startScreen.classList.add('hidden');
    this.ui.gameOverScreen.classList.add('hidden');
    this.ui.hud.classList.remove('hidden');
    this.updateHud();
  }

  gameOver() {
    this.state = State.GAME_OVER;
    Sound.explosion(true);

    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.score;
      this.saveHighScore();
    }
    this.ui.finalScore.textContent = this.score;
    this.ui.bestScore.textContent = this.highScore;
    this.ui.newHighScore.classList.toggle('hidden', !isNewHigh);
    this.ui.hud.classList.add('hidden');
    this.ui.powerBarWrap.classList.add('hidden');
    this.ui.gameOverScreen.classList.remove('hidden');
  }

  /** Enter/Space drive the menus so the game is fully keyboard-playable. */
  handleMenuKey(key) {
    if (key !== 'Enter' && key !== ' ') return;
    if (this.state === State.START) this.start();
    else if (this.state === State.GAME_OVER && key === 'Enter') this.start();
  }

  /* ---------- per-frame entry point ---------- */

  tick(dt) {
    this.time += dt;

    // Stars scroll in every state (menus included).
    for (const star of this.stars) star.update(dt);

    if (this.state === State.PLAYING) {
      this.updatePlaying(dt);
    } else {
      // Keep explosion debris animating behind the game-over screen.
      this.updateParticles(dt);
    }

    this.draw();
  }

  updatePlaying(dt) {
    this.elapsed += dt;

    // Difficulty 0→1 over the ramp, then capped: everything below reads
    // these two multipliers instead of recomputing the curve.
    const d = clamp(this.elapsed / CONFIG.difficulty.rampDuration, 0, 1);
    this.difficulty = d;
    this.speedMul = 1 + (CONFIG.difficulty.speedMulEnd - 1) * d;
    this.fireRateMul = 1 + 0.7 * d;

    this.spawnEnemies(dt);

    this.player.update(dt, this);
    for (const e of this.enemies) e.update(dt, this);
    for (const b of this.bullets) b.update(dt);
    for (const b of this.enemyBullets) b.update(dt);
    for (const p of this.powerUps) p.update(dt);
    this.updateParticles(dt);

    if (this.rapidFireTimer > 0) {
      this.rapidFireTimer = Math.max(0, this.rapidFireTimer - dt);
    }

    this.handleCollisions();

    // Compact entity lists in place.
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.bullets = this.bullets.filter((b) => !b.dead);
    this.enemyBullets = this.enemyBullets.filter((b) => !b.dead);
    this.powerUps = this.powerUps.filter((p) => !p.dead);

    this.updateHud();
  }

  updateParticles(dt) {
    for (const p of this.particles) p.update(dt);
    this.particles = this.particles.filter((p) => !p.dead);
  }

  /* ---------- spawning & difficulty ---------- */

  spawnEnemies(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const { spawnIntervalStart, spawnIntervalEnd, gunshipUnlockTime } = CONFIG.difficulty;
    this.spawnTimer = spawnIntervalStart + (spawnIntervalEnd - spawnIntervalStart) * this.difficulty;

    // Weighted type pick; weavers and gunships get likelier over time.
    const roll = Math.random();
    let type = 'scout';
    if (this.elapsed > gunshipUnlockTime && roll < 0.12 + 0.10 * this.difficulty) {
      type = 'gunship';
    } else if (roll < 0.40 + 0.15 * this.difficulty) {
      type = 'weaver';
    }
    this.enemies.push(new Enemy(type, this.speedMul));
  }

  /* ---------- collisions & combat ---------- */

  handleCollisions() {
    // Player bullets vs enemies.
    for (const bullet of this.bullets) {
      for (const enemy of this.enemies) {
        if (enemy.dead || bullet.dead) continue;
        if (circlesHit(bullet, enemy)) {
          bullet.dead = true;
          this.damageEnemy(enemy, 1);
        }
      }
    }

    if (!this.player.invulnerable) {
      // Enemy bullets vs player.
      for (const bullet of this.enemyBullets) {
        if (!bullet.dead && circlesHit(bullet, this.player)) {
          bullet.dead = true;
          this.hitPlayer();
          break;
        }
      }
    }

    // Jet-to-jet ramming: the enemy always dies; the player loses a life
    // unless invulnerable (the enemy still explodes so the grace period
    // can't be abused as a battering ram for points — score is awarded
    // only for shot-down jets).
    for (const enemy of this.enemies) {
      if (!enemy.dead && circlesHit(enemy, this.player)) {
        this.explode(enemy.x, enemy.y, enemy.spec.color, enemy.type === 'gunship');
        enemy.dead = true;
        if (!this.player.invulnerable) this.hitPlayer();
      }
    }

    // Player vs power-ups.
    for (const p of this.powerUps) {
      if (!p.dead && circlesHit(p, this.player)) {
        p.dead = true;
        this.rapidFireTimer = CONFIG.powerUp.duration;
        Sound.powerUp();
      }
    }
  }

  damageEnemy(enemy, amount) {
    enemy.hp -= amount;
    if (enemy.hp > 0) return;

    enemy.dead = true;
    this.score += enemy.spec.score;
    this.explode(enemy.x, enemy.y, enemy.spec.color, enemy.type === 'gunship');
    if (Math.random() < CONFIG.powerUp.dropChance) {
      this.powerUps.push(new PowerUp(enemy.x, enemy.y));
    }
  }

  hitPlayer() {
    this.explode(this.player.x, this.player.y, '#35d0ff', true);
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.player.reset(); // re-center + invulnerability grace
    }
  }

  explode(x, y, color, big) {
    const count = big ? 36 : 18;
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, Math.random() < 0.35 ? '#ffd166' : color));
    }
    Sound.explosion(big);
  }

  /* ---------- HUD & persistence ---------- */

  updateHud() {
    this.ui.score.textContent = this.score;
    this.ui.highScore.textContent = Math.max(this.highScore, this.score);
    this.ui.lives.innerHTML = '<span class="life-icon"></span>'.repeat(this.lives);

    const active = this.rapidFireTimer > 0;
    this.ui.powerBarWrap.classList.toggle('hidden', !active);
    if (active) {
      this.ui.powerBar.style.width = `${(this.rapidFireTimer / CONFIG.powerUp.duration) * 100}%`;
    }
  }

  loadHighScore() {
    try {
      return parseInt(localStorage.getItem(CONFIG.highScoreKey), 10) || 0;
    } catch {
      return 0; // localStorage can throw in some privacy modes
    }
  }

  saveHighScore() {
    try {
      localStorage.setItem(CONFIG.highScoreKey, String(this.highScore));
    } catch {
      /* non-fatal */
    }
  }

  /* ---------- rendering ---------- */

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);

    for (const star of this.stars) star.draw(ctx);
    for (const p of this.particles) p.draw(ctx);

    if (this.state === State.PLAYING) {
      for (const p of this.powerUps) p.draw(ctx);
      for (const e of this.enemies) e.draw(ctx);
      for (const b of this.bullets) b.draw(ctx);
      for (const b of this.enemyBullets) b.draw(ctx);
      this.player.draw(ctx, this.time);
    }
  }
}

/* ===================================================================== *
 * 7. Bootstrap — DOM wiring and the main loop
 * ===================================================================== */

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas.getContext('2d'), {
  hud: document.getElementById('hud'),
  score: document.getElementById('hud-score'),
  highScore: document.getElementById('hud-high-score'),
  lives: document.getElementById('hud-lives'),
  powerBarWrap: document.getElementById('power-bar-wrap'),
  powerBar: document.getElementById('power-bar'),
  startScreen: document.getElementById('start-screen'),
  gameOverScreen: document.getElementById('game-over-screen'),
  finalScore: document.getElementById('final-score'),
  bestScore: document.getElementById('best-score'),
  newHighScore: document.getElementById('new-high-score'),
});

Input.init();

document.getElementById('start-btn').addEventListener('click', () => {
  Sound.unlock();
  game.start();
});
document.getElementById('restart-btn').addEventListener('click', () => {
  Sound.unlock();
  game.start();
});

// Fixed-step-free main loop: dt is real elapsed time, clamped so a
// backgrounded tab doesn't fast-forward the simulation on return.
let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  game.tick(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
