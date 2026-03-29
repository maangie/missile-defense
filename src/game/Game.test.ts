import { describe, it, expect, vi, beforeEach } from "vitest";
import { Game } from "./Game";
import { City } from "../entities/City";

vi.mock("../audio/Sound", () => ({
  Sound: class {
    shoot = vi.fn();
    explosion = vi.fn();
    bigExplosion = vi.fn();
    split = vi.fn();
    ctx = { state: "running", resume: vi.fn() };
  }
}));

function createGame(): Game {
  const canvas = {
    width: 0,
    height: 0,
    addEventListener: vi.fn()
  } as unknown as HTMLCanvasElement;
  const ctx = {} as CanvasRenderingContext2D;
  return new Game(canvas, ctx);
}

describe("Game", () => {
  let game: Game;

  beforeEach(() => {
    localStorage.clear();
    game = createGame();
  });

  describe("applyWaveSettings", () => {
    it("ウェーブ1の基本設定", () => {
      game.wave = 1;
      game.applyWaveSettings();
      expect(game.enemiesPerWave).toBe(14); // 10 + 1*4
      expect(game.spawnInterval).toBe(56);  // 60 - 1*4
      expect(game.speedScale).toBeCloseTo(1.08); // 1 + 1*0.08
    });

    it("ウェーブ3（RUSH）では敵数が増え spawn が短くなる", () => {
      game.wave = 3;
      game.applyWaveSettings();
      expect(game.enemiesPerWave).toBe(30); // (10 + 3*4) + 8
      expect(game.spawnInterval).toBe(42);  // max(18, (60 - 3*4) - 6)
    });

    it("ウェーブ4（FAST）では speedScale がさらに増加する", () => {
      game.wave = 4;
      game.applyWaveSettings();
      expect(game.speedScale).toBeCloseTo(1.72); // 1 + 4*0.08 + 0.4
    });

    it("splitChance が上限 0.55 を超えない（通常時）", () => {
      game.wave = 100;
      game.applyWaveSettings();
      expect(game.splitChance).toBeLessThanOrEqual(0.75);
    });
  });

  describe("findNearestAvailableBase", () => {
    it("最も近い基地を返す", () => {
      game.bases = [
        { x: 100, y: 0, ammo: 10, alive: true },
        { x: 500, y: 0, ammo: 10, alive: true },
        { x: 900, y: 0, ammo: 10, alive: true }
      ];
      const base = game.findNearestAvailableBase(480);
      expect(base?.x).toBe(500);
    });

    it("弾切れの基地は返さない", () => {
      game.bases = [
        { x: 100, y: 0, ammo: 0, alive: true },
        { x: 500, y: 0, ammo: 5, alive: true }
      ];
      const base = game.findNearestAvailableBase(100);
      expect(base?.x).toBe(500);
    });

    it("破壊された基地は返さない", () => {
      game.bases = [
        { x: 100, y: 0, ammo: 10, alive: false },
        { x: 500, y: 0, ammo: 10, alive: true }
      ];
      const base = game.findNearestAvailableBase(100);
      expect(base?.x).toBe(500);
    });

    it("利用可能な基地がなければ null を返す", () => {
      game.bases = [
        { x: 100, y: 0, ammo: 0, alive: true },
        { x: 500, y: 0, ammo: 10, alive: false }
      ];
      expect(game.findNearestAvailableBase(300)).toBeNull();
    });
  });

  describe("registerHit", () => {
    it("コンボカウントが増加する", () => {
      game.registerHit();
      expect(game.combo).toBe(1);
    });

    it("comboTimer がリセットされる", () => {
      game.registerHit();
      expect(game.comboTimer).toBe(game.comboWindow);
    });

    it("3連続でコンボ倍率が上がる", () => {
      game.registerHit();
      game.registerHit();
      game.registerHit();
      expect(game.comboMultiplier).toBe(2); // 1 + floor(3/3)
    });
  });

  describe("damageGroundTarget", () => {
    it("範囲内の都市を破壊する", () => {
      game.cities = [new City(100, 100)];
      game.bases = [];
      game.damageGroundTarget(100, 100);
      expect(game.cities[0].alive).toBe(false);
    });

    it("範囲外の都市は破壊しない", () => {
      game.cities = [new City(200, 200)];
      game.bases = [];
      game.damageGroundTarget(100, 100);
      expect(game.cities[0].alive).toBe(true);
    });

    it("範囲内の基地を破壊し弾薬を0にする", () => {
      game.cities = [];
      game.bases = [{ x: 100, y: 100, ammo: 10, alive: true }];
      game.damageGroundTarget(100, 100);
      expect(game.bases[0].alive).toBe(false);
      expect(game.bases[0].ammo).toBe(0);
    });

    it("範囲外の基地は破壊しない", () => {
      game.cities = [];
      game.bases = [{ x: 200, y: 200, ammo: 10, alive: true }];
      game.damageGroundTarget(100, 100);
      expect(game.bases[0].alive).toBe(true);
    });
  });
});
