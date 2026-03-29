export class PlayerMissile {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  done = false;

  constructor(startX: number, startY: number, targetX: number, targetY: number, speed: number) {
    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = speed;
  }

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

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
  }
}
