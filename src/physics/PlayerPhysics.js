import { BALANCE as B } from '../config/balance.js';
import { clamp, platformLanding } from './Collision.js';
import { railPoint, advanceRail } from './RailPhysics.js';
export function movePlayer(p, input, world, dt, autoRun = true) {
  const events = [];
  for (const timer of ['invulnerable', 'dashCooldown', 'dashTime', 'fireCooldown', 'detach', 'gravityTime']) p[timer] = Math.max(0, p[timer] - dt);
  if (input.jump) { p.vy = -B.jumpSpeed; p.rail = null; p.detach = 0.2; events.push('jump'); }
  if (input.dash && p.dashCooldown === 0) {
    p.vx = clamp(p.vx + B.dashImpulse * (input.move < 0 ? -1 : 1), -B.maxSpeed, B.maxSpeed);
    p.vy *= 0.35; p.rail = null; p.detach = 0.2; p.dashCooldown = B.dashCooldown; p.dashTime = 0.2; events.push('dash');
  }
  const old = { x: p.x, y: p.y };
  if (p.rail && p.x < p.rail.x + p.rail.w && input.move >= 0) {
    advanceRail(p, p.rail, dt, B.gravity);
    if (p.x >= p.rail.x + p.rail.w) { p.rail = null; p.detach = 0.15; }
  } else {
    p.rail = null;
    const target = input.move > 0 ? B.runSpeed : input.move < 0 ? -B.runSpeed * 0.6 : autoRun ? B.cruiseSpeed : 0;
    if (!p.dashTime) {
      const response = Math.abs(p.vx) > Math.abs(target) && input.move >= 0 ? 0.8 : 4.2;
      p.vx += (target - p.vx) * (1 - Math.exp(-response * dt));
    }
    p.vy += B.gravity * (p.gravityTime ? 0.48 : 1) * (input.down ? 1.8 : 1) * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    for (const platform of world.platforms) {
      if (platformLanding(old.x, old.y, p.x, p.y, p.r, platform)) { p.y = platform.y - p.r; p.vy = 0; }
    }
    if (!p.detach && p.vy >= 0 && p.vx > 0) {
      for (const rail of world.rails) {
        if (p.x < rail.x || p.x > rail.x + rail.w) continue;
        const y = railPoint(rail, p.x), previous = railPoint(rail, old.x);
        if (old.y + p.r <= previous + 12 && p.y + p.r >= y) { p.rail = rail; p.y = y - p.r; events.push('rail'); break; }
      }
    }
  }
  p.x = clamp(p.x, p.r, world.length);
  if (p.y < p.r + 80) { p.y = p.r + 80; p.vy = Math.max(0, p.vy); }
  if (p.y > B.floor - p.r) { p.y = B.floor - p.r; p.vy = 0; }
  p.vx = clamp(p.vx, -B.maxSpeed, B.maxSpeed);
  return { old, events };
}
