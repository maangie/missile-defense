/** 2次元座標を表すベクトル型 */
export type Vec2 = {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
};

/** ミサイル基地を表す型 */
export type Base = {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
  /** 残弾数 */
  ammo: number;
  /** 生存フラグ */
  alive: boolean;
};

/** 背景の星を表す型 */
export type Star = {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
  /** 半径 */
  r: number;
  /** 透明度 */
  a: number;
};
