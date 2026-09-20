import { BALANCE as B } from '../config/balance.js';
import { sweptCircle } from '../physics/Collision.js';
export function updateWorld(world, time, dt) {
  for (const hazard of world.hazards) if (hazard.kind === 'pulse-beam') {
    const phase = (time + hazard.phase) % hazard.period;
    hazard.state = phase >= hazard.activeAt ? 'active' : phase >= hazard.warningAt ? 'warning' : 'safe';
    hazard.active = hazard.state === 'active';
  }
  for (const s of world.sentinels || []) { s.oldX = s.x; s.x = s.baseX + Math.sin(time * Math.PI * 2 / s.period + s.phase) * s.range; }
  for (const s of world.supports || []) {
    if (!s.active) { s.downtime = Math.max(0, s.downtime - dt); if (!s.downtime) { s.active = true; s.charge = 0; } }
  }
}
export function worldAcceleration(world, player) {
  return (world.fields || []).reduce((acc, field) => acc + (player.x >= field.x && player.x <= field.x + field.w && player.y >= field.y && player.y <= field.y + field.h ? field.acceleration : 0), 0);
}
export function afterWorldMovement(game, old, landing, dt) {
  const p = game.player, world = game.world;
  for (const s of world.supports || []) {
    if (!s.active) continue;
    if (s.id === landing) {
      s.charge += dt;
      if (s.charge >= s.collapseAfter) { s.active = false; s.downtime = s.recoverAfter; game.emit('crumble', s.x + s.w / 2, s.y, 'El puente cede. Reaparecerá en dos segundos.'); }
    } else s.charge = 0;
  }
  for (const spring of world.springs || []) {
    if (old.y + p.r < B.floor - 0.5 && p.y + p.r >= B.floor - 0.1 && p.x + p.r > spring.x && p.x - p.r < spring.x + spring.w) {
      p.vy = -spring.power; p.rail = null; game.emit('spring', p.x, p.y, 'RESORTE · impulso vertical');
    }
  }
  for (const s of world.sentinels || []) {
    if (sweptCircle(old.x - (s.oldX ?? s.x), old.y - s.y, p.x - s.x, p.y - s.y, 0, 0, p.r + s.r)) game.damage();
  }
}
export function useAbility(game) {
  const p = game.player;
  if (!game.world.abilitiesEnabled || p.abilityCooldown > 0) return false;
  if (game.activeCharacter === 'luma') { p.gravityTime = 2.4; p.wardTime = 0.35; p.abilityCooldown = 8; }
  else { p.vx = 0; p.vy *= 0.5; p.wardTime = 0.65; p.abilityCooldown = 6; }
  game.abilityUses++;
  game.emit('ability', p.x, p.y, game.activeCharacter === 'luma' ? 'VELO · gravedad ligera' : 'ANCLA · freno y protección');
  return true;
}
