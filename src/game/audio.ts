/** Tiny synthesized dish sounds. Unlocked from the first pointer or key. */
export class DishAudio {
  private ctx: AudioContext | null = null;
  muted = false;
  private voices = 0;
  private lastCrumb = 0;

  unlock(): void {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  resume(): void {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  crumb(): void {
    const now = performance.now();
    if (now - this.lastCrumb < 45) return;
    this.lastCrumb = now;
    this.tone(680 + Math.random() * 220, 0.045, "sine", 0.045);
  }

  bite(): void {
    this.tone(180 + Math.random() * 30, 0.12, "triangle", 0.08);
    this.tone(440 + Math.random() * 40, 0.08, "sine", 0.04);
  }

  split(): void {
    this.tone(240, 0.09, "sawtooth", 0.03);
  }

  pop(): void {
    this.tone(90, 0.16, "square", 0.04);
  }

  wipe(): void {
    this.tone(280, 0.18, "sine", 0.06);
    this.tone(120, 0.22, "triangle", 0.05);
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number): void {
    if (this.muted || !this.ctx || this.voices > 10) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    this.voices += 1;
    osc.onended = () => {
      this.voices = Math.max(0, this.voices - 1);
      osc.disconnect();
      amp.disconnect();
    };
  }
}
