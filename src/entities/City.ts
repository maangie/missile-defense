/** プレイヤーが守るべき都市を表すクラス */
export class City {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
  /** 生存フラグ */
  alive = true;

  /**
   * 都市を初期化する
   * @param x X座標
   * @param y Y座標
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * 都市をキャンバスに描画する
   * @param ctx 2Dレンダリングコンテキスト
   */
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    ctx.fillStyle = "#66ccff";
    ctx.fillRect(this.x - 15, this.y - 20, 30, 20);
  }
}
