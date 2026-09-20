import { BALANCE as B } from '../config/balance.js';
import { Player } from '../entities/Player.js';
import { generateWorld } from '../world/LevelGenerator.js';
import { movePlayer } from '../physics/PlayerPhysics.js';
import { sweptRect, sweptCircle } from '../physics/Collision.js';
import { StoryProgress } from '../story/StoryProgress.js';
import { updateWorld, worldAcceleration, afterWorldMovement, useAbility } from '../mechanics/WorldSystems.js';
import { createLedger, addScore } from './Score.js';
export class Game {
  constructor(mode = 'flow', seed, assist = false, options = {}) {
    this.mode = mode; this.world = generateWorld(mode, seed, options); this.assist = assist;
    this.story = this.world.levelInfo ? new StoryProgress(this.world) : null;
    this.player = new Player(); this.state = 'ready'; this.time = 0;
    this.activeCharacter = 'nox'; this.players = { nox: this.player };
    if (this.story?.allowSwap) this.players.luma = new Player();
    this.score = 0; this.scoreLedger = createLedger(); this.abilityUses = 0; this.combo = 1; this.comboTime = 0; this.bestCombo = 1;
    this.collected = 0; this.hits = 0; this.checkpoint = 100; this.maxX = 100;
    this.sector = 0; this.bullets = []; this.events = []; this.railAwards = new Set();
  }
  start() { this.state = 'running'; }
  pause() { if (this.state === 'running') this.state = 'paused'; }
  resume() { if (this.state === 'paused') this.state = 'running'; }
  emit(type, x = this.player.x, y = this.player.y, text = '') { this.events.push({ type, x, y, text }); }
  reward(points, category = 'pickups') {
    addScore(this, points * this.combo, category); this.combo = Math.min(12, this.combo + 1);
    this.comboTime = 3.4; this.bestCombo = Math.max(this.bestCombo, this.combo);
  }
  damage() {
    const p = this.player;
    if (p.invulnerable || p.dashTime || p.wardTime) return;
    if (p.shield) { p.shield = 0; p.invulnerable = 0.8; this.emit('shield'); return; }
    this.hits++; this.combo = 1; addScore(this, -150, 'penalties');
    p.hp--; p.invulnerable = 1.3; p.vy = -380; p.rail = null; p.detach = 0.2; this.emit('hit');
    if (p.hp <= 0) { p.reset(this.checkpoint); p.invulnerable = 1.5; this.emit('respawn', p.x, p.y, 'Vuelve al ritmo. Checkpoint restaurado.'); }
    if (this.assist) p.hp = 3;
  }
  step(dt, input = {}) {
    this.events = [];
    if (this.state !== 'running') return;
    this.time += dt;
    const controls = { move: 0, jump: false, dash: false, down: false, shoot: false, autoRun: true, ...input };
    if (this.story) { controls.autoRun = false; controls.shoot = false; }
    if (this.story?.allowSwap && controls.swap) {
      this.activeCharacter = this.activeCharacter === 'nox' ? 'luma' : 'nox';
      this.player = this.players[this.activeCharacter];
      this.story.puzzle.touch(null);
      // Returning to a character already resting on a pad is not a fresh landing.
      const support = this.world.platforms.find(p => Math.abs(this.player.y + this.player.r - p.y) < 0.5 && this.player.x + this.player.r > p.x && this.player.x - this.player.r < p.x + p.w);
      this.story.puzzle.contact = support?.pad ?? null;
      this.emit('swap', this.player.x, this.player.y, `Ahora: ${this.activeCharacter === 'luma' ? 'Luma' : 'Nox'}`);
    }
    updateWorld(this.world, this.time, dt);
    if (controls.ability) useAbility(this);
    const nearby = { ...this.world, acceleration: worldAcceleration(this.world, this.player),
      platforms: [...this.world.platforms, ...(this.world.supports || []).filter(s => s.active)].filter(o => Math.abs(o.x - this.player.x) < 1000),
      rails: this.world.rails.filter(o => Math.abs(o.x - this.player.x) < 1000) };
    const { old, events, landing } = movePlayer(this.player, controls, nearby, dt, controls.autoRun);
    for (const event of events) {
      this.emit(event);
      if (event === 'rail' && !this.railAwards.has(this.player.rail.id)) { this.railAwards.add(this.player.rail.id); this.reward(40, 'rails'); }
    }
    const p = this.player;
    if (this.story) this.story.step(this, landing, dt);
    afterWorldMovement(this, old, landing, dt);
    // A respawn is a teleport, not a swept path through intervening pickups.
    if (this.events.some(e => e.type === 'respawn')) { old.x = p.x; old.y = p.y; }
    if (p.x > this.maxX) { addScore(this, (p.x - this.maxX) * 0.05, 'distance'); this.maxX = p.x; }
    this.comboTime = Math.max(0, this.comboTime - dt); if (!this.comboTime) this.combo = 1;
    const sector = Math.min(this.world.sectors - 1, Math.floor(p.x / B.sectorLength));
    if (sector > this.sector) {
      this.sector = sector; this.checkpoint = sector * B.sectorLength + 100; p.hp = Math.min(3, p.hp + 1);
      this.emit('checkpoint', p.x, p.y, `Sector ${String(sector + 1).padStart(2, '0')} · checkpoint`);
    }
    for (const item of this.world.pickups) {
      if (item.used || Math.abs(item.x - p.x) > 100) continue;
      if (!sweptCircle(old.x, old.y, p.x, p.y, item.x, item.y, p.r + item.r)) continue;
      item.used = true;
      const points = this.world.abilitiesEnabled ? ({ fragment: 40, energy: 80, relic: 300 }[item.kind] ?? 150) : item.kind === 'shard' ? 65 : 150;
      this.reward(points, 'pickups'); this.collected++;
      if (item.kind === 'fragment') this.story?.recoverFragment(this, item);
      if (item.kind === 'energy') p.abilityCooldown = Math.max(0, p.abilityCooldown - 3);
      if (item.kind === 'boost') { p.vx = Math.min(B.maxSpeed, p.vx + 340); p.dashTime = 0.22; }
      if (item.kind === 'shield') p.shield = 1;
      if (item.kind === 'gravity') p.gravityTime = 5;
      this.emit(item.kind, item.x, item.y);
    }
    const beforeHazards = p.x;
    for (const hazard of this.world.hazards) {
      if (hazard.active === false || Math.abs(hazard.x - p.x) > 200) continue;
      if (sweptRect(old.x, old.y, p.x, p.y, p.r * 0.8, hazard)) this.damage();
      if (p.x !== beforeHazards) break;
    }
    const activeEnemies = this.world.enemies.filter(e => e.alive && Math.abs(e.x - p.x) < 1200);
    for (const enemy of activeEnemies) {
      enemy.y = enemy.baseY + Math.sin(this.time * 2 + enemy.phase) * 45;
      if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < p.r + enemy.r) {
        if (p.dashTime) { enemy.alive = false; this.reward(220, 'combat'); this.emit('enemy', enemy.x, enemy.y); } else this.damage();
      }
    }
    if (controls.shoot && !p.fireCooldown) {
      const dx = controls.aimX === undefined ? 1 : controls.aimX - p.x, dy = controls.aimY === undefined ? 0 : controls.aimY - p.y;
      const norm = Math.hypot(dx, dy) || 1;
      this.bullets.push({ x: p.x, y: p.y, vx: dx / norm * 1400, vy: dy / norm * 1400, life: 0.9 });
      p.fireCooldown = 0.16; this.emit('shoot');
    }
    for (const bullet of this.bullets) {
      const bx = bullet.x, by = bullet.y;
      bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      for (const enemy of activeEnemies) {
        if (!enemy.alive || bullet.life <= 0) continue;
        if (sweptCircle(bx, by, bullet.x, bullet.y, enemy.x, enemy.y, enemy.r + 3)) {
          bullet.life = 0; enemy.alive = false; this.reward(220, 'combat'); this.emit('enemy', enemy.x, enemy.y);
        }
      }
    }
    this.bullets = this.bullets.filter(b => b.life > 0);
    if (p.x >= this.world.length - 30) {
      if (this.mode === 'story' && this.story.spec.level === 100 && this.activeCharacter !== 'luma') {
        this.story.status = 'Nox sostiene la salida. Cambia a Luma con Q y cruza con ella.';
      } else {
        const bonus = this.world.abilitiesEnabled ? 500 + Math.round(this.story.spec.difficulty * 250) + Math.max(0, (this.story.spec.par - this.time) * 2) : Math.max(0, this.world.sectors * 200 - this.time * 4);
        addScore(this, bonus, 'completion'); this.maxX = this.world.length; this.state = 'finished'; this.emit('finish');
      }
    }
  }
}
