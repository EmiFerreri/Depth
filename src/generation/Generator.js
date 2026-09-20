import { generateStoryLevel } from '../world/StoryLevel.js';
import { memoryById } from '../content/Memories.js';
import { getWorld } from '../content/Catalog.js';
export class GenerationError extends Error {
  constructor(message, status = 400) { super(message); this.name = 'GenerationError'; this.status = status; }
}
const integer = (value, fallback, min, max, name) => {
  const result = value === undefined ? fallback : value;
  if (!Number.isInteger(result) || result < min || result > max) throw new GenerationError(`${name}: se requiere un entero entre ${min} y ${max}.`);
  return result;
};
export function normalizeRequest(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new GenerationError('Se requiere un objeto JSON.');
  const fields = ['mode', 'level', 'seed', 'intensity', 'length', 'worldId', 'generatorVersion'];
  for (const key of Object.keys(input)) if (!fields.includes(key)) throw new GenerationError(`Parámetro desconocido: ${key}.`);
  const mode = input.mode === undefined ? 'expedition' : input.mode;
  if (!['story', 'expedition'].includes(mode)) throw new GenerationError('mode debe ser story o expedition.');
  const generatorVersion = integer(input.generatorVersion, 5, 4, 5, 'generatorVersion');
  const level = integer(input.level, 1, 1, mode === 'story' ? 100 : 100000, 'level');
  const intensity = integer(input.intensity, 1, 1, 5, 'intensity');
  const length = input.length === undefined ? 12 : input.length;
  if (![0, 12, 36].includes(length)) throw new GenerationError('length admite 12, 36 o 0 (Abismo, hasta 100000).');
  if (mode === 'expedition' && length && level > length) throw new GenerationError('level no puede superar la longitud del recorrido.');
  const seed = input.seed === undefined ? 'LUMA' : input.seed;
  if (typeof seed !== 'string' || !/^[A-Za-z0-9_-]{1,48}$/.test(seed)) throw new GenerationError('seed admite 1–48 letras ASCII, números, guion o guion bajo.');
  const worldId = input.worldId === undefined ? null : input.worldId;
  if (worldId !== null && (typeof worldId !== 'string' || !getWorld(worldId))) throw new GenerationError('worldId no pertenece al catálogo.');
  if (worldId && (mode !== 'expedition' || generatorVersion === 4)) throw new GenerationError('La selección de mundo requiere expedition y generatorVersion 5.');
  return { mode, level, seed: mode === 'story' ? 'ECOS-DE-TI' : seed.toUpperCase(), intensity: mode === 'story' ? 1 : intensity,
    length: mode === 'story' ? 12 : length, worldId, generatorVersion };
}
export function validateWorld(world) {
  const errors = [], check = (condition, message) => { if (!condition) errors.push(message); };
  const finite = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  if (!world || typeof world !== 'object' || Array.isArray(world)) return { valid: false, errors: ['world debe ser un objeto.'], reachability: 'not-run' };
  check(finite(world.length, 1800, 6000), 'Longitud fuera de límites.');
  check(finite(world.motion?.speed, 100, 600) && finite(world.motion?.response, 1, 30), 'Perfil de movimiento inválido.');
  const spec = world.levelInfo, rules = spec?.rules;
  check(['story', 'expedition'].includes(spec?.mode) && Number.isInteger(spec?.level) && spec.level >= 1 && spec.level <= (spec.mode === 'story' ? 100 : 100000), 'Identidad de nivel inválida.');
  check(typeof spec?.id === 'string' && spec.id.length <= 160, 'Identificador inválido.');
  check(finite(spec?.difficulty, 0, 1), 'Dificultad inválida.');
  check(['sequence','mirror','direction','truth','hold','archive','duet','switch','rhythm','synthesis'].includes(rules?.kind), 'Regla desconocida.');
  check(Number.isInteger(rules?.count) && rules.count >= 3 && rules.count <= 5, 'Número de huellas inválido.');
  check(Array.isArray(rules?.sequence) && rules.sequence.length >= 2 && rules.sequence.length <= 8 && rules.sequence.every(n => Number.isInteger(n) && n >= 1 && n <= rules.count), 'Secuencia inválida.');
  check(Array.isArray(rules?.steps) && rules.steps.length === rules?.sequence?.length && rules.steps.every((s, i) => s && s.pad === rules.sequence[i] && [-1,0,1].includes(s.direction) && [null,'nox','luma'].includes(s.character) && finite(s.hold, 0, 3) && typeof s.pulse === 'boolean'), 'Pasos incompatibles con la secuencia.');
  check(finite(rules?.pulsePeriod, 2, 10) && finite(rules?.pulseOpen, 1, rules?.pulsePeriod), 'Ventana de ritmo inválida.');
  check(finite(rules?.memorySeconds, 0, 60) && [0,3].includes(rules?.checkpointEvery), 'Checkpoint o plazo inválido.');
  const ids = new Set(), limits = { platforms: 8, hazards: 8, pickups: 8, rails: 0, enemies: 0, supports: 3, fields: 3, springs: 3, sentinels: 3 };
  for (const [key, limit] of Object.entries(limits)) {
    const list = world[key] ?? (['supports','fields','springs','sentinels'].includes(key) ? [] : null);
    if (!Array.isArray(list) || list.length > limit) { errors.push(`Lista ${key} inválida o demasiado grande.`); continue; }
    for (const item of list) {
      if (!item || typeof item !== 'object') { errors.push(`Objeto inválido en ${key}.`); continue; }
      check(typeof item.id === 'string' && item.id.length <= 80 && !ids.has(item.id), `ID duplicado o inválido en ${key}.`); ids.add(item.id);
      check(finite(item.x, 0, world.length) && finite(item.y, 80, 594), `Posición inválida: ${item.id}.`);
      if (['platforms','hazards','supports','fields','springs'].includes(key)) check(finite(item.w, 1, 500) && item.x + item.w <= world.length, `Ancho inválido: ${item.id}.`);
      if (key === 'platforms') check(Number.isInteger(item.pad) && Math.abs(item.pad) >= 1 && Math.abs(item.pad) <= rules?.count && item.x + item.w < world.gate?.x, 'Huella inválida o fuera del sello.');
      if (key === 'hazards') {
        check(finite(item.h, 1, 514) && item.y + item.h <= 594, 'Peligro fuera de límites.');
        if (item.kind === 'pulse-beam') check(finite(item.period, 2, 10) && finite(item.warningAt, 0.5, item.activeAt) && finite(item.activeAt, 1, item.period) && finite(item.phase, 0, 10), 'Pulso inválido.');
      }
      if (key === 'pickups') check(['fragment','energy','relic'].includes(item.kind) && finite(item.r, 5, 30), 'Recompensa inválida.');
      if (key === 'pickups' && item.kind === 'fragment') check(memoryById(item.memoryId)?.worldId === spec?.worldId, 'Recuerdo ajeno al mundo o desconocido.');
      if (key === 'fields') check(item.kind === 'updraft' && finite(item.h, 1, 514) && item.y + item.h <= 594 && finite(item.acceleration, -900, 0), 'Corriente inválida.');
      if (key === 'springs') check(finite(item.power, 600, 1000), 'Resorte inválido.');
      if (key === 'supports') check(item.kind === 'crumble' && finite(item.collapseAfter, 0.3, 3) && finite(item.recoverAfter, 1, 5), 'Soporte inválido.');
      if (key === 'sentinels') check(finite(item.r, 10, 30) && finite(item.range, 10, 100) && finite(item.baseX, item.range, world.length - item.range) && finite(item.period, 2, 10) && finite(item.phase, 0, Math.PI * 2), 'Centinela inválido.');
    }
  }
  check(finite(world.gate?.x, 1000, world.length - 200) && world.gate?.y === 80 && world.gate?.h === 514, 'El sello debe cubrir la altura jugable.');
  check(finite(world.clue?.x, 100, 400) && finite(world.echo?.x, world.gate?.x, world.length), 'Pista o eco inválido.');
  if (Array.isArray(world.platforms) && Array.isArray(rules?.sequence)) check(rules.sequence.every(pad => world.platforms.some(p => p?.pad === pad)), 'La secuencia requiere una huella inexistente.');
  return { valid: errors.length === 0, errors, reachability: 'not-run' };
}
export function generateLevel(input = {}) {
  const parameters = normalizeRequest(input);
  const world = generateStoryLevel(parameters, parameters.mode), validation = validateWorld(world);
  if (!validation.valid) throw new GenerationError(`El generador produjo un nivel inválido: ${validation.errors.join(' ')}`, 500);
  return { schemaVersion: 1, generatorVersion: parameters.generatorVersion, id: world.levelInfo.id, parameters, world, validation };
}
