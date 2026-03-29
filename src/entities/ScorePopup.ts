/** 敵撃墜時に表示されるスコアポップアップを表すクラス */
export class ScorePopup {
  /** X座標 */
  x: number;
  /** Y座標（フレームごとに上昇する） */
  y: number;
  /** 表示するスコア値 */
  value: number;
  /** 残りライフ（フレーム数） */
  life: number;
  /** 初期ライフ（フェードアウト計算に使用） */
  maxLife: number;
  /** Y方向の速度（上方向に移動） */
  vy: number;
  /** 生存フラグ */
  alive = true;

  /**
   * スコアポップアップを初期化する
   * @param x X座標
   * @param y Y座標
   * @param value 表示するスコア値
   */
  constructor(x: number, y: number, value: number) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.life = 40;
    this.maxLife = 40;
    this.vy = -0.6;
  }

  /**
   * ポップアップの状態を1フレーム分更新する。
   * 上方向に移動しながらフェードアウトし、ライフが尽きると消滅する。
   */
  update(): void {
    if (!this.alive) return;

    this.y += this.vy;
    this.vy *= 0.98;

    this.life--;
    if (this.life <= 0) {
      this.alive = false;
    }
  }

  /**
   * スコアポップアップをキャンバスに描画する
   * @param ctx 2Dレンダリングコンテキスト
   */
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    const t = this.life / this.maxLife;
    const alpha = Math.max(0, t);
    const scale = 0.9 + (1 - t) * 0.4;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${Math.floor(16 + 10 * scale)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(`+${this.value}`, this.x, this.y);
    ctx.fillStyle = this.value >= 200 ? "#ff9933" : "#ffd966";
    ctx.fillText(`+${this.value}`, this.x, this.y);
    ctx.restore();
  }
}
