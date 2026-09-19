import assert from 'node:assert/strict';
import { FIXED_DT } from '../../src/core/Time.js';
// An input-only pilot for reachability checks. It knows the solution, so its times
// are NOT estimates of human difficulty, enjoyment or first-play completion time.
export function completeStory(game, { relic = false } = {}) {
  let ticks = 0, jumps = 0;
  const step = (input = {}) => {
    if (++ticks > 100000) throw new Error(`Pilot stalled in ${game.world.levelInfo.id} at ${game.story.puzzle.progress}`);
    if (input.jump) jumps++;
    game.step(FIXED_DT, input);
    assert.ok(Number.isFinite(game.player.x) && Number.isFinite(game.player.y));
  };
  function flyTo(x) {
    let attempts = 0;
    while (game.state === 'running') {
      const p = game.player, delta = x - p.x - p.vx / 14;
      if (Math.abs(p.x - x) < 7 && Math.abs(p.vx) < 22 && p.y < 145) return;
      step({ move: Math.abs(delta) > 3 ? Math.sign(delta) : 0, jump: attempts++ % 24 === 0 });
      if (attempts > 5000) throw new Error(`Cannot reach ${x} in ${game.world.levelInfo.id}`);
    }
  }
  game.start();
  if (relic) {
    const item = game.world.pickups.find(p => p.kind === 'relic');
    flyTo(item.x);
    for (let i = 0; i < 500 && !item.used; i++) step();
    assert.equal(item.used, true, 'optional relic is reachable');
  }
  while (!game.story.gateOpen) {
    const puzzle = game.story.puzzle;
    const instruction = game.story.spec.rules.kind === 'switch' ? { pad: Array.from({ length: puzzle.count }, (_, i) => i + 1).find(p => puzzle.isOn(p)) } : puzzle.steps[puzzle.progress];
    if (instruction.character && instruction.character !== game.activeCharacter) step({ swap: true });
    const pad = game.world.platforms.find(p => p.pad === instruction.pad);
    const landingX = instruction.direction > 0 ? pad.x + 22 : instruction.direction < 0 ? pad.x + pad.w - 22 : pad.x + pad.w / 2;
    flyTo(landingX);
    if (instruction.pulse) {
      // Predict the fixed-step fall, then wait in the air for a visible open window.
      // Only regular move/jump/swap inputs touch the real game state.
      const rules = game.story.spec.rules;
      const fallTime = () => {
        let y = game.player.y, vy = game.player.vy;
        for (let i = 1; i <= 300; i++) {
          vy += 1450 * FIXED_DT; y += vy * FIXED_DT;
          if (y < 94) { y = 94; vy = Math.max(0, vy); }
          if (y + game.player.r >= pad.y) return i * FIXED_DT;
        }
        throw new Error('No finite landing time');
      };
      for (let i = 0; i < 1200; i++) {
        const phase = (game.time + fallTime()) % rules.pulsePeriod;
        if (phase > 0.12 && phase < rules.pulseOpen - 0.12) break;
        step({ jump: i % 24 === 0 });
      }
    }
    let landed = false;
    for (let i = 0; i < 700; i++) {
      const p = game.player;
      const move = p.y + p.r > pad.y - 35 && p.vy > 0 ? instruction.direction || 0 : 0;
      step({ move });
      if (puzzle.contact === pad.pad) { landed = true; break; }
    }
    assert.ok(landed, `landing ${pad.pad} in ${game.story.spec.id}`);
    for (let i = 0; i < 300 && puzzle.pending; i++) step();
  }
  if (game.mode === 'story' && game.story.spec.level === 100 && game.activeCharacter !== 'luma') step({ swap: true });
  flyTo(game.world.length - 10);
  assert.equal(game.state, 'finished', game.world.levelInfo.id);
  assert.equal(game.story.echoFound, true);
  return { level: game.story.spec.level, kind: game.story.spec.rules.kind, ticks, jumps, time: game.time, mistakes: game.story.puzzle.mistakes, hits: game.hits };
}
