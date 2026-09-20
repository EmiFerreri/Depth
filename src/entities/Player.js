import { BALANCE as B } from '../config/balance.js';
export class Player {
  constructor() { this.reset(); }
  reset(x = 100) {
    Object.assign(this, { x, y: B.floor - B.radius, vx: 0, vy: 0, r: B.radius,
      hp: 3, invulnerable: 0, dashCooldown: 0, dashTime: 0, fireCooldown: 0,
      rail: null, detach: 0, shield: 0, gravityTime: 0, abilityCooldown: 0, wardTime: 0 });
  }
}
