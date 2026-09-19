import { BALANCE as B } from '../config/balance.js';
import { Camera } from './Camera.js';
import { railPoint } from '../physics/RailPhysics.js';
import { drawStory } from './StoryRenderer.js';
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
    this.camera = new Camera(); this.particles = []; this.trail = []; this.shake = 0; this.reduced = false;
    this.resize(); addEventListener('resize', () => this.resize());
  }
  resize() {
    this.width = innerWidth; this.height = innerHeight; this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = this.width * this.dpr; this.canvas.height = this.height * this.dpr;
    this.viewWidth = this.width < 700 ? 900 : Math.max(1100, this.width / this.height * 720);
    this.scale = Math.min(this.width / this.viewWidth, this.height / 720);
    this.offsetX = (this.width - this.viewWidth * this.scale) / 2; this.offsetY = (this.height - 720 * this.scale) / 2;
  }
  worldPoint(point) { return { x: (point.x - this.offsetX) / this.scale + this.camera.x, y: (point.y - this.offsetY) / this.scale }; }
  reset() { this.camera.reset(); this.particles = []; this.trail = []; this.shake = 0; }
  effects(events) {
    if (this.reduced) return;
    for (const event of events) {
      if (event.type === 'shoot') continue;
      const color = ['hit', 'enemy'].includes(event.type) ? '#db4a31' : ['boost', 'shield'].includes(event.type) ? '#2eaa88' : '#292a28';
      if (event.type === 'hit') this.shake = 5;
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.particles.push({ x: event.x, y: event.y, vx: Math.cos(angle) * 130, vy: Math.sin(angle) * 130, life: 0.45, color });
      }
    }
    this.particles = this.particles.slice(-180);
  }
  draw(game, dt) {
    const c = this.ctx, p = game.player, world = game.world;
    this.camera.update(p, this.viewWidth, dt);
    const cam = this.camera.x;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.fillStyle = '#f4f3ee'; c.fillRect(0, 0, this.width, this.height);
    c.translate(this.offsetX, this.offsetY); c.scale(this.scale, this.scale);
    if (!this.reduced && game.state === 'running') { this.shake = Math.max(0, this.shake - dt * 22); c.translate(Math.sin(game.time * 90) * this.shake, 0); }
    // Quiet architectural background; all saturation belongs to game mechanics.
    c.strokeStyle = '#e4e3dd'; c.lineWidth = 1;
    for (let x = -(cam * 0.15 % 90); x < this.viewWidth; x += 90) { c.beginPath(); c.moveTo(x, 100); c.lineTo(x, 620); c.stroke(); }
    for (let y = 144; y < 650; y += 90) { c.beginPath(); c.moveTo(0, y); c.lineTo(this.viewWidth, y); c.stroke(); }
    c.fillStyle = '#e6e5df'; c.font = 'bold 240px Arial'; c.textAlign = 'right'; c.fillText(String(game.sector + 1).padStart(2, '0'), this.viewWidth - 45, 545);
    c.textAlign = 'left';
    c.strokeStyle = '#969892'; c.beginPath(); c.moveTo(0, B.floor); c.lineTo(this.viewWidth, B.floor); c.stroke();
    const visible = (x, w = 50) => x + w > cam - 100 && x < cam + this.viewWidth + 100;
    c.save(); c.translate(-cam, 0);
    for (let i = Math.max(0, Math.floor(cam / B.sectorLength)); i <= Math.min(world.sectors, Math.ceil((cam + this.viewWidth) / B.sectorLength)); i++) {
      const x = i * B.sectorLength;
      c.strokeStyle = '#c8cac2'; c.setLineDash([3, 8]); c.beginPath(); c.moveTo(x, 190); c.lineTo(x, B.floor); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#777c73'; c.font = '10px monospace'; c.fillText(i === world.sectors ? 'FINISH' : `CHECKPOINT / ${String(i + 1).padStart(2, '0')}`, x + 10, 211);
    }
    for (const rail of world.rails) {
      if (!visible(rail.x, rail.w)) continue;
      c.beginPath();
      for (let i = 0; i <= 50; i++) { const x = rail.x + rail.w * i / 50, y = railPoint(rail, x); if (!i) c.moveTo(x, y); else c.lineTo(x, y); }
      c.lineWidth = 3; c.strokeStyle = '#2e3330'; c.stroke(); c.lineWidth = 1;
      c.fillStyle = '#868b81'; c.font = '9px monospace'; c.fillText('RIDE THE CURVE', rail.x + rail.w / 2 - 38, rail.y - rail.height + 30);
    }
    for (const platform of world.platforms) {
      if (!visible(platform.x, platform.w)) continue;
      c.fillStyle = '#30342f'; c.fillRect(platform.x, platform.y, platform.w, 4);
      c.fillStyle = '#dedfd7'; c.fillRect(platform.x, platform.y + 8, platform.w, 2);
    }
    if (game.story) drawStory(c, game, this.reduced);
    for (const hazard of world.hazards) {
      if (!visible(hazard.x, hazard.w)) continue;
      c.fillStyle = '#cf4b34';
      for (let x = hazard.x; x < hazard.x + hazard.w; x += 16) { c.beginPath(); c.moveTo(x, B.floor); c.lineTo(x + 8, hazard.y); c.lineTo(x + 16, B.floor); c.fill(); }
    }
    for (const item of world.pickups) {
      if (item.used || !visible(item.x)) continue;
      const pulse = this.reduced ? 0 : Math.sin(game.time * 3 + item.x) * 3;
      c.save(); c.translate(item.x, item.y + pulse);
      if (item.kind === 'shard') {
        const spectrum = ['#be493f','#bc722c','#968619','#42865e','#487cab','#6865a1','#92658f'];
        const color = game.sector < 9 ? '#353a33' : spectrum[(game.sector === 99 ? Math.floor(item.x / 80) : Math.floor((game.sector - 9) / 3)) % spectrum.length];
        c.rotate(Math.PI / 4); c.fillStyle = color; c.fillRect(-5, -5, 10, 10); c.strokeStyle = '#a8ada3'; c.strokeRect(-9, -9, 18, 18);
      } else {
        c.strokeStyle = item.kind === 'gravity' ? '#628bd0' : '#329c7c'; c.lineWidth = 2;
        c.beginPath(); c.arc(0, 0, item.r, 0, Math.PI * 2); c.stroke();
        c.fillStyle = c.strokeStyle; c.font = 'bold 17px monospace'; c.textAlign = 'center'; c.fillText(item.kind === 'boost' ? '»' : item.kind === 'shield' ? '+' : '↑', 0, 5);
      }
      c.restore();
    }
    for (const enemy of world.enemies) {
      if (!enemy.alive || !visible(enemy.x)) continue;
      c.save(); c.translate(enemy.x, enemy.y); c.rotate(Math.PI / 4);
      c.strokeStyle = '#b74733'; c.lineWidth = 2; c.strokeRect(-15, -15, 30, 30); c.fillStyle = '#b74733'; c.fillRect(-4, -4, 8, 8); c.restore();
    }
    c.fillStyle = '#353b32'; for (const b of game.bullets) { c.beginPath(); c.arc(b.x, b.y, 3, 0, Math.PI * 2); c.fill(); }
    if (game.state === 'running') {
      if (!this.reduced) this.trail.push({ x: p.x, y: p.y, life: 0.22 });
      for (const t of this.trail) t.life -= dt;
      this.trail = this.trail.filter(t => t.life > 0).slice(-20);
      for (const particle of this.particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.life -= dt; }
      this.particles = this.particles.filter(t => t.life > 0);
    }
    if (!this.reduced) {
      for (const t of this.trail) { c.globalAlpha = t.life * 0.6; c.beginPath(); c.arc(t.x, t.y, p.r, 0, Math.PI * 2); c.fill(); }
      for (const t of this.particles) { c.globalAlpha = t.life * 2; c.fillStyle = t.color; c.fillRect(t.x, t.y, 3, 3); }
    }
    c.globalAlpha = p.invulnerable && Math.floor(game.time * 12) % 2 ? 0.45 : 1;
    c.fillStyle = '#212820'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#f7f9ec'; c.lineWidth = 1.5; c.beginPath(); c.arc(p.x, p.y, 5, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
    if (p.shield || p.dashTime) { c.strokeStyle = '#329c7c'; c.beginPath(); c.arc(p.x, p.y, p.r + 7, 0, Math.PI * 2); c.stroke(); }
    if (game.time < 6 && game.state === 'running') { c.font = '12px monospace'; c.fillStyle = '#585f51'; c.fillText(game.story ? 'A / D para rodar · ESPACIO para saltar' : 'ESPACIO para saltar · SHIFT para dash', p.x - 90, p.y - 65); }
    c.restore();
  }
}
