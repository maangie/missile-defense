import { Game } from "./game/Game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Canvas 2D context not available");
}

const game = new Game(canvas, ctx);
game.loop();
