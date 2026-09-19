import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { FIXED_DT } from '../src/core/Time.js';
import { SequencePuzzle } from '../src/story/SequencePuzzle.js';
import { STORY, STORY_CHAPTERS } from '../src/story/StoryData.js';
import { BALANCE as B } from '../src/config/balance.js';

const tick = (game, input = {}) => game.step(FIXED_DT, input);
function rollTo(game, x) {
  let count = 0;
  while (Math.abs(game.player.x - x) > 8 && count++ < 1800) tick(game, { move: Math.sign(x - game.player.x) });
  assert.ok(count < 1800, `could not reach ${x}`);
  for (let i = 0; i < 90; i++) tick(game);
}
function landOn(game, pad) {
  const platform = game.world.platforms.find(p => p.pad === pad);
  rollTo(game, platform.x + platform.w / 2);
  tick(game, { jump: true });
  for (let i = 0; i < 120; i++) tick(game);
  assert.equal(game.story.puzzle.contact, pad);
}

test('sequence accepts distinct landings 1, 3, 2 and only solves once', () => {
  const puzzle = new SequencePuzzle();
  assert.equal(puzzle.touch(1), 'correct');
  for (let i = 0; i < 500; i++) assert.equal(puzzle.touch(1), null);
  assert.equal(puzzle.progress, 1);
  puzzle.touch(null); assert.equal(puzzle.touch(3), 'correct');
  puzzle.touch(null); assert.equal(puzzle.touch(2), 'solved');
  assert.equal(puzzle.solved, true);
  puzzle.touch(null); assert.equal(puzzle.touch(1), null);
  assert.equal(puzzle.progress, 3);
});
test('a wrong landing clears the sequence and can be retried without restarting', () => {
  const puzzle = new SequencePuzzle();
  puzzle.touch(1); puzzle.touch(null);
  assert.equal(puzzle.touch(2), 'wrong'); assert.equal(puzzle.progress, 0);
  assert.equal(puzzle.mistakes, 1); assert.equal(puzzle.solved, false);
  for (const pad of [1, 3, 2]) { puzzle.touch(null); puzzle.touch(pad); }
  assert.equal(puzzle.solved, true);
});
test('story waits for movement even when auto-run and shooting are requested', () => {
  const game = new Game('story'); game.start();
  for (let i = 0; i < 240; i++) tick(game, { autoRun: true, shoot: true });
  assert.equal(game.player.x, 100); assert.equal(game.score, 0); assert.equal(game.bullets.length, 0);
  assert.equal(game.story.clueFound, false);
  assert.equal(STORY_CHAPTERS.length, 10);
});
test('the gate blocks high-speed dashes at every playable height and cannot finish a locked level', () => {
  for (const y of [94, 210, 486, B.floor - B.radius]) {
    const game = new Game('story'); game.start();
    game.player.x = game.world.gate.x - B.radius - 2; game.player.y = y; game.player.vx = B.maxSpeed;
    tick(game, { dash: true, move: 1 });
    assert.equal(game.player.x, game.world.gate.x - B.radius);
    assert.equal(game.player.vx, 0); assert.equal(game.state, 'running');
    assert.ok(game.maxX < game.world.gate.x);
    game.player.x = game.world.length; tick(game);
    assert.equal(game.state, 'running'); assert.equal(game.story.echoFound, false);
  }
});
test('a control-driven player discovers the clue, makes a mistake, solves the puzzle and reaches the echo and exit', () => {
  const game = new Game('story'); game.start();
  landOn(game, 1);
  assert.equal(game.story.clueFound, true);
  assert.equal(game.story.journal[1].text, STORY.clue);
  assert.equal(game.story.puzzle.progress, 1);
  landOn(game, 2); assert.equal(game.story.puzzle.progress, 0);
  assert.equal(game.player.hp, 3);
  assert.equal(game.story.journal[1].text, STORY.clue);
  landOn(game, 1); landOn(game, 3); landOn(game, 2);
  assert.equal(game.story.gateOpen, true);
  assert.equal(game.story.echoFound, false);
  for (let i = 0; i < 1200 && game.state === 'running'; i++) tick(game, { move: 1 });
  assert.equal(game.state, 'finished');
  assert.equal(game.story.echoFound, true);
  assert.equal(game.story.journal.at(-1).text, STORY.echo);
  assert.equal(game.hits, 0);
  const score = game.score; tick(game, { move: 1 }); assert.equal(game.score, score);
});
test('standing on a pad and jumping on an already solved puzzle cannot farm rewards', () => {
  const game = new Game('story'); game.start();
  for (const pad of [1, 3, 2]) landOn(game, pad);
  const score = game.score;
  for (let i = 0; i < 1800; i++) tick(game, { jump: i % 150 === 0 });
  assert.equal(game.score, score); assert.equal(game.story.puzzle.progress, 3);
});
test('pause freezes story discovery; a fresh run resets puzzle, clues, echo and gate', () => {
  const game = new Game('story'); game.start(); landOn(game, 1);
  const before = JSON.stringify(game.story); const time = game.time;
  game.pause();
  for (let i = 0; i < 300; i++) tick(game, { move: 1, jump: true });
  assert.equal(JSON.stringify(game.story), before); assert.equal(game.time, time);
  game.resume(); landOn(game, 3); landOn(game, 2);
  assert.equal(game.story.gateOpen, true);
  const restart = new Game('story');
  assert.equal(restart.story.puzzle.progress, 0); assert.equal(restart.story.gateOpen, false);
  assert.equal(restart.story.clueFound, false); assert.equal(restart.story.echoFound, false);
  assert.equal(restart.story.journal.length, 1); assert.equal(restart.state, 'ready');
});
