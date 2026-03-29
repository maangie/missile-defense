export class Sound {
  ctx: AudioContext;

  constructor() {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      throw new Error("AudioContext is not supported in this browser.");
    }
    this.ctx = new AudioCtx();
  }

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

  shoot(): void {
    this.beep(880, 0.08, "square", 0.15);
  }

  explosion(): void {
    this.filteredNoise(0.5, 0.6, 1200, 180);
    this.thud(90, 0.25, 0.4);
  }

  bigExplosion(): void {
    this.filteredNoise(1.0, 0.9, 1800, 120);
    this.thud(60, 0.5, 0.7);
    this.thud(120, 0.2, 0.35);
  }

  split(): void {
    this.beep(1200, 0.05, "triangle", 0.12);
  }
}
