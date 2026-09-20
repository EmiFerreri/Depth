import { memoryById } from '../content/Memories.js';
import { SequencePuzzle } from './SequencePuzzle.js';
import { SwitchPuzzle } from './SwitchPuzzle.js';
import { STORY } from './StoryData.js';
import { pulseIsOpen } from './Campaign.js';
export class StoryProgress {
  constructor(world) {
    this.spec = world.levelInfo;
    const rules = this.spec.rules;
    this.puzzle = rules.kind === 'switch' ? new SwitchPuzzle(rules.count, rules.sequence) : new SequencePuzzle(rules.sequence, rules);
    this.memories = []; this.clueFound = false; this.echoFound = false; this.gateHintShown = false;
    this.allowSwap = rules.kind === 'duet' || rules.kind === 'synthesis';
    this.status = 'Acércate al anillo incompleto. Luma ha dejado una señal.';
  }
  get gateOpen() { return this.puzzle.solved; }
  get journal() {
    const entries = [{ title: this.spec.chapterTitle, text: this.spec.level === 1 ? STORY.farewell : this.spec.introduction }];
    if (this.clueFound) entries.push({ title: `${this.spec.title} · pista`, text: this.spec.clue });
    if (this.echoFound) entries.push({ title: 'Eco recuperado', text: this.spec.echo });
    entries.push(...this.memories.map(id => memoryById(id)).filter(Boolean).map(memory => ({ title: memory.title, text: memory.text })));
    return entries;
  }
  recoverFragment(game, item) {
    const memory = memoryById(item.memoryId);
    if (!memory || this.memories.includes(memory.id)) return;
    this.memories.push(memory.id);
    game.emit('fragment-memory', item.x, item.y, `ECO OPCIONAL · ${memory.title}. Léelo en ECOS; completa la cámara para conservarlo.`);
  }
  describeNext() {
    if (this.gateOpen) return 'Puerta abierta. Recoge el eco y alcanza la salida.';
    const rules = this.spec.rules;
    if (rules.kind === 'switch') return 'Apaga todas las luces: cada plataforma cambia la suya y la siguiente.';
    const step = rules.steps[this.puzzle.progress];
    if (!this.clueFound) return 'Busca la pista junto al inicio.';
    // The clue remains a puzzle; only action constraints are shown, not its solved order.
    return [step.character ? `Turno: ${step.character === 'luma' ? 'Luma' : 'Nox'}` : '',
      step.direction ? `Llegada ${step.direction > 0 ? '→' : '←'}` : '',
      step.hold ? `Sostén ${step.hold.toFixed(1)} s` : '', step.pulse ? 'Aterriza en silencio' : ''].filter(Boolean).join(' · ');
  }
  handleResult(game, result, pad) {
    if (!result) return;
    const p = game.player;
    if (pad) game.emit(`pad${Math.abs(pad)}`);
    if (result === 'wrong') {
      this.status = `${this.puzzle.reason} ${this.puzzle.checkpoint ? 'Bloque anterior conservado.' : 'Puedes volver a empezar.'}`;
      game.emit('puzzle-wrong', p.x, p.y, this.status);
    } else if (result === 'solved') {
      game.reward(500 + this.spec.difficulty * 500, 'puzzles');
      this.status = 'El recuerdo encaja. Cruza la puerta y alcanza el anillo de Luma.';
      game.emit('puzzle-solved', game.world.gate.x, 370, this.status);
    } else if (result === 'charging') {
      this.status = 'Sostén la huella. No abandones la plataforma hasta completar su luz.';
    } else if (result === 'toggle') {
      this.status = `${this.puzzle.progress}/${this.spec.rules.count} luces apagadas. Cada paso cambia dos luces.`;
      game.emit('memory');
    } else {
      this.status = `Recuerdo ${this.puzzle.progress} de ${this.puzzle.sequence.length}.${this.puzzle.checkpoint === this.puzzle.progress ? ' Bloque protegido.' : ''}`;
      game.emit('memory', p.x, p.y, this.status);
    }
  }
  step(game, landing, dt = 0) {
    const p = game.player, world = game.world;
    if (!this.clueFound && Math.hypot(p.x - world.clue.x, p.y - world.clue.y) < 100) {
      this.clueFound = true;
      this.status = 'Pista encontrada. Abre ECOS para leer el recuerdo de Luma.';
      game.emit('clue', world.clue.x, world.clue.y, this.status);
    }
    const pad = world.platforms.find(platform => platform.id === landing)?.pad ?? null;
    const context = { character: game.activeCharacter, direction: Math.abs(p.vx) > 1 ? Math.sign(p.vx) : 0,
      pulseOpen: pulseIsOpen(game.time, this.spec.rules) };
    this.handleResult(game, this.puzzle.touch(pad, context), pad);
    this.handleResult(game, this.puzzle.update(dt), null);
    // Full-height seal, enforced before scoring and completion, including airborne dashes.
    if (!this.gateOpen && p.x + p.r >= world.gate.x) {
      p.x = world.gate.x - p.r; p.vx = Math.min(0, p.vx);
      if (!this.gateHintShown) {
        this.gateHintShown = true;
        this.status = 'El sello sigue cerrado. Reconstruye el recuerdo antes de continuar.';
        game.emit('gate-locked', p.x, p.y, this.status);
      }
    }
    if (this.gateOpen && !this.echoFound && p.x >= world.echo.x - 55) {
      this.echoFound = true; this.status = 'Eco recuperado. Sigue hasta la salida para guardar tu avance.';
      game.emit('echo', world.echo.x, world.echo.y, this.spec.echo);
    }
  }
}
