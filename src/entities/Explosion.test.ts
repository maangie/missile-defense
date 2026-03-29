import { describe, it, expect } from "vitest";
import { Explosion } from "./Explosion";

describe("Explosion", () => {
  describe("contains", () => {
    it("中心点は常に含む", () => {
      const exp = new Explosion(100, 100, 60);
      exp.radius = 50;
      expect(exp.contains(100, 100)).toBe(true);
    });

    it("半径内の点を含む", () => {
      const exp = new Explosion(0, 0, 60);
      exp.radius = 50;
      expect(exp.contains(30, 40)).toBe(true); // 距離 = 50
    });

    it("半径外の点を含まない", () => {
      const exp = new Explosion(0, 0, 60);
      exp.radius = 50;
      expect(exp.contains(51, 0)).toBe(false);
    });

    it("半径ちょうどの点を含む", () => {
      const exp = new Explosion(0, 0, 60);
      exp.radius = 50;
      expect(exp.contains(50, 0)).toBe(true);
    });
  });

  describe("update", () => {
    it("初期状態では半径が増加する", () => {
      const exp = new Explosion(0, 0, 60);
      const before = exp.radius;
      exp.update();
      expect(exp.radius).toBeGreaterThan(before);
      expect(exp.growing).toBe(true);
    });

    it("maxRadius に達したら縮小フェーズに入る", () => {
      const exp = new Explosion(0, 0, 5);
      for (let i = 0; i < 10; i++) exp.update();
      expect(exp.growing).toBe(false);
    });

    it("縮小しきったら alive=false になる", () => {
      const exp = new Explosion(0, 0, 5);
      for (let i = 0; i < 200; i++) exp.update();
      expect(exp.alive).toBe(false);
    });

    it("alive=false のとき半径が変化しない", () => {
      const exp = new Explosion(0, 0, 60);
      exp.alive = false;
      const r = exp.radius;
      exp.update();
      expect(exp.radius).toBe(r);
    });
  });
});
