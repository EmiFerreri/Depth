// World units are pixels in a fixed 720-unit-high simulation; velocities are units/s.
export const BALANCE = Object.freeze({
  height: 720, floor: 594, radius: 14, physicsHz: 120,
  gravity: 1450, jumpSpeed: 570, cruiseSpeed: 310, runSpeed: 515,
  maxSpeed: 1120, dashImpulse: 490, dashCooldown: 0.8, sectorLength: 2200,
});
export const MODES = Object.freeze({
  flow: { name: 'FLOW', sectors: 10, seed: 'depth-flow-v2', description: 'Diez sectores. Encuentra tu ritmo.' },
  sprint: { name: 'SPRINT', sectors: 3, seed: 'depth-sprint-v2', description: 'Tres sectores. Cada segundo cuenta.' },
  daily: { name: 'DAILY', sectors: 6, description: 'La misma ruta del día para todos. Hora UTC.' },
  campaign: { name: 'CAMPAIGN', sectors: 100, seed: 'depth-campaign-v2', description: 'Cien sectores en diez rondas continuas.' },
});
export const CHAPTERS = ['WAKE', 'VELOCITY', 'CURVATURE', 'OTHER', 'WEIGHT', 'ECHO', 'NETWORK', 'ORIGIN', 'SPECTRUM', 'ASCENSION'];
