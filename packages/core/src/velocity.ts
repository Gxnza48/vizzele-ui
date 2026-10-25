import { now } from './env';

/**
 * Estimates velocity (units per second) from recent samples.
 * Only the last `window` ms count, so a pause before release gives ~0 velocity.
 */
export class VelocityTracker {
  private samples: { t: number; v: number }[] = [];
  constructor(private window = 100) {}

  reset() {
    this.samples.length = 0;
  }

  add(value: number, time = now()) {
    this.samples.push({ t: time, v: value });
    const cutoff = time - this.window * 2;
    while (this.samples.length > 2 && this.samples[0]!.t < cutoff) this.samples.shift();
  }

  get(time = now()): number {
    const s = this.samples;
    if (s.length < 2) return 0;
    const last = s[s.length - 1]!;
    if (time - last.t > this.window) return 0;
    let first = last;
    for (let i = s.length - 2; i >= 0; i--) {
      first = s[i]!;
      if (last.t - first.t >= this.window) break;
    }
    const dt = (last.t - first.t) / 1000;
    return dt > 0 ? (last.v - first.v) / dt : 0;
  }
}
