import { BALANCE as B } from '../config/balance.js';
import { getLevelSpec, shuffle } from '../story/Campaign.js';
import { seededRandom } from './ChunkGenerator.js';
export function generateStoryLevel(options = {}, mode = 'story') {
  const spec = getLevelSpec(mode, options), d = spec.difficulty;
  const first = mode === 'story' && spec.level === 1;
  const random = seededRandom(`${spec.id}:geometry`);
  const count = spec.rules.count;
  const labels = first || spec.rules.kind === 'switch' ? Array.from({ length: count }, (_, i) => i + 1) : shuffle(Array.from({ length: count }, (_, i) => i + 1), random);
  const gap = first ? 380 : 360 + Math.round(d * 110);
  const width = first ? 180 : Math.round(176 - d * 82);
  const platforms = labels.map((pad, i) => ({ id: `memory-pad-${pad}`, pad,
    x: 620 + i * gap - width / 2, y: first ? 510 : 510 - Math.round(random() * d * 140), w: width,
    stamp: spec.rules.timestamps[pad - 1], authentic: true }));
  if (spec.rules.kind === 'truth') {
    for (let i = 0; i < Math.min(3, count - 1); i++) platforms.push({ id: `false-pad-${i}`, pad: -(i + 1),
      x: 620 + i * gap + gap / 2 - width / 2, y: 510, w: width, authentic: false });
  }
  const gateX = first ? 1770 : 620 + (count - 1) * gap + 440;
  const world = {
    seed: first ? 'depth-la-huella-v1' : spec.id, levelInfo: spec,
    length: first ? B.sectorLength : gateX + 430, sectors: 1,
    motion: { speed: first ? 270 : 280 + d * 40, response: 14 },
    platforms, hazards: [], rails: [], pickups: [], enemies: [],
    clue: { x: 310, y: B.floor - 22 },
    gate: { x: gateX, y: 80, w: 28, h: B.floor - 80 },
    echo: { x: gateX + 200, y: B.floor - 30 },
  };
  // Required pads stay reachable with repeated jumps. Ground hazards add routing decisions.
  if (!first && d >= 0.1) for (let i = 0; i < count - 1; i++) {
    if (random() < 0.55 + d * 0.3) world.hazards.push({ id: `memory-hazard-${i}`,
      x: 620 + i * gap + gap * 0.55, y: B.floor - 24, w: 38 + d * 35, h: 24 });
  }
  // Optional high relic: a reason to take another route, never a requirement to advance.
  world.pickups.push({ id: 'memory-relic', kind: 'relic', x: first ? 1190 : 620 + gap * (count - 1) / 2, y: 240 - d * 80, r: 14, used: false });
  return world;
}
