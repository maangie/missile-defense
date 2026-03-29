/** 敵の攻撃ミサイルを表すクラス */
export class EnemyMissile {
  /** 現在のX座標 */
  x: number;
  /** 現在のY座標 */
  y: number;
  /** 目標のX座標 */
  targetX: number;
  /** 目標のY座標 */
  targetY: number;
  /** 移動速度（ピクセル/フレーム） */
  speed: number;
  /** 生存フラグ */
  alive = true;

  /** 分裂するかどうか */
  split: boolean;
  /** 分裂するY座標 */
  splitY: number;
  /** 分裂時に生成する子ミサイルの数 */
  childrenCount: number;

  /** 軌跡の座標履歴 */
  trail: { x: number; y: number }[] = [];
  /** 軌跡の最大長 */
  trailMax = 18;

  /**
   * 敵ミサイルを初期化する
   * @param startX 初期X座標
   * @param startY 初期Y座標
   * @param targetX 目標のX座標
   * @param targetY 目標のY座標
   * @param speed 移動速度（ピクセル/フレーム）
   * @param split 分裂するかどうか
   * @param splitY 分裂するY座標
   * @param childrenCount 分裂時に生成する子ミサイルの数
   */
  constructor(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    speed: number,
    split = false,
    splitY = Infinity,
    childrenCount = 0
  ) {
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = speed;
    this.split = split;
    this.splitY = splitY;
    this.childrenCount = childrenCount;
  }

  /**
   * ミサイルの位置を1フレーム分更新し、軌跡を記録する
   * @returns 目標（地面）に到達したら true
   */
  update(): boolean {
    if (!this.alive) return false;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.trailMax) {
      this.trail.shift();
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const d = Math.hypot(dx, dy);

    if (d <= this.speed) {
      this.x = this.targetX;
      this.y = this.targetY;
      return true;
    }

    this.x += (dx / d) * this.speed;
    this.y += (dy / d) * this.speed;
    return false;
  }

  /**
   * ミサイルが分裂すべき状態かどうかを判定する
   * @returns 生存中かつ split=true かつ splitY に達していたら true
   */
  shouldSplit(): boolean {
    return this.alive && this.split && this.y >= this.splitY;
  }

  /**
   * 煙の軌跡をキャンバスに描画する
   * @param ctx 2Dレンダリングコンテキスト
   */
  drawTrail(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length < 2) return;

    const smoke = this.split ? "220,190,190" : "180,180,180";

    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const t = i / this.trail.length;
      const radius = 1 + t * 3;
      const alpha = 0.04 + t * 0.12;

      ctx.fillStyle = `rgba(${smoke},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 1; i < this.trail.length; i++) {
      const p1 = this.trail[i - 1];
      const p2 = this.trail[i];
      const t = i / this.trail.length;

      ctx.strokeStyle = `rgba(${smoke},${0.05 + t * 0.14})`;
      ctx.lineWidth = 0.5 + t * 1.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  /**
   * ミサイル本体と軌跡をキャンバスに描画する
   * @param ctx 2Dレンダリングコンテキスト
   */
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    this.drawTrail(ctx);

    ctx.strokeStyle = this.split ? "#ffaaaa" : "#ff5050";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - 3, this.y - 10);
    ctx.stroke();

    if (this.split) {
      ctx.fillStyle = "#ffcc88";
      ctx.fillRect(this.x - 1, this.y - 1, 3, 3);
    }
  }
}
