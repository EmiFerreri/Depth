import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { FixedClock, FIXED_DT } from '../src/core/Time.js';
import { generateWorld, dailySeed } from '../src/world/LevelGenerator.js';
import { sweptRect, sweptCircle, platformLanding } from '../src/physics/Collision.js';
import { loadProfile, saveRecord } from '../src/core/Storage.js';
import { BALANCE as B } from '../src/config/balance.js';

test('the same seed recreates every world object; a different seed changes the route', () => {
  assert.deepEqual(generateWorld('daily', 'seed'), generateWorld('daily', 'seed'));
  assert.notDeepEqual(generateWorld('daily', 'seed'), generateWorld('daily', 'other'));
});
test('daily seed changes at UTC midnight', () => {
  assert.equal(dailySeed(new Date('2026-09-20T01:00:00+02:00')), 'depth-daily-v2-2026-09-19');
  assert.notEqual(dailySeed(new Date('2026-09-19T23:59:59Z')), dailySeed(new Date('2026-09-20T00:00:00Z')));
});
test('all 100 sectors have a safe checkpoint runway and unique object identifiers', () => {
  const w = generateWorld('campaign'); assert.equal(w.sectors, 100);
  const all = [...w.platforms, ...w.pickups, ...w.enemies, ...w.rails, ...w.hazards];
  assert.equal(new Set(all.map(o => o.id)).size, all.length);
  for (const hazard of w.hazards) assert.ok(hazard.x % B.sectorLength >= 600);
  assert.ok(all.every(o => o.x >= 0 && o.x < w.length));
});
test('120 Hz simulation produces matching states at 30/60/144 display Hz', () => {
  const play = hz => {
    const g = new Game('sprint'), clock = new FixedClock(); g.start();
    for (let i = 0; i < hz * 12; i++) clock.advance(1 / hz, dt => g.step(dt, { move: 1 }));
    return [g.player.x, g.player.y, g.score, g.time, g.player.hp];
  };
  assert.deepEqual(play(30), play(60)); assert.deepEqual(play(60), play(144));
});
test('paused games cannot advance time, score or position', () => {
  const g = new Game(); g.start(); g.step(FIXED_DT, { jump: true }); g.pause();
  const before = [g.player.x, g.player.y, g.score, g.time];
  for (let i = 0; i < 100; i++) g.step(FIXED_DT, { dash: true });
  assert.deepEqual([g.player.x, g.player.y, g.score, g.time], before);
});
test('a long frame is bounded to 12 steps and reset discards paused backlog', () => {
  const clock = new FixedClock(); let steps = 0;
  clock.advance(30, () => steps++); assert.equal(steps, 12);
  clock.reset(); assert.equal(clock.advance(0, () => steps++), 0);
});
test('high-speed sweeps hit a thin hazard and coin between endpoint positions', () => {
  assert.equal(sweptRect(0, 100, 200, 100, 10, { x: 99, y: 80, w: 2, h: 40 }), true);
  assert.equal(sweptCircle(0, 100, 200, 100, 100, 100, 8), true);
  assert.equal(sweptRect(0, 20, 200, 20, 10, { x: 99, y: 80, w: 2, h: 40 }), false);
});
test('platforms land downward sweeps only and respect crossing position', () => {
  const platform = { x: 80, y: 100, w: 40 };
  assert.equal(platformLanding(50, 30, 150, 150, 10, platform), true);
  assert.equal(platformLanding(100, 150, 100, 30, 10, platform), false);
});
test('dash has a cooldown and speed remains bounded', () => {
  const g = new Game(); g.start(); g.step(FIXED_DT, { dash: true });
  const cooldown = g.player.dashCooldown;
  g.step(FIXED_DT, { dash: true }); assert.ok(g.player.dashCooldown < cooldown);
  for (let i = 0; i < 1200; i++) g.step(FIXED_DT, { dash: true, jump: i % 40 === 0, move: 1 });
  assert.ok(Number.isFinite(g.player.x)); assert.ok(Math.abs(g.player.vx) <= B.maxSpeed);
  assert.ok(g.player.y >= g.player.r && g.player.y <= B.floor - g.player.r);
});
test('checkpoints restore player but do not restore collected rewards', () => {
  const g = new Game(); g.start();
  g.player.x = B.sectorLength + 110; g.step(FIXED_DT);
  g.world.pickups[0].used = true;
  g.player.hp = 1; g.player.invulnerable = 0; g.damage();
  assert.equal(g.player.x, g.checkpoint); assert.equal(g.player.hp, 3); assert.equal(g.world.pickups[0].used, true);
});
test('shield absorbs one hit; invulnerability prevents repeated contact damage', () => {
  const g = new Game(); g.player.shield = 1; g.damage(); assert.equal(g.player.hp, 3); assert.equal(g.player.shield, 0);
  g.damage(); assert.equal(g.player.hp, 3);
  g.player.invulnerable = 0; g.damage(); assert.equal(g.player.hp, 2); assert.equal(g.hits, 1);
});
test('standing still produces no score; finishing can only award once', () => {
  const g = new Game('sprint'); g.start();
  for (let i = 0; i < 120; i++) g.step(FIXED_DT, { autoRun: false });
  assert.equal(g.score, 0);
  g.player.x = g.world.length - 10; g.step(FIXED_DT); const score = g.score;
  g.step(FIXED_DT); assert.equal(g.state, 'finished'); assert.equal(g.score, score);
});
test('shooting destroys an enemy in the path and caps live projectiles', () => {
  const g = new Game('sprint'); g.start();
  g.world.enemies = [{ id: 'test', x: 260, y: B.floor - 14, baseY: B.floor - 14, r: 24, alive: true, phase: 0 }];
  for (let i = 0; i < 240; i++) g.step(FIXED_DT, { shoot: true, autoRun: false });
  assert.equal(g.world.enemies[0].alive, false); assert.ok(g.bullets.length < 10);
});
test('storage validates corrupt data and handles disabled storage without crashing', () => {
  assert.deepEqual(loadProfile({ getItem: () => '{bad' }).records, {});
  const storage = { getItem: () => JSON.stringify({ version: 2, records: { bad: { score: -1, time: 10 }, ok: { score: 50, time: 30 } } }), setItem: () => { throw new Error('quota'); } };
  const profile = loadProfile(storage); assert.equal(profile.records.bad, undefined);
  assert.equal(saveRecord(storage, profile, 'ok', 40, 25), false);
  assert.deepEqual(profile.records.ok, { score: 50, time: 25 });
});

test('scripted player completes all four modes without non-finite positions', () => {
  for (const mode of ['flow', 'sprint', 'daily', 'campaign']) {
    const g = new Game(mode, 'qa-fixed'); g.start();
    for (let tick = 0; tick < 150000 && g.state === 'running'; tick++) {
      g.step(FIXED_DT, { move: 1, jump: tick % 110 === 0, dash: tick % 108 === 0, shoot: true });
      assert.ok(Number.isFinite(g.player.x) && Number.isFinite(g.player.y));
    }
    assert.equal(g.state, 'finished', mode);
    assert.ok(g.time > 1 && g.score > 0);
  }
});
