export const PHYSICS_HZ = 120;
export const FIXED_DT = 1 / PHYSICS_HZ;
export class FixedClock {
  accumulator = 0;
  reset() { this.accumulator = 0; }
  advance(seconds, update) {
    this.accumulator += Math.max(0, Math.min(seconds, 0.1));
    let steps = 0;
    while (this.accumulator + 1e-10 >= FIXED_DT && steps < 12) {
      update(FIXED_DT); this.accumulator -= FIXED_DT; steps++;
    }
    this.accumulator = Math.max(0, this.accumulator);
    return steps;
  }
}
