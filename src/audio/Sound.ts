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

  noise(duration: number, gain = 0.3): void {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    const g = this.ctx.createGain();

    source.buffer = buffer;
    source.connect(g);
    g.connect(this.ctx.destination);

    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    source.start();
  }

  shoot(): void {
    this.beep(880, 0.08, "square", 0.15);
  }

  explosion(): void {
    this.noise(0.15, 0.4);
  }

  bigExplosion(): void {
    this.noise(0.3, 0.6);
  }

  split(): void {
    this.beep(1200, 0.05, "triangle", 0.12);
  }
}
