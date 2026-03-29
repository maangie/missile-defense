export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alive = true;

  constructor(x: number, y: number, vx: number, vy: number, life: number, size: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }

  update(): void {
    if (!this.alive) return;

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.98;
    this.vy *= 0.98;
    this.vy += 0.03;

    this.life--;
    if (this.life <= 0) {
      this.alive = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    const t = this.life / this.maxLife;
    const alpha = Math.max(0, t * 0.9);
    const radius = Math.max(0.5, this.size * t);

    const glow = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      radius * 2.2
    );
    glow.addColorStop(0, `rgba(255,255,220,${alpha})`);
    glow.addColorStop(0.35, `rgba(255,200,80,${alpha * 0.9})`);
    glow.addColorStop(0.7, `rgba(255,100,20,${alpha * 0.5})`);
    glow.addColorStop(1, "rgba(255,80,20,0)");

    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,220,120,${alpha})`;
    ctx.fill();
  }
}
