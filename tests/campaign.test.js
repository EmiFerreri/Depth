import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { getLevelSpec, challengeSeed, nextLevel, normalizeSeed } from '../src/story/Campaign.js';
import { SequencePuzzle } from '../src/story/SequencePuzzle.js';
import { SwitchPuzzle } from '../src/story/SwitchPuzzle.js';
import { freshProgress, parseProgress, saveProgress, loadProgress, completeLevel, mergeProgress, stars } from '../src/core/Progress.js';
import { completeStory } from './helpers/story-player.js';

test('100 campaign chambers introduce ten rules, bounded difficulty and reachable geometry', () => {
  const kinds = new Set();
  for (let level = 1; level <= 100; level++) {
    const game = new Game('story', undefined, false, { level }), spec = game.story.spec;
    kinds.add(spec.rules.kind);
    assert.ok(spec.difficulty >= 0 && spec.difficulty <= 1);
    assert.ok(spec.rules.sequence.length >= 2 && spec.rules.sequence.length <= 8);
    assert.ok(game.world.platforms.every(p => p.w >= 94 && p.y >= 370 && p.x > 400 && p.x + p.w < game.world.gate.x));
    assert.ok(game.world.hazards.every(p => p.x > 600));
    assert.ok(spec.clue && spec.help && spec.echo && spec.title);
  }
  assert.equal(kinds.size, 10);
  assert.equal(nextLevel(getLevelSpec('story', { level: 100 })), null);
});
test('input-only pilot completes every campaign chamber including Luma at the final exit', () => {
  for (let level = 1; level <= 100; level++) {
    const game = new Game('story', undefined, false, { level });
    completeStory(game, { relic: [1, 10, 50, 100].includes(level) });
    if (level === 100) assert.equal(game.activeCharacter, 'luma');
  }
});
test('expeditions are reproducible, date-pinned and bounded even at extreme depths', () => {
  assert.deepEqual(getLevelSpec('story', { level: 40 }), getLevelSpec('story', { level: 40, intensity: 5, seed: 'IGNORED', length: 36 }));
  const options = { level: 19, intensity: 5, length: 36 };
  assert.deepEqual(new Game('expedition', 'PRUEBA', false, options).world, new Game('expedition', 'PRUEBA', false, options).world);
  assert.notDeepEqual(new Game('expedition', 'PRUEBA', false, options).world, new Game('expedition', 'OTRA', false, options).world);
  assert.equal(challengeSeed('daily', new Date('2026-09-20T01:00:00+02:00')), 'DIA-2026-09-19');
  assert.equal(challengeSeed('weekly', new Date('2026-09-20T23:00:00Z')), 'SEMANA-2026-09-14');
  assert.equal(challengeSeed('weekly', new Date('2026-09-21T00:00:00Z')), 'SEMANA-2026-09-21');
  assert.equal(normalizeSeed('<script> scary / key'), 'SCRIPTSCARYKEY');
  for (let level = 1; level < 100000; level += 379) {
    const game = new Game('expedition', 'ABISMO', false, { level, intensity: 5, length: 0 });
    assert.ok(game.world.platforms.length <= 8); assert.ok(game.world.pickups.length <= 6);
    assert.ok(game.story.spec.rules.pulseOpen >= 1.6); assert.ok(game.world.motion.speed <= 320);
  }
});
test('input-only pilot completes a demanding 36-room expedition with every rule', () => {
  const kinds = new Set();
  for (let level = 1; level <= 36; level++) {
    const game = new Game('expedition', 'VALIDACION', false, { level, intensity: 5, length: 36 });
    kinds.add(game.story.spec.rules.kind); completeStory(game);
  }
  assert.equal(kinds.size, 10);
});
test('direction, character, hold and rhythm enforce their own conditions', () => {
  const make = step => new SequencePuzzle([1], { steps: [{ pad: 1, ...step }] });
  const direction = make({ direction: -1 }); assert.equal(direction.touch(1, { direction: 1 }), 'wrong');
  direction.touch(null); assert.equal(direction.touch(1, { direction: -1 }), 'solved');
  const duet = make({ character: 'luma' }); assert.equal(duet.touch(1, { character: 'nox' }), 'wrong');
  duet.touch(null); assert.equal(duet.touch(1, { character: 'luma' }), 'solved');
  const hold = make({ hold: 2 }); assert.equal(hold.touch(1), 'charging'); hold.update(1); hold.touch(null);
  assert.equal(hold.charge, 0); hold.touch(1); hold.update(1.9); assert.equal(hold.solved, false); assert.equal(hold.update(0.1), 'solved');
  const rhythm = make({ pulse: true }); assert.equal(rhythm.touch(1, { pulseOpen: false }), 'wrong');
  rhythm.touch(null); assert.equal(rhythm.touch(1, { pulseOpen: true }), 'solved');
});
test('advanced memory deadlines preserve complete blocks and cannot progress while paused', () => {
  const puzzle = new SequencePuzzle([1, 2, 3, 1, 2, 3], { checkpointEvery: 3, memorySeconds: 10 });
  for (const pad of [1, 2, 3, 1]) { puzzle.touch(null); puzzle.touch(pad); }
  assert.equal(puzzle.progress, 4); puzzle.update(10); assert.equal(puzzle.progress, 3);
  assert.equal(puzzle.mistakes, 1); puzzle.update(100); assert.equal(puzzle.mistakes, 1);
  const game = new Game('expedition', 'VALIDACION', false, { level: 2, intensity: 5, length: 36 }); game.start();
  const first = game.story.puzzle.steps[0];
  game.story.puzzle.touch(first.pad, { character: first.character, direction: first.direction, pulseOpen: true });
  assert.ok(game.story.puzzle.remaining > 0); game.pause();
  const before = JSON.stringify(game.story); game.step(60, { swap: true, jump: true });
  assert.equal(JSON.stringify(game.story), before); assert.equal(game.activeCharacter, 'nox');
});
test('returning to a character on a pad preserves contact instead of introducing a false mistake', () => {
  const game = new Game('story', undefined, false, { level: 61 }); game.start();
  const target = game.world.platforms.find(p => p.pad === game.story.puzzle.sequence[0]);
  game.player.x = target.x + target.w / 2; game.player.y = target.y - game.player.r;
  game.step(1 / 120); assert.equal(game.story.puzzle.progress, 1);
  game.step(1 / 120, { swap: true }); game.step(1 / 120, { swap: true });
  assert.equal(game.activeCharacter, 'nox'); assert.equal(game.story.puzzle.progress, 1);
  assert.equal(game.story.puzzle.mistakes, 0);
});
test('all possible switch boards have a finite solution, with no contact spam', () => {
  for (let count = 3; count <= 5; count++) for (let initial = 1; initial < 1 << count; initial++) {
    const puzzle = new SwitchPuzzle(count, [1]); puzzle.mask = initial;
    let moves = 0;
    for (let pad = 1; pad <= count; pad++) if (puzzle.isOn(pad)) {
      puzzle.touch(null); puzzle.touch(pad); const mask = puzzle.mask;
      puzzle.touch(pad); assert.equal(puzzle.mask, mask); moves++;
    }
    assert.equal(puzzle.solved, true); assert.ok(moves <= count);
  }
});
test('progress persists unlocks and independent stars, merges backups and rejects malformed data', () => {
  const progress = freshProgress(), game = new Game('story'); completeStory(game, { relic: true });
  const result = completeLevel(progress, game); assert.equal(result.relic, true); assert.equal(progress.unlocked, 2);
  assert.equal(stars(progress.records[1]), 3);
  let raw; const storage = { setItem: (key, value) => { raw = value; }, getItem: () => raw };
  assert.equal(saveProgress(storage, progress), true); assert.deepEqual(loadProgress(storage), progress);
  const imported = { version: 1, selected: 99, records: { 1: { completed: true, clean: false, relic: false, bestTime: 200 } }, expedition: { seed: 'KEEP', level: 8, intensity: 2, length: 12 } };
  const merged = mergeProgress(progress, imported); assert.equal(stars(merged.records[1]), 3); assert.equal(merged.selected, 2);
  assert.equal(merged.expedition.seed, 'KEEP');
  assert.throws(() => parseProgress({ version: 1, records: [] }));
  assert.throws(() => parseProgress('{bad'));
  assert.equal(parseProgress({ version: 1, records: { 100: { completed: true, bestTime: -1 } } }).unlocked, 1);
  assert.equal(saveProgress({ setItem() { throw new Error('quota'); } }, progress), false);
  assert.equal(completeLevel(progress, new Game('story')), null);
});
test('legacy first-level records migrate without inventing precision or relic medals', () => {
  const progress = loadProgress({ getItem: () => null }, { records: { 'story:depth-la-huella-v1:standard:manual': { time: 50, score: 800 } } });
  assert.equal(progress.unlocked, 2); assert.equal(stars(progress.records[1]), 1);
});
