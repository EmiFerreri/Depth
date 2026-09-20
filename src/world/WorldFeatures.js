import { getWorld } from '../content/Catalog.js';
import { seededRandom } from './ChunkGenerator.js';
import { BALANCE as B } from '../config/balance.js';
export function addWorldFeatures(world) {
  const spec = world.levelInfo, theme = getWorld(spec.worldId), random = seededRandom(`${spec.id}:features`);
  world.biome = { id: theme.id, name: theme.name, paper: theme.paper, accent: theme.accent, motif: theme.motif };
  world.supports = []; world.fields = []; world.springs = []; world.sentinels = [];
  world.abilitiesEnabled = true;
  const pads = world.platforms.filter(p => p.pad > 0).sort((a, b) => a.x - b.x);
  const gapCenter = (pads[0].x + pads[0].w + pads[1].x) / 2;
  // Feature corridors never occupy mandatory puzzle pads. First chamber stays an introduction.
  if (spec.mode !== 'story' || spec.level > 1) {
    for (let i = 0; i < pads.length - 1; i++) {
      const x = (pads[i].x + pads[i].w + pads[i + 1].x) / 2;
      world.pickups.push({ id: `fragment-${i}`, kind: 'fragment', memoryId: `${theme.id}-${(i + (spec.chapter % 2) * 2) % 4}`, x, y: 280 + random() * 40, r: 10, used: false });
    }
    world.pickups.push({ id: 'ability-energy', kind: 'energy', x: world.gate.x - 145, y: B.floor - 40, r: 15, used: false });
    if (theme.obstacles.includes('spring')) world.springs.push({ id: 'spring-1', x: world.gate.x - 270, y: B.floor - 6, w: 72, h: 6, power: 760 });
    if (theme.obstacles.includes('pulse-beam')) world.hazards.push({ id: 'pulse-beam-1', kind: 'pulse-beam', x: gapCenter - 12,
      y: 414, w: 24, h: 180, period: 4.2, warningAt: 2.1, activeAt: 2.7, phase: 0, state: 'safe', active: false });
    if (theme.obstacles.includes('crumble')) world.supports.push({ id: 'crumble-1', kind: 'crumble', x: gapCenter - 55, y: 320,
      w: 110, active: true, charge: 0, downtime: 0, collapseAfter: 0.7, recoverAfter: 2 });
    if (theme.obstacles.includes('updraft')) world.fields.push({ id: 'updraft-1', kind: 'updraft', x: gapCenter - 60, y: 340, w: 120, h: B.floor - 340, acceleration: -780 });
    if (theme.obstacles.includes('sentinel')) world.sentinels.push({ id: 'sentinel-1', x: gapCenter, y: 510, baseX: gapCenter,
      r: 18, range: 46 + spec.difficulty * 14, period: 3.8, phase: random() * Math.PI * 2 });
  }
  return world;
}
