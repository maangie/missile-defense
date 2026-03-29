import { describe, it, expect } from "vitest";
import { Particle } from "./Particle";

describe("Particle", () => {
  describe("update", () => {
    it("位置が速度分だけ移動する", () => {
      const p = new Particle(0, 0, 2, 3, 10, 1);
      p.update();
      expect(p.x).toBeCloseTo(2);
      expect(p.y).toBeCloseTo(3); // 移動後に重力・摩擦が適用されるため vy=3 のまま移動
    });

    it("速度が 0.98 倍に減衰する", () => {
      const p = new Particle(0, 0, 10, 0, 10, 1);
      p.update();
      expect(p.vx).toBeCloseTo(9.8);
    });

    it("重力で vy が増加する", () => {
      const p = new Particle(0, 0, 0, 0, 10, 1);
      p.update();
      expect(p.vy).toBeCloseTo(0.03);
    });

    it("life がカウントダウンされる", () => {
      const p = new Particle(0, 0, 0, 0, 5, 1);
      p.update();
      expect(p.life).toBe(4);
    });

    it("life が 0 になったら alive=false", () => {
      const p = new Particle(0, 0, 0, 0, 1, 1);
      p.update();
      expect(p.alive).toBe(false);
    });

    it("alive=false のとき位置が変化しない", () => {
      const p = new Particle(0, 0, 5, 5, 5, 1);
      p.alive = false;
      p.update();
      expect(p.x).toBe(0);
      expect(p.y).toBe(0);
    });
  });
});
