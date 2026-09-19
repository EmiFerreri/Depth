export class SequencePuzzle {
  constructor() {
    this.sequence = Object.freeze([1, 3, 2]);
    this.progress = 0;
    this.solved = false;
    this.contact = null;
    this.mistakes = 0;
  }
  // A pad reacts to a new landing, never to every physics step spent standing on it.
  touch(pad) {
    if (pad === this.contact) return null;
    this.contact = pad;
    if (pad === null || this.solved) return null;
    if (pad !== this.sequence[this.progress]) {
      this.progress = 0; this.mistakes++;
      return 'wrong';
    }
    this.progress++;
    this.solved = this.progress === this.sequence.length;
    return this.solved ? 'solved' : 'correct';
  }
}
