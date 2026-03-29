import { Sound } from "../audio/Sound";
import { City } from "../entities/City";
import { EnemyMissile } from "../entities/EnemyMissile";
import { Explosion } from "../entities/Explosion";
import { Particle } from "../entities/Particle";
import { PlayerMissile } from "../entities/PlayerMissile";
import { ScorePopup } from "../entities/ScorePopup";
import type { Base, Star, Vec2 } from "../types/common";

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  state: "title" | "playing" | "gameover" = "title";

  width = 0;
  height = 0;
  groundY = 0;

  score = 0;
  highScore = 0;
  wave = 1;

  flashStrength = 0;
  flashColor = "255,255,255";

  shakeTime = 0;
  shakeStrength = 0;

  cursor: Vec2 = { x: 200, y: 200 };
  cursorTrail: Vec2 = { x: 200, y: 200 };
  cursorTrailSpeed = 0.18;
  cursorVX = 0;
  cursorVY = 0;
  cursorSensitivity = 0.35;
  cursorFriction = 0.90;
  cursorMaxSpeed = 18;

  bases: Base[] = [];
  cities: City[] = [];
  stars: Star[] = [];

  enemyMissiles: EnemyMissile[] = [];
  playerMissiles: PlayerMissile[] = [];
  explosions: Explosion[] = [];
  particles: Particle[] = [];
  scorePopups: ScorePopup[] = [];

  spawnTimer = 0;
  spawnInterval = 55;
  enemiesPerWave = 12;
  enemiesSpawned = 0;
  enemiesDestroyed = 0;
  splitChance = 0.15;
  speedScale = 1;

  combo = 0;
  comboTimer = 0;
  comboWindow = 40;
  comboMultiplier = 1;

  sound = new Sound();

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;

    this.loadHighScore();
    this.resize();
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener("resize", () => this.resize());

    this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
      this.cursorVX += e.movementX * this.cursorSensitivity;
      this.cursorVY += e.movementY * this.cursorSensitivity;

      this.cursorVX = Math.max(-this.cursorMaxSpeed, Math.min(this.cursorMaxSpeed, this.cursorVX));
      this.cursorVY = Math.max(-this.cursorMaxSpeed, Math.min(this.cursorMaxSpeed, this.cursorVY));
    });

    this.canvas.addEventListener("click", () => {
      if (this.sound.ctx.state === "suspended") {
        void this.sound.ctx.resume();
      }

      if (this.state === "title") {
        this.startGame();
        return;
      }

      if (this.state === "gameover") {
        return;
      }

      this.firePlayerMissile(this.cursor.x, this.cursor.y);
    });

    this.canvas.addEventListener("contextmenu", (e: MouseEvent) => {
      e.preventDefault();
      if (this.state === "gameover" || this.state === "title") {
        this.startGame();
      }
    });

    window.addEventListener("keydown", () => {
      if (this.state === "gameover" || this.state === "title") {
        this.startGame();
      }
    });
  }

  startGame(): void {
    this.reset();
    this.state = "playing";
  }

  loadHighScore(): void {
    const raw = localStorage.getItem("missile-command-like-highscore");
    const value = raw ? Number(raw) : 0;
    this.highScore = Number.isFinite(value) ? value : 0;
  }

  saveHighScore(): void {
    localStorage.setItem("missile-command-like-highscore", String(this.highScore));
  }

  updateHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.groundY = this.height - 80;

    this.setupBases();
    this.setupCities();
    this.generateStars();

    if (this.state === "title" && this.cursor.x === 200 && this.cursor.y === 200) {
      this.cursor.x = this.width / 2;
      this.cursor.y = this.height * 0.5;
      this.cursorTrail.x = this.cursor.x;
      this.cursorTrail.y = this.cursor.y;
    }
  }

  private setupBases(): void {
    const y = this.groundY;
    this.bases = [
      { x: this.width * 0.18, y, ammo: 10, alive: true },
      { x: this.width * 0.5, y, ammo: 10, alive: true },
      { x: this.width * 0.82, y, ammo: 10, alive: true }
    ];
  }

  private setupCities(): void {
    const y = this.groundY;
    const positions = [
      this.width * 0.08,
      this.width * 0.26,
      this.width * 0.38,
      this.width * 0.62,
      this.width * 0.74,
      this.width * 0.92
    ];
    this.cities = positions.map((x) => new City(x, y));
  }

  generateStars(count = 120): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.75),
        r: Math.random() * 1.6 + 0.3,
        a: Math.random() * 0.6 + 0.2
      });
    }
  }

  reset(): void {
    this.score = 0;
    this.wave = 1;
    this.flashStrength = 0;
    this.flashColor = "255,255,255";
    this.shakeTime = 0;
    this.shakeStrength = 0;

    this.spawnTimer = 0;
    this.enemiesSpawned = 0;
    this.enemiesDestroyed = 0;
    this.enemyMissiles = [];
    this.playerMissiles = [];
    this.explosions = [];
    this.particles = [];
    this.scorePopups = [];

    this.combo = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1;

    this.setupBases();
    this.setupCities();
    this.applyWaveSettings();

    this.cursor.x = this.width / 2;
    this.cursor.y = this.height * 0.4;
    this.cursorTrail.x = this.cursor.x;
    this.cursorTrail.y = this.cursor.y;
    this.cursorVX = 0;
    this.cursorVY = 0;
  }

  rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  getAliveCities(): City[] {
    return this.cities.filter((c) => c.alive);
  }

  getAliveBases(): Base[] {
    return this.bases.filter((b) => b.alive);
  }

  getAvailableBases(): Base[] {
    return this.bases.filter((b) => b.alive && b.ammo > 0);
  }

  findNearestAvailableBase(targetX: number): Base | null {
    const availableBases = this.getAvailableBases();
    if (availableBases.length === 0) return null;

    let best: Base | null = null;
    let bestDist = Infinity;

    for (const base of availableBases) {
      const d = Math.abs(base.x - targetX);
      if (d < bestDist) {
        bestDist = d;
        best = base;
      }
    }

    return best;
  }

  updateCursor(): void {
    this.cursor.x += this.cursorVX;
    this.cursor.y += this.cursorVY;

    this.cursorVX *= this.cursorFriction;
    this.cursorVY *= this.cursorFriction;

    if (Math.abs(this.cursorVX) < 0.01) this.cursorVX = 0;
    if (Math.abs(this.cursorVY) < 0.01) this.cursorVY = 0;

    if (this.cursor.x < 0) {
      this.cursor.x = 0;
      this.cursorVX = 0;
    }
    if (this.cursor.x > this.width) {
      this.cursor.x = this.width;
      this.cursorVX = 0;
    }
    if (this.cursor.y < 0) {
      this.cursor.y = 0;
      this.cursorVY = 0;
    }
    if (this.cursor.y > this.height) {
      this.cursor.y = this.height;
      this.cursorVY = 0;
    }

    this.cursorTrail.x += (this.cursor.x - this.cursorTrail.x) * this.cursorTrailSpeed;
    this.cursorTrail.y += (this.cursor.y - this.cursorTrail.y) * this.cursorTrailSpeed;
  }

  firePlayerMissile(targetX: number, targetY: number): void {
    const base = this.findNearestAvailableBase(targetX);
    if (!base) return;

    base.ammo--;
    this.sound.shoot();

    this.cursorVX *= 0.98;
    this.cursorVY *= 0.98;
    this.cursorTrail.x += (this.cursor.x - this.cursorTrail.x) * 0.4;
    this.cursorTrail.y += (this.cursor.y - this.cursorTrail.y) * 0.4;

    this.playerMissiles.push(new PlayerMissile(base.x, base.y, targetX, targetY, 7.2));
  }

  pickRandomGroundTarget(): Vec2 | null {
    const targets: Vec2[] = [];

    for (const city of this.getAliveCities()) {
      targets.push({ x: city.x, y: city.y });
    }
    for (const base of this.getAliveBases()) {
      targets.push({ x: base.x, y: base.y });
    }

    if (targets.length === 0) return null;
    return targets[Math.floor(Math.random() * targets.length)];
  }

  applyWaveSettings(): void {
    const w = this.wave;

    this.enemiesPerWave = 10 + w * 4;
    this.spawnInterval = Math.max(18, 60 - w * 4);
    this.splitChance = Math.min(0.15 + w * 0.04, 0.55);
    this.speedScale = 1 + w * 0.08;

    if (w % 3 === 0) {
      this.enemiesPerWave += 8;
      this.spawnInterval = Math.max(16, this.spawnInterval - 6);
    }

    if (w % 4 === 0) {
      this.speedScale += 0.4;
    }

    if (w % 5 === 0) {
      this.splitChance = Math.min(0.75, this.splitChance + 0.2);
    }
  }

  spawnEnemyMissile(): void {
    if (this.enemiesSpawned >= this.enemiesPerWave) return;

    const target = this.pickRandomGroundTarget();
    if (!target) return;

    const startX = this.rand(20, this.width - 20);
    const willSplit = Math.random() < this.splitChance;
    const splitY = this.rand(this.height * 0.18, this.height * 0.55);
    const childrenCount = Math.random() < 0.7 ? 2 : 3;
    const speed = this.rand(1.4, 2.6) * this.speedScale;

    this.enemyMissiles.push(
      new EnemyMissile(
        startX,
        -10,
        target.x,
        target.y,
        speed,
        willSplit,
        splitY,
        childrenCount
      )
    );

    this.enemiesSpawned++;
  }

  splitEnemyMissile(parent: EnemyMissile): void {
    if (!parent.alive) return;

    parent.alive = false;
    this.createExplosion(parent.x, parent.y, 18);
    this.createParticles(parent.x, parent.y, 10, 0.9);
    this.sound.split();
    this.triggerFlash(0.05, "255,200,180");
    this.triggerShake(4, 2);

    for (let i = 0; i < parent.childrenCount; i++) {
      const target = this.pickRandomGroundTarget();
      if (!target) continue;

      const spreadX = this.rand(-80, 80);
      const childTargetX = Math.max(10, Math.min(this.width - 10, target.x + spreadX));

      this.enemyMissiles.push(
        new EnemyMissile(
          parent.x,
          parent.y,
          childTargetX,
          target.y,
          this.rand(2.0, 3.2) * this.speedScale,
          false,
          Infinity,
          0
        )
      );
    }
  }

  createExplosion(x: number, y: number, maxRadius = 60): void {
    this.explosions.push(new Explosion(x, y, maxRadius));
  }

  createParticles(x: number, y: number, count: number, power = 1): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 2.5 + 0.5) * power;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = Math.floor(Math.random() * 18 + 18);
      const size = Math.random() * 2.5 + 1;

      this.particles.push(new Particle(x, y, vx, vy, life, size));
    }
  }

  createScorePopup(x: number, y: number, value: number): void {
    this.scorePopups.push(
      new ScorePopup(
        x + (Math.random() * 10 - 5),
        y + (Math.random() * 10 - 5),
        value
      )
    );
  }

  registerHit(): void {
    this.combo++;
    this.comboTimer = this.comboWindow;
    this.comboMultiplier = 1 + Math.floor(this.combo / 3);
  }

  damageGroundTarget(x: number, y: number): void {
    for (const city of this.cities) {
      if (city.alive && Math.hypot(city.x - x, city.y - y) < 28) {
        city.alive = false;
      }
    }

    for (const base of this.bases) {
      if (base.alive && Math.hypot(base.x - x, base.y - y) < 30) {
        base.alive = false;
        base.ammo = 0;
      }
    }
  }

  updateWave(): void {
    const waveCleared =
      this.enemiesSpawned >= this.enemiesPerWave &&
      this.enemyMissiles.length === 0 &&
      this.explosions.length === 0 &&
      this.particles.length === 0;

    if (!waveCleared) return;

    let bonus = 0;

    for (const city of this.cities) {
      if (city.alive) bonus += 200;
    }

    for (const base of this.bases) {
      if (base.alive) {
        bonus += base.ammo * 5;
        base.ammo += 10;
      }
    }

    this.score += bonus;
    this.updateHighScore();
    this.wave++;
    this.applyWaveSettings();
    this.enemiesSpawned = 0;
    this.enemiesDestroyed = 0;
    this.spawnTimer = 0;
  }

  triggerFlash(strength: number, color = "255,255,255"): void {
    this.flashStrength = Math.max(this.flashStrength, strength);
    this.flashColor = color;
  }

  triggerShake(duration: number, strength: number): void {
    this.shakeTime = Math.max(this.shakeTime, duration);
    this.shakeStrength = Math.max(this.shakeStrength, strength);
  }

  update(): void {
    this.updateCursor();

    if (this.state === "playing") {
      this.spawnTimer++;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnEnemyMissile();
      }

      for (const missile of this.playerMissiles) {
        const reached = missile.update();
        if (reached && missile.done) {
          this.createExplosion(missile.x, missile.y, 62);
          this.createParticles(missile.x, missile.y, 8, 0.7);
        }
      }

      for (const missile of this.enemyMissiles) {
        if (!missile.alive) continue;

        if (missile.shouldSplit()) {
          this.splitEnemyMissile(missile);
          continue;
        }

        const hitGround = missile.update();
        if (hitGround) {
          missile.alive = false;
          this.createExplosion(missile.x, missile.y, 28);
          this.damageGroundTarget(missile.x, missile.y);
          this.createParticles(missile.x, missile.y, 24, 1.8);
          this.sound.bigExplosion();
          this.triggerFlash(0.18, "255,220,160");
          this.triggerShake(12, 6);
        }
      }

      for (const explosion of this.explosions) {
        explosion.update();

        for (const missile of this.enemyMissiles) {
          if (!missile.alive) continue;

          if (explosion.contains(missile.x, missile.y)) {
            missile.alive = false;
            explosion.maxRadius += 28;
            explosion.growing = true;
            this.registerHit();

            const gained = 100 * this.comboMultiplier;
            this.score += gained;
            this.enemiesDestroyed++;

            this.createScorePopup(missile.x, missile.y, gained);
            this.createParticles(missile.x, missile.y, 14, 1.2);

            this.updateHighScore();
            this.sound.explosion();
            this.triggerFlash(0.08, "255,240,200");
            this.triggerShake(6, 3);
          }
        }
      }

      for (const particle of this.particles) {
        particle.update();
      }

      for (const popup of this.scorePopups) {
        popup.update();
      }

      this.playerMissiles = this.playerMissiles.filter((m) => !m.done);
      this.enemyMissiles = this.enemyMissiles.filter((m) => m.alive);
      this.explosions = this.explosions.filter((e) => e.alive);
      this.particles = this.particles.filter((p) => p.alive);
      this.scorePopups = this.scorePopups.filter((p) => p.alive);

      const allCitiesDead = this.cities.every((c) => !c.alive);
      const allBasesDead = this.bases.every((b) => !b.alive);

      if (allCitiesDead || allBasesDead) {
        this.state = "gameover";
      }

      this.updateWave();

      if (this.comboTimer > 0) {
        this.comboTimer--;
      } else {
        if (this.combo > 3) {
          this.triggerFlash(0.06, "255,180,120");
        }
        this.combo = 0;
        this.comboMultiplier = 1;
      }
    }

    this.flashStrength *= 0.88;
    if (this.flashStrength < 0.01) {
      this.flashStrength = 0;
    }

    if (this.shakeTime > 0) {
      this.shakeTime--;
      this.shakeStrength *= 0.9;
      if (this.shakeStrength < 0.2) {
        this.shakeStrength = 0;
      }
    }
  }

  drawSky(): void {
    const sky = this.ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, "#000000");
    sky.addColorStop(0.7, "#081020");
    sky.addColorStop(1, "#201000");
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawStars(): void {
    const t = performance.now() * 0.001;
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const twinkle = 0.85 + Math.sin(t * 2 + i * 0.7) * 0.15;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255,255,255,${star.a * twinkle})`;
      this.ctx.fill();
    }
  }

  drawMountains(): void {
    const y = this.groundY - 30;
    this.ctx.fillStyle = "rgba(20,20,30,0.9)";
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.width * 0.08, y - 20);
    this.ctx.lineTo(this.width * 0.18, y + 10);
    this.ctx.lineTo(this.width * 0.30, y - 35);
    this.ctx.lineTo(this.width * 0.42, y + 5);
    this.ctx.lineTo(this.width * 0.55, y - 28);
    this.ctx.lineTo(this.width * 0.68, y + 8);
    this.ctx.lineTo(this.width * 0.82, y - 24);
    this.ctx.lineTo(this.width, y + 4);
    this.ctx.lineTo(this.width, this.groundY);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawSkyline(): void {
    const baseY = this.groundY - 8;
    this.ctx.fillStyle = "rgba(10,10,18,0.95)";

    const buildings: Array<[number, number]> = [
      [0.04, 18], [0.07, 28], [0.11, 16], [0.15, 34], [0.21, 22], [0.25, 30],
      [0.60, 18], [0.64, 26], [0.69, 14], [0.73, 32], [0.79, 20], [0.86, 24], [0.91, 18]
    ];

    for (const [rx, h] of buildings) {
      const x = this.width * rx;
      this.ctx.fillRect(x, baseY - h, 14, h);
    }
  }

  drawGround(): void {
    this.ctx.fillStyle = "#2a1800";
    this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
  }

  drawBases(): void {
    for (const base of this.bases) {
      if (!base.alive) continue;

      this.ctx.fillStyle = "#00ffcc";
      this.ctx.beginPath();
      this.ctx.moveTo(base.x - 20, base.y);
      this.ctx.lineTo(base.x, base.y - 25);
      this.ctx.lineTo(base.x + 20, base.y);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  drawCities(): void {
    for (const city of this.cities) {
      city.draw(this.ctx);
    }
  }

  drawCursor(): void {
    const dx = this.cursor.x - this.cursorTrail.x;
    const dy = this.cursor.y - this.cursorTrail.y;
    const dist = Math.hypot(dx, dy);
    const radius = 12 + Math.min(dist * 0.5, 10);

    this.ctx.strokeStyle = "rgba(0,255,0,0.35)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.cursorTrail.x, this.cursorTrail.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = "#00ff00";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(this.cursor.x, this.cursor.y, 12, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(this.cursor.x - 16, this.cursor.y);
    this.ctx.lineTo(this.cursor.x + 16, this.cursor.y);
    this.ctx.moveTo(this.cursor.x, this.cursor.y - 16);
    this.ctx.lineTo(this.cursor.x, this.cursor.y + 16);
    this.ctx.stroke();
  }

  drawAmmoUI(): void {
    this.ctx.font = "18px sans-serif";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.textAlign = "left";

    this.bases.forEach((base, i) => {
      const label = ["L", "C", "R"][i];
      const text = base.alive ? `${label}: ${base.ammo}` : `${label}: X`;
      this.ctx.fillText(text, base.x - 18, this.groundY + 28);
    });
  }

  drawUI(): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "20px sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
    this.ctx.fillText(`HIGH: ${this.highScore}`, 20, 58);
    this.ctx.fillText(`WAVE: ${this.wave}`, 20, 86);

    const remainingToSpawn = this.enemiesPerWave - this.enemiesSpawned;
    const remainingTotal = remainingToSpawn + this.enemyMissiles.length;
    this.ctx.fillText(`LEFT: ${remainingTotal}`, 20, 114);

    const aliveCities = this.cities.filter((c) => c.alive).length;
    this.ctx.fillText(`CITIES: ${aliveCities}`, 20, 142);

    let type = "";
    if (this.wave % 5 === 0) type = "CHAOS";
    else if (this.wave % 4 === 0) type = "FAST";
    else if (this.wave % 3 === 0) type = "RUSH";

    if (type) {
      this.ctx.fillStyle = "#ffaa66";
      this.ctx.fillText(type, 20, 170);
    }

    if (this.combo > 1) {
      this.ctx.fillStyle = "#ffcc66";
      this.ctx.font = "22px sans-serif";
      this.ctx.fillText(`COMBO x${this.comboMultiplier}`, 20, 200);
    }
  }

  drawTitle(): void {
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "64px sans-serif";
    this.ctx.fillText("MISSILE DEFENSE", this.width / 2, this.height * 0.4);

    const t = performance.now() * 0.003;
    const alpha = 0.6 + Math.sin(t) * 0.4;
    this.ctx.fillStyle = `rgba(200,200,200,${alpha})`;
    this.ctx.font = "20px sans-serif";
    this.ctx.fillText("クリックで開始", this.width / 2, this.height * 0.55);

    this.ctx.font = "16px sans-serif";
    this.ctx.fillStyle = "#888";
    this.ctx.fillText("マウスで照準 / クリックで発射", this.width / 2, this.height * 0.62);
  }

  drawGameOver(): void {
    this.ctx.textAlign = "center";
    this.ctx.font = "56px sans-serif";
    this.ctx.fillStyle = "#ff6666";
    this.ctx.fillText("GAME OVER", this.width / 2, this.height * 0.4);

    this.ctx.font = "24px sans-serif";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height * 0.5);
    this.ctx.fillText(`HIGH: ${this.highScore}`, this.width / 2, this.height * 0.55);

    this.ctx.font = "18px sans-serif";
    this.ctx.fillStyle = "#cccccc";
    this.ctx.fillText("右クリックまたはキーで再スタート", this.width / 2, this.height * 0.65);
  }

  drawFlash(): void {
    if (this.flashStrength <= 0) return;
    this.ctx.fillStyle = `rgba(${this.flashColor}, ${Math.min(this.flashStrength, 1)})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  draw(): void {
    this.ctx.save();

    if (this.shakeTime > 0 && this.shakeStrength > 0) {
      const dx = (Math.random() * 2 - 1) * this.shakeStrength;
      const dy = (Math.random() * 2 - 1) * this.shakeStrength;
      this.ctx.translate(dx, dy);
    }

    this.drawSky();
    this.drawStars();
    this.drawMountains();
    this.drawSkyline();
    this.drawGround();

    if (this.state === "title") {
      this.drawTitle();
    } else {
      this.drawBases();
      this.drawCities();

      for (const missile of this.playerMissiles) missile.draw(this.ctx);
      for (const missile of this.enemyMissiles) missile.draw(this.ctx);
      for (const explosion of this.explosions) explosion.draw(this.ctx);
      for (const particle of this.particles) particle.draw(this.ctx);
      for (const popup of this.scorePopups) popup.draw(this.ctx);

      this.drawCursor();
      this.drawUI();
      this.drawAmmoUI();

      if (this.state === "gameover") {
        this.drawGameOver();
      }
    }

    this.drawFlash();
    this.ctx.restore();
  }

  loop = (): void => {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  };
}
