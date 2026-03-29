/** プレイヤーが発射するミサイルを表すクラス */
export class PlayerMissile {
  /** 現在のX座標 */
  x: number;
  /** 現在のY座標 */
  y: number;
  /** 発射元のX座標（軌跡描画に使用） */
  startX: number;
  /** 発射元のY座標（軌跡描画に使用） */
  startY: number;
  /** 目標のX座標 */
  targetX: number;
  /** 目標のY座標 */
  targetY: number;
  /** 移動速度（ピクセル/フレーム） */
  speed: number;
  /** 目標到達フラグ */
  done = false;

  /**
   * プレイヤーミサイルを初期化する
   * @param startX 発射元のX座標
   * @param startY 発射元のY座標
   * @param targetX 目標のX座標
   * @param targetY 目標のY座標
   * @param speed 移動速度（ピクセル/フレーム）
   */
  constructor(startX: number, startY: number, targetX: number, targetY: number, speed: number) {
    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = speed;
  }

  /**
   * ミサイルの位置を1フレーム分更新する
   * @returns 目標に到達したら true
   */
  update(): boolean {
    if (this.done) return true;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const d = Math.hypot(dx, dy);

    if (d <= this.speed) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.done = true;
      return true;
    }

    this.x += (dx / d) * this.speed;
    this.y += (dy / d) * this.speed;
    return false;
  }

  /**
   * ミサイルの軌跡をキャンバスに描画する
   * @param ctx 2Dレンダリングコンテキスト
   */
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
  }
}
