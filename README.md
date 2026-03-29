# Missile Defense

ブラウザで遊べる、トラックボール風の慣性カーソルを備えたミサイル迎撃ゲームです。  
敵ミサイルを爆風で撃ち落とし、都市と発射基地を守ります。

## 特徴

- 3つの発射基地
- 慣性つきカーソル
- 空中分裂する敵ミサイル
- 爆発リング、火の粉パーティクル、煙の尾
- 画面フラッシュ、画面シェイク
- コンボ倍率
- スコアポップアップ
- タイトル画面とゲームオーバー画面
- ハイスコア保存（localStorage）

## セットアップ

```bash
npm install
npm run dev
```

ビルド:

```bash
npm run build
```

プレビュー:

```bash
npm run preview
```

## 操作

- マウス移動: 照準移動
- クリック: ミサイル発射
- タイトル画面 / ゲームオーバー画面: クリックで開始・再開

## ディレクトリ構成

```text
src/
├─ main.ts
├─ audio/
│  └─ Sound.ts
├─ entities/
│  ├─ City.ts
│  ├─ EnemyMissile.ts
│  ├─ Explosion.ts
│  ├─ Particle.ts
│  ├─ PlayerMissile.ts
│  └─ ScorePopup.ts
├─ game/
│  └─ Game.ts
└─ types/
   └─ common.ts
```

## 調整しやすい項目

`src/game/Game.ts` 内で主に次を調整できます。

- 難易度: `applyWaveSettings()`
- 慣性カーソル: `cursorSensitivity`, `cursorFriction`, `cursorMaxSpeed`
- コンボ: `comboWindow`
- シェイク強度: `triggerShake()`
- フラッシュ強度: `triggerFlash()`

## ライセンス

MIT
