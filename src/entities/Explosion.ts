export class Explosion {
  x: number;
  y: number;
  radius = 1;
  maxRadius: number;
  growing = true;
  alive = true;

  constructor(x: number, y: number, maxRadius: number) {
    this.x = x;
    this.y = y;
    this.maxRadius = maxRadius;
  }

  update(): void {
    if (!this.alive) return;

    if (this.growing) {
      this.radius += 2.6;
      if (this.radius >= this.maxRadius) {
        this.growing = false;
      }
    } else {
      this.radius -= 1.25;
      if (this.radius <= 0) {
        this.alive = false;
      }
    }
  }

  contains(x: number, y: number): boolean {
    return Math.hypot(this.x - x, this.y - y) <= this.radius;
  }

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
