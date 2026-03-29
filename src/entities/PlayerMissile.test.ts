import { describe, it, expect } from "vitest";
import { PlayerMissile } from "./PlayerMissile";

describe("PlayerMissile", () => {
  describe("update", () => {
    it("目標に向かって移動する", () => {
      const m = new PlayerMissile(0, 0, 100, 0, 10);
      m.update();
      expect(m.x).toBeCloseTo(10);
      expect(m.y).toBeCloseTo(0);
    });

    it("目標に到達したら true を返し done=true になる", () => {
      const m = new PlayerMissile(0, 0, 5, 0, 10);
      const result = m.update();
      expect(result).toBe(true);
      expect(m.done).toBe(true);
      expect(m.x).toBe(5);
    });

    it("到達前は false を返す", () => {
      const m = new PlayerMissile(0, 0, 100, 0, 10);
      expect(m.update()).toBe(false);
      expect(m.done).toBe(false);
    });

    it("done=true の場合は即座に true を返す", () => {
      const m = new PlayerMissile(0, 0, 100, 0, 10);
      m.done = true;
      expect(m.update()).toBe(true);
    });

    it("斜め方向にも正しく移動する", () => {
      const m = new PlayerMissile(0, 0, 100, 100, 10);
      m.update();
      // 斜め45度なので vx = vy ≈ 10/√2
      expect(m.x).toBeCloseTo(m.y);
    });
  });
});
