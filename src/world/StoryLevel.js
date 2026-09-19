import { BALANCE as B } from '../config/balance.js';
export function generateStoryLevel() {
  return {
    seed: 'depth-la-huella-v1', length: B.sectorLength, sectors: 1,
    motion: { speed: 270, response: 14 },
    platforms: [620, 1000, 1380].map((center, index) => ({
      id: `memory-pad-${index + 1}`, pad: index + 1, x: center - 90, y: 510, w: 180,
    })),
    hazards: [], rails: [], pickups: [], enemies: [],
    clue: { x: 310, y: B.floor - 22 },
    gate: { x: 1770, y: 80, w: 28, h: B.floor - 80 },
    echo: { x: 1970, y: B.floor - 30 },
  };
}
