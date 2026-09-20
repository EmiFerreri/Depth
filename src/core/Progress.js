import { TOTAL_LEVELS, normalizeSeed } from '../story/Campaign.js';
import { memoryById } from '../content/Memories.js';
import { normalizeHistory } from './History.js';
import { getWorld } from '../content/Catalog.js';
const KEY = 'depth.journey.v1';
export const freshProgress = () => ({ version: 1, unlocked: 1, selected: 1, records: {}, expedition: null, history: [], memories: [] });
export function parseProgress(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!data || data.version !== 1 || !data.records || typeof data.records !== 'object' || Array.isArray(data.records)) throw new Error('Formato de progreso no válido.');
  const result = freshProgress();
  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    const r = Object.hasOwn(data.records, level) ? data.records[level] : null;
    if (!r || r.completed !== true || !Number.isFinite(r.bestTime) || r.bestTime <= 0 || r.bestTime > 86400) continue;
    result.records[level] = { completed: true, clean: r.clean === true, relic: r.relic === true, bestTime: r.bestTime };
  }
  while (result.unlocked < TOTAL_LEVELS && result.records[result.unlocked]) result.unlocked++;
  result.selected = Number.isInteger(data.selected) ? Math.max(1, Math.min(result.unlocked, data.selected)) : result.unlocked;
  const run = data.expedition;
  if (run && typeof run.seed === 'string' && Number.isInteger(run.level) && run.level >= 1 && run.level <= 100000 &&
    [0, 12, 36].includes(run.length) && Number.isInteger(run.intensity) && run.intensity >= 1 && run.intensity <= 5 &&
    (!run.length || run.level <= run.length)) result.expedition = { seed: normalizeSeed(run.seed), level: run.level, intensity: run.intensity, length: run.length, generatorVersion: run.generatorVersion === 5 ? 5 : 4, worldId: run.generatorVersion === 5 && getWorld(run.worldId) ? run.worldId : null };
  result.history = normalizeHistory(data.history);
  result.memories = Array.isArray(data.memories) ? [...new Set(data.memories.filter(id => typeof id === 'string' && memoryById(id)))].slice(0,20) : [];
  return result;
}
export function loadProgress(storage, oldProfile) {
  try {
    const raw = storage.getItem(KEY);
    if (raw) return parseProgress(raw);
  } catch { return freshProgress(); }
  const result = freshProgress();
  const legacy = Object.entries(oldProfile?.records || {}).find(([key]) => key.startsWith('story:depth-la-huella-v1:'))?.[1];
  if (legacy) {
    result.records[1] = { completed: true, clean: false, relic: false, bestTime: legacy.time };
    result.unlocked = 2; result.selected = 2;
  }
  return result;
}
export function saveProgress(storage, progress) {
  try { storage.setItem(KEY, JSON.stringify(progress)); return true; } catch { return false; }
}
export function stars(record) { return record?.completed ? 1 + Number(record.clean) + Number(record.relic) : 0; }
export function completeLevel(progress, game) {
  if (!game.story || game.state !== 'finished' || !game.story.gateOpen || !game.story.echoFound) return null;
  progress.memories = [...new Set([...(progress.memories || []), ...(game.story.memories || [])])];
  const relics = game.world.pickups.filter(p => p.kind === 'relic');
  const result = { completed: true, clean: !game.assist && !game.hits && !game.story.puzzle.mistakes,
    relic: relics.length > 0 && relics.every(p => p.used), bestTime: game.time };
  if (game.mode === 'story') {
    const level = game.story.spec.level, old = progress.records[level];
    progress.records[level] = { ...result, clean: result.clean || !!old?.clean, relic: result.relic || !!old?.relic,
      bestTime: Math.min(old?.bestTime || Infinity, game.time) };
    progress.unlocked = Math.max(progress.unlocked, Math.min(TOTAL_LEVELS, level + 1));
    progress.selected = Math.min(progress.unlocked, level + 1);
  }
  return result;
}
export function mergeProgress(current, imported) {
  const result = parseProgress(imported);
  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    const a = current.records[level], b = result.records[level];
    if (!a) continue;
    result.records[level] = b ? { completed: true, clean: a.clean || b.clean, relic: a.relic || b.relic, bestTime: Math.min(a.bestTime, b.bestTime) } : { ...a };
  }
  const merged = parseProgress({ ...result, memories: [...(result.memories || []), ...(current.memories || [])], history: normalizeHistory([...(result.history || []), ...(current.history || [])]), selected: Math.max(current.selected, result.selected), expedition: current.expedition || result.expedition });
  merged.selected = merged.unlocked;
  return merged;
}
