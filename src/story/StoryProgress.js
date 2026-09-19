import { SequencePuzzle } from './SequencePuzzle.js';
import { STORY } from './StoryData.js';
export class StoryProgress {
  constructor() {
    this.puzzle = new SequencePuzzle();
    this.clueFound = false; this.echoFound = false; this.gateHintShown = false;
    this.status = 'Acércate al anillo incompleto. Luma ha dejado una señal.';
  }
  get gateOpen() { return this.puzzle.solved; }
  get journal() {
    const entries = [{ title: 'Antes de entrar', text: STORY.farewell }];
    if (this.clueFound) entries.push({ title: 'La huella · pista', text: STORY.clue });
    if (this.echoFound) entries.push({ title: 'El primer eco', text: STORY.echo });
    return entries;
  }
  step(game, landing) {
    const p = game.player, world = game.world;
    if (!this.clueFound && Math.hypot(p.x - world.clue.x, p.y - world.clue.y) < 100) {
      this.clueFound = true;
      this.status = 'Pista encontrada. Abre ECOS para leer el recuerdo de Luma.';
      game.emit('clue', world.clue.x, world.clue.y, this.status);
    }
    const pad = world.platforms.find(platform => platform.id === landing)?.pad ?? null;
    const result = this.puzzle.touch(pad);
    if (result) {
      game.emit(`pad${pad}`);
      if (result === 'wrong') {
        this.status = 'El recuerdo se rompe. Vuelve a empezar; la pista sigue en ECOS.';
        game.emit('puzzle-wrong', p.x, p.y, this.status);
      } else if (result === 'solved') {
        game.reward(500);
        this.status = 'El recuerdo encaja. Cruza la puerta y alcanza el anillo de Luma.';
        game.emit('puzzle-solved', world.gate.x, 370, this.status);
      } else {
        this.status = `Recuerdo ${this.puzzle.progress} de 3. Continúa la secuencia.`;
        game.emit('memory', p.x, p.y, this.status);
      }
    }
    // The seal spans the entire playable height. Dash and repeated jumps cannot bypass it.
    if (!this.gateOpen && p.x + p.r >= world.gate.x) {
      p.x = world.gate.x - p.r; p.vx = Math.min(0, p.vx);
      if (!this.gateHintShown) {
        this.gateHintShown = true;
        this.status = 'La puerta escucha los recuerdos. Regresa a las tres plataformas.';
        game.emit('gate-locked', p.x, p.y, this.status);
      }
    }
    if (this.gateOpen && !this.echoFound && p.x >= world.echo.x - 55) {
      this.echoFound = true;
      this.status = 'Primer eco recuperado. Puedes leerlo en ECOS. Sigue hasta la salida.';
      game.emit('echo', world.echo.x, world.echo.y, STORY.echo);
    }
  }
}
