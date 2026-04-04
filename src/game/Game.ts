import { Sound } from "../audio/Sound";
import { City } from "../entities/City";
import { EnemyMissile } from "../entities/EnemyMissile";
import { Explosion } from "../entities/Explosion";
import { Particle } from "../entities/Particle";
import { PlayerMissile } from "../entities/PlayerMissile";
import { ScorePopup } from "../entities/ScorePopup";
import type { Base, Star, Vec2 } from "../types/common";

/** ゲーム全体の状態管理と描画を担うメインクラス */
export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  /** 現在のゲーム状態 */
  state: "title" | "playing" | "gameover" = "title";

  /** キャンバスの幅（ピクセル） */
  width = 0;
  /** キャンバスの高さ（ピクセル） */
  height = 0;
  /** 地面のY座標 */
  groundY = 0;

  /** 現在のスコア */
  score = 0;
  /** ハイスコア */
  highScore = 0;
  /** 現在のウェーブ番号 */
  wave = 1;

  /** 画面フラッシュの強度（0〜1） */
  flashStrength = 0;
  /** 画面フラッシュの色（RGB文字列） */
  flashColor = "255,255,255";

  /** 画面シェイクの残りフレーム数 */
  shakeTime = 0;
  /** 画面シェイクの振幅 */
  shakeStrength = 0;

  /** 照準カーソルの座標 */
  cursor: Vec2 = { x: 200, y: 200 };
  /** 照準カーソルの残像座標（慣性効果） */
  cursorTrail: Vec2 = { x: 200, y: 200 };
  /** 残像の追従速度 */
  cursorTrailSpeed = 0.18;
  /** カーソルのX方向速度 */
  cursorVX = 0;
  /** カーソルのY方向速度 */
  cursorVY = 0;
  /** マウス移動量に対するカーソル加速度の倍率 */
  cursorSensitivity = 0.35;
  /** カーソル速度の減衰率 */
  cursorFriction = 0.90;
  /** カーソルの最大速度（ピクセル/フレーム） */
  cursorMaxSpeed = 18;
  private touchStartX = 0;
  private touchStartY = 0;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private readonly TAP_THRESHOLD = 10;

  /** ミサイル基地の配列 */
  bases: Base[] = [];
  /** 都市の配列 */
  cities: City[] = [];
  /** 背景の星の配列 */
  stars: Star[] = [];

  /** 敵ミサイルの配列 */
  enemyMissiles: EnemyMissile[] = [];
  /** プレイヤーミサイルの配列 */
  playerMissiles: PlayerMissile[] = [];
  /** 爆発エフェクトの配列 */
  explosions: Explosion[] = [];
  /** パーティクルの配列 */
  particles: Particle[] = [];
  /** スコアポップアップの配列 */
  scorePopups: ScorePopup[] = [];

  /** 敵スポーンのタイマー */
  spawnTimer = 0;
  /** 敵スポーンの間隔（フレーム数） */
  spawnInterval = 55;
  /** 1ウェーブあたりの敵数 */
  enemiesPerWave = 12;
  /** 現在のウェーブでスポーン済みの敵数 */
  enemiesSpawned = 0;
  /** 現在のウェーブで撃墜した敵数 */
  enemiesDestroyed = 0;
  /** 敵ミサイルの分裂確率（0〜1） */
  splitChance = 0.15;
  /** 敵ミサイルの速度スケール */
  speedScale = 1;

  /** 現在のコンボ数 */
  combo = 0;
  /** コンボが続いている残りフレーム数 */
  comboTimer = 0;
  /** コンボが途切れるまでのフレーム数 */
  comboWindow = 40;
  /** 現在のコンボ倍率 */
  comboMultiplier = 1;

  /** 効果音管理 */
  sound = new Sound();

  /**
   * Gameインスタンスを初期化する
   * @param canvas 描画先のキャンバス要素
   * @param ctx 2Dレンダリングコンテキスト
   */
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;

    this.loadHighScore();
    this.resize();
    this.bindEvents();
  }

  /** マウス・キーボード・ウィンドウリサイズのイベントリスナーを登録する */
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

    this.canvas.addEventListener("touchstart", (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.touchStartX = t.clientX;
      this.touchStartY = t.clientY;
      this.lastTouchX = t.clientX;
      this.lastTouchY = t.clientY;
    }, { passive: false });

    this.canvas.addEventListener("touchmove", (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const dx = t.clientX - this.lastTouchX;
      const dy = t.clientY - this.lastTouchY;
      this.lastTouchX = t.clientX;
      this.lastTouchY = t.clientY;

      this.cursorVX += dx * this.cursorSensitivity;
      this.cursorVY += dy * this.cursorSensitivity;
      this.cursorVX = Math.max(-this.cursorMaxSpeed, Math.min(this.cursorMaxSpeed, this.cursorVX));
      this.cursorVY = Math.max(-this.cursorMaxSpeed, Math.min(this.cursorMaxSpeed, this.cursorVY));
    }, { passive: false });

    this.canvas.addEventListener("touchend", (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const dx = t.clientX - this.touchStartX;
      const dy = t.clientY - this.touchStartY;
      const dist = Math.hypot(dx, dy);

      if (dist < this.TAP_THRESHOLD) {
        if (this.sound.ctx.state === "suspended") {
          void this.sound.ctx.resume();
        }
        if (this.state === "title" || this.state === "gameover") {
          this.startGame();
        } else {
          this.firePlayerMissile(this.cursor.x, this.cursor.y);
        }
      }
    }, { passive: false });
  }

  /** ゲームをリセットして開始状態にする */
  startGame(): void {
    this.reset();
    this.state = "playing";
  }

  /** LocalStorage からハイスコアを読み込む */
  loadHighScore(): void {
    const raw = localStorage.getItem("missile-command-like-highscore");
    const value = raw ? Number(raw) : 0;
    this.highScore = Number.isFinite(value) ? value : 0;
  }

  /** 現在のハイスコアを LocalStorage に保存する */
  saveHighScore(): void {
    localStorage.setItem("missile-command-like-highscore", String(this.highScore));
  }

  /** 現在のスコアがハイスコアを超えていれば更新して保存する */
  updateHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }

  /** キャンバスをウィンドウサイズに合わせてリサイズし、初期配置を更新する */
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

  /** 左・中・右の3カ所にミサイル基地を配置する */
  private setupBases(): void {
    const y = this.groundY;
    this.bases = [
      { x: this.width * 0.18, y, ammo: 10, alive: true },
      { x: this.width * 0.5, y, ammo: 10, alive: true },
      { x: this.width * 0.82, y, ammo: 10, alive: true }
    ];
  }

  /** 6カ所に都市を配置する */
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

  /**
   * 背景の星をランダムに生成する
   * @param count 生成する星の数（デフォルト: 120）
   */
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

  /** ゲーム状態を初期値にリセットする */
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

  /**
   * 指定した範囲のランダムな数値を返す
   * @param min 最小値
   * @param max 最大値
   * @returns min 以上 max 未満のランダムな数値
   */
  rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * 生存している都市の一覧を返す
   * @returns 生存中の City 配列
   */
  getAliveCities(): City[] {
    return this.cities.filter((c) => c.alive);
  }

  /**
   * 生存している基地の一覧を返す
   * @returns 生存中の Base 配列
   */
  getAliveBases(): Base[] {
    return this.bases.filter((b) => b.alive);
  }

  /**
   * 弾薬が残っている生存基地の一覧を返す
   * @returns 弾薬があり生存中の Base 配列
   */
  getAvailableBases(): Base[] {
    return this.bases.filter((b) => b.alive && b.ammo > 0);
  }

  /**
   * 目標X座標に最も近い利用可能な基地を返す
   * @param targetX 目標のX座標
   * @returns 最近傍の利用可能な基地、存在しなければ null
   */
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

  /** 照準カーソルの位置と速度を1フレーム分更新する */
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

  /**
   * 最寄りの基地からプレイヤーミサイルを発射する
   * @param targetX 目標のX座標
   * @param targetY 目標のY座標
   */
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

  /**
   * 生存している都市・基地からランダムに地上目標を選択する
   * @returns 選択した目標の座標、対象がなければ null
   */
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

  /** 現在のウェーブ番号に応じて難易度パラメータを設定する */
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

  /** 敵ミサイルを1体スポーンする（ウェーブ上限に達している場合は何もしない） */
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

  /**
   * 敵ミサイルを分裂させ、子ミサイルを生成する
   * @param parent 分裂する親ミサイル
   */
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

  /**
   * 爆発エフェクトを生成する
   * @param x 爆発中心のX座標
   * @param y 爆発中心のY座標
   * @param maxRadius 最大爆発半径（デフォルト: 60）
   */
  createExplosion(x: number, y: number, maxRadius = 60): void {
    this.explosions.push(new Explosion(x, y, maxRadius));
  }

  /**
   * パーティクルエフェクトを生成する
   * @param x 生成中心のX座標
   * @param y 生成中心のY座標
   * @param count 生成するパーティクルの数
   * @param power 速度の倍率（デフォルト: 1）
   */
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

  /**
   * スコアポップアップを生成する
   * @param x 表示X座標
   * @param y 表示Y座標
   * @param value 表示するスコア値
   */
  createScorePopup(x: number, y: number, value: number): void {
    this.scorePopups.push(
      new ScorePopup(
        x + (Math.random() * 10 - 5),
        y + (Math.random() * 10 - 5),
        value
      )
    );
  }

  /** 命中を記録し、コンボカウントとコンボ倍率を更新する */
  registerHit(): void {
    this.combo++;
    this.comboTimer = this.comboWindow;
    this.comboMultiplier = 1 + Math.floor(this.combo / 3);
  }

  /**
   * 指定座標周辺の都市・基地にダメージを与える
   * @param x 爆発中心のX座標
   * @param y 爆発中心のY座標
   */
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

  /** ウェーブクリアを判定し、クリアボーナスの加算とウェーブ進行を行う */
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

  /**
   * 画面フラッシュエフェクトをトリガーする
   * @param strength フラッシュの強度（0〜1）
   * @param color フラッシュの色（RGB文字列）
   */
  triggerFlash(strength: number, color = "255,255,255"): void {
    this.flashStrength = Math.max(this.flashStrength, strength);
    this.flashColor = color;
  }

  /**
   * 画面シェイクエフェクトをトリガーする
   * @param duration シェイクの持続フレーム数
   * @param strength シェイクの振幅（ピクセル）
   */
  triggerShake(duration: number, strength: number): void {
    this.shakeTime = Math.max(this.shakeTime, duration);
    this.shakeStrength = Math.max(this.shakeStrength, strength);
  }

  /** ゲームの1フレーム分の状態を更新する */
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

  /** 空の背景グラデーションを描画する */
  drawSky(): void {
    const sky = this.ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, "#000000");
    sky.addColorStop(0.7, "#081020");
    sky.addColorStop(1, "#201000");
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** 背景の星をきらめき効果付きで描画する */
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

  /** 遠景の山並みシルエットを描画する */
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

  /** 都市のビルシルエットを描画する */
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

  /** 地面を描画する */
  drawGround(): void {
    this.ctx.fillStyle = "#2a1800";
    this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
  }

  /** ミサイル基地を三角形で描画する */
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

  /** 都市を描画する */
  drawCities(): void {
    for (const city of this.cities) {
      city.draw(this.ctx);
    }
  }

  /** エイムカーソルと残像を描画する */
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

  /** 各基地の残弾数（L/C/R）を画面下部に描画する */
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

  /** スコア・ウェーブ・残敵数・都市数・コンボ等のUIを描画する */
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

  /** タイトル画面を描画する */
  drawTitle(): void {
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "64px sans-serif";
    this.ctx.fillText("MISSILE DEFENSE", this.width / 2, this.height * 0.4);

    const t = performance.now() * 0.003;
    const alpha = 0.6 + Math.sin(t) * 0.4;
    this.ctx.fillStyle = `rgba(200,200,200,${alpha})`;
    this.ctx.font = "20px sans-serif";
    this.ctx.fillText("タップ / クリックで開始", this.width / 2, this.height * 0.55);

    this.ctx.font = "16px sans-serif";
    this.ctx.fillStyle = "#888";
    this.ctx.fillText("スワイプで照準 / タップ・クリックで発射", this.width / 2, this.height * 0.62);
  }

  /** ゲームオーバー画面を描画する */
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
    this.ctx.fillText("タップ / キー / 右クリックで再スタート", this.width / 2, this.height * 0.65);
  }

  /** 画面フラッシュエフェクトを描画する */
  drawFlash(): void {
    if (this.flashStrength <= 0) return;
    this.ctx.fillStyle = `rgba(${this.flashColor}, ${Math.min(this.flashStrength, 1)})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** 1フレーム分の全描画処理を行う */
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

  /** requestAnimationFrame を使ったゲームループを実行する */
  loop = (): void => {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  };
}
