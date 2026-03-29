import { describe, it, expect } from "vitest";
import { EnemyMissile } from "./EnemyMissile";

describe("EnemyMissile", () => {
  describe("update", () => {
    it("目標に向かって移動する", () => {
      const m = new EnemyMissile(0, 0, 100, 0, 10);
      m.update();
      expect(m.x).toBeCloseTo(10);
    });

    it("目標に到達したら true を返す", () => {
      const m = new EnemyMissile(0, 0, 5, 0, 10);
      const result = m.update();
      expect(result).toBe(true);
      expect(m.x).toBe(5);
    });

    it("到達前は false を返す", () => {
      const m = new EnemyMissile(0, 0, 100, 0, 10);
      expect(m.update()).toBe(false);
    });

    it("alive=false のとき false を返し移動しない", () => {
      const m = new EnemyMissile(0, 0, 100, 0, 10);
      m.alive = false;
      expect(m.update()).toBe(false);
      expect(m.x).toBe(0);
    });

    it("トレイルが最大長を超えない", () => {
      const m = new EnemyMissile(0, 0, 1000, 0, 1);
      for (let i = 0; i < 30; i++) m.update();
      expect(m.trail.length).toBeLessThanOrEqual(m.trailMax);
    });
  });

  describe("shouldSplit", () => {
    it("split=true かつ y >= splitY で true を返す", () => {
      const m = new EnemyMissile(0, 0, 0, 500, 2, true, 100, 2);
      m.y = 100;
      expect(m.shouldSplit()).toBe(true);
    });

    it("split=false なら false を返す", () => {
      const m = new EnemyMissile(0, 0, 0, 500, 2, false, 100, 0);
      m.y = 200;
      expect(m.shouldSplit()).toBe(false);
    });

    it("y < splitY なら false を返す", () => {
      const m = new EnemyMissile(0, 0, 0, 500, 2, true, 100, 2);
      m.y = 50;
      expect(m.shouldSplit()).toBe(false);
    });

    it("alive=false なら false を返す", () => {
      const m = new EnemyMissile(0, 0, 0, 500, 2, true, 100, 2);
      m.y = 200;
      m.alive = false;
      expect(m.shouldSplit()).toBe(false);
    });
  });
});
