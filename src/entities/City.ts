export class City {
  x: number;
  y: number;
  alive = true;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    ctx.fillStyle = "#66ccff";
    ctx.fillRect(this.x - 15, this.y - 20, 30, 20);
  }
}
