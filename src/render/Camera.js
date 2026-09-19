export class Camera {
  x = 0;
  update(player, width, dt) {
    const target = Math.max(0, player.x - width * 0.28 + Math.max(0, player.vx - 310) * 0.10);
    if (Math.abs(target - this.x) > width) this.x = target;
    else this.x += (target - this.x) * (1 - Math.exp(-7 * dt));
  }
  reset() { this.x = 0; }
}
