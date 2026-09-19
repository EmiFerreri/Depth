import { clamp } from './Collision.js';
export function railPoint(rail, x) {
  const t = clamp((x - rail.x) / rail.w, 0, 1);
  return rail.y - Math.sin(t * Math.PI) * rail.height;
}
export function railSlope(rail, x) {
  const t = clamp((x - rail.x) / rail.w, 0, 1);
  return -Math.cos(t * Math.PI) * Math.PI * rail.height / rail.w;
}
export function advanceRail(player, rail, dt, gravity) {
  const slope = railSlope(rail, player.x);
  const speed = Math.max(190, Math.hypot(player.vx, player.vy) + gravity * slope / Math.hypot(1, slope) * dt);
  player.vx = speed / Math.hypot(1, slope); player.vy = player.vx * slope;
  player.x += player.vx * dt; player.y = railPoint(rail, player.x) - player.r;
}
