export class SequencePuzzle {
  constructor(sequence = [1, 3, 2], rules = {}) {
    this.sequence = Object.freeze([...sequence]);
    this.steps = rules.steps || sequence.map(pad => ({ pad }));
    this.checkpointEvery = rules.checkpointEvery || 0;
    this.memorySeconds = rules.memorySeconds || 0;
    this.progress = 0; this.solved = false; this.contact = null; this.mistakes = 0;
    this.charge = 0; this.pending = false; this.remaining = 0; this.reason = '';
  }
  get checkpoint() { return this.checkpointEvery ? Math.floor(this.progress / this.checkpointEvery) * this.checkpointEvery : 0; }
  fail(reason) {
    this.progress = this.checkpoint; this.mistakes++; this.pending = false; this.charge = 0; this.remaining = 0; this.reason = reason;
    return 'wrong';
  }
  accept() {
    this.progress++; this.pending = false; this.charge = 0;
    this.solved = this.progress === this.sequence.length;
    this.remaining = this.solved || this.progress === this.checkpoint ? 0 : this.memorySeconds;
    return this.solved ? 'solved' : 'correct';
  }
  touch(pad, context = {}) {
    if (pad === this.contact) return null;
    this.contact = pad; this.pending = false; this.charge = 0;
    if (pad === null || this.solved) return null;
    const step = this.steps[this.progress];
    if (pad !== step.pad) return this.fail('Esa huella no sigue el orden del recuerdo.');
    if (step.character && context.character !== step.character) return this.fail(`Esta huella pertenece a ${step.character === 'luma' ? 'Luma' : 'Nox'}. Cambia con Q.`);
    if (step.direction && context.direction !== step.direction) return this.fail(`Llega moviéndote hacia ${step.direction > 0 ? 'la derecha →' : 'la izquierda ←'}.`);
    if (step.pulse && !context.pulseOpen) return this.fail('La melodía seguía activa. Aterriza durante el silencio.');
    if (step.hold) { this.pending = true; return 'charging'; }
    return this.accept();
  }
  update(dt) {
    if (this.solved) return null;
    if (this.pending) {
      this.charge += dt;
      if (this.charge + 1e-9 >= this.steps[this.progress].hold) return this.accept();
    }
    if (this.remaining > 0) {
      this.remaining = Math.max(0, this.remaining - dt);
      if (!this.remaining) return this.fail('El recuerdo se disipó. Tu último bloque completo sigue protegido.');
    }
    return null;
  }
}
