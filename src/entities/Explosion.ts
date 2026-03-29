/** プレイヤーミサイルや敵ミサイルの爆発エフェクトを表すクラス */
export class Explosion {
  /** 爆発中心のX座標 */
  x: number;
  /** 爆発中心のY座標 */
  y: number;
  /** 現在の爆発半径 */
  radius = 1;
  /** 最大爆発半径 */
  maxRadius: number;
  /** 成長フェーズかどうか */
  growing = true;
  /** 生存フラグ（false になると描画・当たり判定から除外される） */
  alive = true;

  /**
   * 爆発を初期化する
   * @param x 爆発中心のX座標
   * @param y 爆発中心のY座標
   * @param maxRadius 最大爆発半径
   */
  constructor(x: number, y: number, maxRadius: number) {
    this.x = x;
    this.y = y;
    this.maxRadius = maxRadius;
  }

  /**
   * 爆発の状態を1フレーム分更新する。
   * maxRadius に達するまで成長し、その後縮小して消滅する。
   */
  update(): void {
    if (!this.alive) return;

    if (this.growing) {
      this.radius += 2.6;
      if (this.radius >= this.maxRadius) {
        this.growing = false;
      }
    } else {
      this.radius -= 0.6;
      if (this.radius <= 0) {
        this.alive = false;
      }
    }
  }

  /**
   * 指定した座標が爆発半径内に含まれるか判定する
   * @param x 判定するX座標
   * @param y 判定するY座標
   * @returns 半径内なら true
   */
  contains(x: number, y: number): boolean {
    return Math.hypot(this.x - x, this.y - y) <= this.radius;
  }

  /**
   * 爆発エフェクトをキャンバスに描画する
   * @param ctx 2Dレンダリングコンテキスト
   */
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    const lifeRatio = Math.max(0, Math.min(1, this.radius / this.maxRadius));
    const alpha = this.growing ? 0.35 : Math.max(0.08, lifeRatio * 0.35);

    const glow = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius
    );
    glow.addColorStop(0, `rgba(255,255,220,${alpha})`);
    glow.addColorStop(0.25, `rgba(255,220,140,${alpha * 0.9})`);
    glow.addColorStop(0.6, `rgba(255,140,60,${alpha * 0.55})`);
    glow.addColorStop(1, "rgba(255,80,20,0)");

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,250,220,${alpha * 0.95})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.68, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,180,80,${alpha * 0.7})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.38, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.9})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
