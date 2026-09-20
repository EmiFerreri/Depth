import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/Game.js';
import { createLedger, addScore } from '../src/core/Score.js';
import { freshProgress, parseProgress, mergeProgress, completeLevel } from '../src/core/Progress.js';
import { recordAttempt, normalizeHistory, earnedRewards } from '../src/core/History.js';
import { updateWorld, worldAcceleration, afterWorldMovement, useAbility } from '../src/mechanics/WorldSystems.js';
import { WORLDS, getCatalog } from '../src/content/Catalog.js';
import { generateLevel, validateWorld } from '../src/generation/Generator.js';
import { completeStory } from './helpers/story-player.js';
const dt = 1 / 120;
const make = (level = 1) => { const game = new Game('story', undefined, false, { level }); game.start(); return game; };
test('catalog covers 100 unique chambers, ten chapters and five playable world choices', () => {
  const catalog = getCatalog(); assert.equal(catalog.levels.length, 100); assert.equal(catalog.chapters.length, 10);
  assert.equal(new Set(catalog.levels.map(l => l.id)).size, 100);
  for (const world of WORLDS) {
    assert.equal(catalog.levels.filter(l => l.worldId === world.id).length, 20);
    for (const level of [1,2]) {
      const game = new Game('expedition', 'MUNDOS', false, { level, intensity: 5, length: 12, worldId: world.id });
      assert.equal(game.world.biome.id, world.id); assert.ok(world.chapters.includes(game.story.spec.chapter));
      completeStory(game, { relic: true });
    }
  }
});
test('all story chambers and 250 world/intensity/depth samples satisfy generation bounds', () => {
  for (const version of [4,5]) for (let level = 1; level <= 100; level++) assert.equal(generateLevel({ mode: 'story', level, generatorVersion: version }).validation.valid, true);
  for (const world of WORLDS) for (let intensity = 1; intensity <= 5; intensity++) for (const level of [1,2,9,10,11,36,100,999,99999,100000]) {
    const request = { worldId: world.id, intensity, level, length: 0, seed: `W-${level}` };
    const a = generateLevel(request); assert.deepEqual(a, generateLevel(request));
    assert.deepEqual(a.world, new Game('expedition', a.parameters.seed, false, a.parameters).world);
    assert.equal(a.validation.reachability, 'not-run');
  }
});
test('pulse beams warn, damage only when active and freeze while paused', () => {
  const game = make(21), beam = game.world.hazards.find(h => h.kind === 'pulse-beam');
  for (const [time,state] of [[0,'safe'],[2.2,'warning'],[3,'active'],[4.3,'safe']]) { updateWorld(game.world,time,dt); assert.equal(beam.state,state); }
  game.time = 1; game.player.x = beam.x + beam.w/2; game.step(dt); assert.equal(game.hits,0);
  game.time = 3; game.step(dt); assert.equal(game.hits,1);
  game.pause(); const before = JSON.stringify(game.world); game.step(3,{ability:true}); assert.equal(JSON.stringify(game.world), before); assert.equal(game.abilityUses,0);
});
test('crumbling bridges collapse under residence, recover and do not trigger puzzle pads', () => {
  const game = make(41), bridge = game.world.supports[0];
  game.player.x = bridge.x + bridge.w/2; game.player.y = bridge.y - game.player.r;
  for (let i=0;i<85;i++) game.step(dt);
  assert.equal(bridge.active,false); assert.equal(game.story.puzzle.progress,0); assert.equal(game.story.puzzle.mistakes,0);
  for (let i=0;i<245;i++) game.step(dt);
  assert.equal(bridge.active,true); assert.equal(bridge.charge,0);
});
test('springs fire on downward landing; currents reduce acceleration inside their bounds', () => {
  const game = make(2), spring = game.world.springs[0];
  game.player.x = spring.x + spring.w/2; game.player.y = 577; game.player.vy = 500;
  game.step(dt); assert.equal(game.player.vy, -spring.power); assert.ok(game.events.some(e => e.type === 'spring'));
  const archive = make(41), field = archive.world.fields[0];
  assert.equal(worldAcceleration(archive.world,{x:field.x + 5,y:field.y+5}),-780);
  assert.equal(worldAcceleration(archive.world,{x:field.x-5,y:field.y+5}),0);
});
test('sentinels use swept relative motion instead of endpoint-only contact', () => {
  const game = make(61), s = game.world.sentinels[0];
  game.player.x = s.baseX; game.player.y = s.y; s.oldX = s.baseX-100; s.x = s.baseX+100;
  afterWorldMovement(game,{x:game.player.x,y:game.player.y},null,dt); assert.equal(game.hits,1);
});
test('abilities have independent cooldowns, protect from damage and never bypass seals', () => {
  const game = make(61); game.player.vx=200;
  assert.equal(useAbility(game),true); assert.equal(game.player.vx,0); game.damage(); assert.equal(game.hits,0);
  assert.equal(useAbility(game),false); assert.equal(game.abilityUses,1);
  game.step(dt,{swap:true,ability:true}); assert.equal(game.activeCharacter,'luma'); assert.ok(game.player.gravityTime>2);
  assert.equal(game.abilityUses,2); assert.ok(game.players.nox.abilityCooldown>5);
  game.player.x=game.world.gate.x-15; game.player.vx=1100; game.step(dt,{dash:true,move:1});
  assert.ok(game.player.x+game.player.r<=game.world.gate.x); assert.equal(game.story.gateOpen,false);
  game.player.reset(); assert.equal(game.player.wardTime,0); assert.equal(game.player.abilityCooldown,0);
  const old = new Game('story',undefined,false,{generatorVersion:4}); assert.equal(useAbility(old),false);
});
test('energy reduces cooldown once; score ledger exactly reconciles rewards and penalties', () => {
  const game=make(2), item=game.world.pickups.find(p=>p.kind==='energy');
  game.player.abilityCooldown=6; game.player.x=item.x;game.player.y=item.y;
  game.step(dt); assert.equal(item.used,true); assert.ok(game.player.abilityCooldown<3); const score=game.scoreLedger.pickups;
  game.step(dt); assert.equal(game.scoreLedger.pickups,score); game.damage();
  assert.ok(Math.abs(Object.values(game.scoreLedger).reduce((a,b)=>a+b,0)-game.score)<1e-8);
  const empty={score:0,scoreLedger:createLedger()}; addScore(empty,-150,'penalties'); assert.equal(empty.scoreLedger.penalties,0);
  const finished=make();completeStory(finished,{relic:true}); const end=finished.score;
  assert.ok(finished.scoreLedger.puzzles>0 && finished.scoreLedger.completion>0);finished.step(dt);assert.equal(finished.score,end);
  assert.ok(Math.abs(Object.values(finished.scoreLedger).reduce((a,b)=>a+b,0)-end)<1e-8);
});
test('attempt history is idempotent, bounded, validated and merged without losing achievements', () => {
  const progress=freshProgress(), game=make();assert.equal(recordAttempt(progress,game,'abandoned'),null);
  game.step(dt);const row=recordAttempt(progress,game,'restarted',new Date('2026-09-20T10:00:00Z'),'attempt-0');assert.ok(row);
  assert.equal(recordAttempt(progress,game,'abandoned'),null);assert.equal(progress.history.length,1);
  const rows=Array.from({length:240},(_,i)=>({...row,id:`attempt-${i}`,at:new Date(Date.UTC(2026,8,20,10,0,i)).toISOString()}));
  const normalized=normalizeHistory(rows);assert.equal(normalized.length,200);assert.equal(normalized[0].id,'attempt-40');
  assert.equal(normalizeHistory([row,row,{...row,id:'bad',score:Infinity},{...row,id:'bad2',time:-1}]).length,1);
  const imported=parseProgress({...freshProgress(),history:normalized});const merged=mergeProgress(progress,imported);
  assert.equal(merged.history.length,200);assert.deepEqual(parseProgress(JSON.stringify(merged)),merged);
  assert.equal(normalizeHistory(null).length,0);
});
test('history records individual stars and badges require all twenty world chambers', () => {
  const progress=freshProgress(), game=make();completeStory(game,{relic:true});
  recordAttempt(progress,game,'completed');assert.equal(progress.history[0].stars,3);assert.equal(progress.history[0].generatorVersion,5);
  for(let level=1;level<20;level++) progress.records[level]={completed:true,clean:false,relic:false,bestTime:100};
  assert.equal(earnedRewards(progress)[0].earned,false);progress.records[20]={completed:true,bestTime:100};
  assert.equal(earnedRewards(progress)[0].earned,true);assert.equal(earnedRewards(progress)[1].earned,false);
});
test('legacy expedition saves resume v4; v5 preserves selected world and route identity', () => {
  const saved={...freshProgress(),expedition:{seed:'STILL',level:9,intensity:4,length:12}};
  assert.equal(parseProgress(saved).expedition.generatorVersion,4);
  saved.expedition.generatorVersion=5;saved.expedition.worldId='archives';assert.equal(parseProgress(saved).expedition.worldId,'archives');
  saved.expedition.worldId='invalid';assert.equal(parseProgress(saved).expedition.worldId,null);
});
test('structural validation rejects missing pads, duplicate IDs, invalid gates and oversized worlds', () => {
  for(const mutate of [w=>w.platforms.pop(), w=>w.pickups[0].id=w.platforms[0].id, w=>w.gate.h=20,w=>w.length=1e9,w=>w.levelInfo.rules.steps=[null],w=>w.fields=[null]]) {
    const world=generateLevel({mode:'story'}).world;mutate(world);assert.equal(validateWorld(world).valid,false);
  }
  for(const input of [null,[],{}, {platforms:'bad',levelInfo:{rules:{sequence:'bad',steps:[]}}}]) assert.equal(validateWorld(input).valid,false);
});

test('optional memories require collection and completion, then survive backup merging', () => {
  const game=make(2), progress=freshProgress(), item=game.world.pickups.find(p=>p.kind==='fragment');
  game.player.x=item.x; game.player.y=item.y; game.step(dt);
  assert.equal(item.used,true);assert.equal(game.story.memories.length,1);assert.ok(game.story.journal.some(entry=>entry.title==='La mesa torcida'));
  assert.equal(completeLevel(progress,game),null);assert.equal(progress.memories.length,0);
  completeStory(game);completeLevel(progress,game);assert.ok(progress.memories.includes(item.memoryId));
  const other={...freshProgress(),memories:['core-3','fake',item.memoryId]};
  const merged=mergeProgress(progress,other);assert.deepEqual(new Set(merged.memories),new Set([item.memoryId,'core-3']));
  const all=new Set();for (const world of WORLDS) for(const level of [1,2]) {
    const generated=generateLevel({worldId:world.id,level}).world;
    for(const fragment of generated.pickups.filter(p=>p.kind==='fragment'))all.add(fragment.memoryId);
  }
  assert.equal(all.size,20,'all optional memories are available without high difficulty');
});
