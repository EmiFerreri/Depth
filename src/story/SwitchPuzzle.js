// A triangular Lights Out system: press i flips i and i+1. Every board is solvable.
export class SwitchPuzzle {
  constructor(count, solution) {
    this.count = count; this.sequence = Object.freeze([...solution]); this.mask = 0;
    for (const pad of solution) this.mask ^= this.effect(pad);
    this.contact = null; this.solved = false; this.moves = 0; this.mistakes = 0; this.remaining = 0; this.charge = 0;
  }
  effect(pad) { return (1 << (pad - 1)) | (pad < this.count ? 1 << pad : 0); }
  isOn(pad) { return !!(this.mask & (1 << (pad - 1))); }
  get progress() { return this.count - Array.from({ length: this.count }, (_, i) => Number(this.isOn(i + 1))).reduce((a, b) => a + b, 0); }
  get checkpoint() { return 0; }
  get steps() { return []; }
  touch(pad) {
    if (pad === this.contact) return null;
    this.contact = pad;
    if (pad === null || this.solved || pad < 1 || pad > this.count) return null;
    this.mask ^= this.effect(pad); this.moves++; this.mistakes = Math.max(0, this.moves - this.sequence.length);
    this.solved = this.mask === 0;
    return this.solved ? 'solved' : 'toggle';
  }
  update() { return null; }
}
