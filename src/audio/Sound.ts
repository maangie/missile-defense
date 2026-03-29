/** Web Audio API を使ったゲーム効果音を管理するクラス */
export class Sound {
  /** Web Audio APIのコンテキスト */
  ctx: AudioContext;

  /** AudioContext を初期化する */
  constructor() {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      throw new Error("AudioContext is not supported in this browser.");
    }
    this.ctx = new AudioCtx();
  }

  /**
   * オシレーターを使ったビープ音を再生する
   * @param freq 周波数（Hz）
   * @param duration 再生時間（秒）
   * @param type 波形の種類
   * @param gain 音量（0〜1）
   */
  beep(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.2): void {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    osc.connect(g);
    g.connect(this.ctx.destination);

    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  /**
   * ローパスフィルターで整形したノイズ音を再生する
   * @param duration 再生時間（秒）
   * @param gain 音量（0〜1）
   * @param freqStart フィルターの開始周波数（Hz）
   * @param freqEnd フィルターの終了周波数（Hz）
   */
  private filteredNoise(duration: number, gain: number, freqStart: number, freqEnd: number): void {
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freqStart, t);
    filter.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);
    source.start(t);
  }

  /**
   * 低周波の「ドン」という衝撃音を再生する
   * @param freq 基本周波数（Hz）
   * @param duration 再生時間（秒）
   * @param gain 音量（0〜1）
   */
  private thud(freq: number, duration: number, gain: number): void {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, t + duration);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  /** ミサイル発射音を再生する */
  shoot(): void {
    this.beep(880, 0.08, "square", 0.15);
  }

  /** 敵ミサイル撃墜時の爆発音を再生する */
  explosion(): void {
    this.filteredNoise(0.5, 0.6, 1200, 180);
    this.thud(90, 0.25, 0.4);
  }

  /** 敵ミサイルが地面に着弾したときの大爆発音を再生する */
  bigExplosion(): void {
    this.filteredNoise(1.0, 0.9, 1800, 120);
    this.thud(60, 0.5, 0.7);
    this.thud(120, 0.2, 0.35);
  }

  /** 敵ミサイルの分裂音を再生する */
  split(): void {
    this.beep(1200, 0.05, "triangle", 0.12);
  }
}
