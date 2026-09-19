export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
// Segment versus an expanded AABB: conservative swept collision for a sphere.
export function sweptRect(ax, ay, bx, by, radius, rect) {
  let enter = 0, exit = 1;
  for (const [a, delta, lo, hi] of [
    [ax, bx - ax, rect.x - radius, rect.x + rect.w + radius],
    [ay, by - ay, rect.y - radius, rect.y + rect.h + radius],
  ]) {
    if (Math.abs(delta) < 1e-9) { if (a < lo || a > hi) return false; }
    else {
      const t1 = (lo - a) / delta, t2 = (hi - a) / delta;
      enter = Math.max(enter, Math.min(t1, t2)); exit = Math.min(exit, Math.max(t1, t2));
      if (enter > exit) return false;
    }
  }
  return true;
}
export function sweptCircle(ax, ay, bx, by, cx, cy, radius) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((cx - ax) * dx + (cy - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(ax + dx * t - cx, ay + dy * t - cy) <= radius;
}
export function platformLanding(ax, ay, bx, by, radius, platform) {
  if (by <= ay || ay + radius > platform.y + 0.5 || by + radius < platform.y) return false;
  const t = (platform.y - radius - ay) / (by - ay);
  const x = ax + (bx - ax) * t;
  return x + radius > platform.x && x - radius < platform.x + platform.w;
}
