export class ScorePopup {
  x: number;
  y: number;
  value: number;
  life: number;
  maxLife: number;
  vy: number;
  alive = true;

  constructor(x: number, y: number, value: number) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.life = 40;
    this.maxLife = 40;
    this.vy = -0.6;
  }

  update(): void {
    if (!this.alive) return;

    this.y += this.vy;
    this.vy *= 0.98;

    this.life--;
    if (this.life <= 0) {
      this.alive = false;
    }
  }

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
