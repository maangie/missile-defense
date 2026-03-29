export class EnemyMissile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  alive = true;

  split: boolean;
  splitY: number;
  childrenCount: number;

  trail: { x: number; y: number }[] = [];
  trailMax = 18;

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

  shouldSplit(): boolean {
    return this.alive && this.split && this.y >= this.splitY;
  }

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
