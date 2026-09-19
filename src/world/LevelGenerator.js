import { BALANCE as B, MODES } from '../config/balance.js';
import { seededRandom } from './ChunkGenerator.js';
export function dailySeed(date = new Date()) { return `depth-daily-v2-${date.toISOString().slice(0, 10)}`; }
export function generateWorld(mode = 'flow', seed = MODES[mode]?.seed || dailySeed()) {
  const config = MODES[mode];
  if (!config) throw new Error('Unknown mode');
  const random = seededRandom(seed);
  const world = { seed, length: config.sectors * B.sectorLength, sectors: config.sectors,
    platforms: [], hazards: [], rails: [], pickups: [], enemies: [] };
  const add = (type, value) => world[type].push({ id: `${type}-${world[type].length}`, ...value });
  for (let sector = 0; sector < config.sectors; sector++) {
    const x = sector * B.sectorLength, shift = Math.floor(random() * 70), difficulty = Math.min(6, sector / 8);
    // A safe runway follows each checkpoint. Physics never depends on viewport dimensions.
    const pattern = sector % 4;
    const railWidth = [560, 610, 500, 650][pattern], railHeight = [110, 155, 95, 180][pattern];
    add('rails', { x: x + 360, y: B.floor, w: railWidth, height: railHeight });
    add('platforms', { x: x + 1100, y: B.floor - [140, 190, 110, 165][pattern], w: 230 });
    add('platforms', { x: x + 1510, y: B.floor - [240, 290, 180, 255][pattern], w: 200 });
    if (pattern === 2) add('rails', { x: x + 1800, y: B.floor, w: 350, height: 85 });
    add('hazards', { x: x + 1010 + shift, y: B.floor - 24, w: 50 + difficulty * 7, h: 24 });
    add('hazards', { x: x + 1710 + shift, y: B.floor - 24, w: 80 + difficulty * 7, h: 24 });
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6;
      add('pickups', { kind: 'shard', x: x + 360 + t * railWidth, y: B.floor - 30 - Math.sin(t * Math.PI) * railHeight, r: 10, used: false });
    }
    add('pickups', { kind: 'boost', x: x + 1420, y: B.floor - 95, r: 23, used: false });
    add('pickups', { kind: sector % 2 ? 'gravity' : 'shield', x: x + 1580, y: B.floor - 290, r: 16, used: false });
    if (sector >= 2) add('enemies', { x: x + 1940, y: B.floor - 96, baseY: B.floor - 96, r: 19, alive: true, phase: random() * 6.28 });
  }
  return world;
}
