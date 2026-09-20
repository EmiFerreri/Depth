import { SCORE_LABELS } from './Score.js';
import { WORLDS, worldForChapter } from '../content/Catalog.js';
export const HISTORY_LIMIT = 200;
const outcomes = ['completed', 'restarted', 'abandoned'];
const bounded = (n, max) => Number.isFinite(n) && n >= 0 && n <= max;
export function normalizeHistory(rows) {
  if (!Array.isArray(rows)) return [];
  const unique = new Map();
  for (const row of rows.slice(-HISTORY_LIMIT * 2)) {
    if (!row || typeof row.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(row.id) || unique.has(row.id)) continue;
    if (typeof row.at !== 'string' || !Number.isFinite(Date.parse(row.at)) || !outcomes.includes(row.outcome)) continue;
    if (!['story','expedition','flow','sprint','daily','campaign'].includes(row.mode) || !bounded(row.time, 86400 * 30) || !bounded(row.score, 1e10)) continue;
    if (![4,5].includes(row.generatorVersion) || !Number.isInteger(row.level) || row.level < 1 || row.level > 100000) continue;
    if (!Number.isInteger(row.intensity) || row.intensity < 1 || row.intensity > 5 || ![0,12,36].includes(row.length)) continue;
    const counts = ['hits','mistakes','abilityUses','stars'];
    if (counts.some(k => !Number.isInteger(row[k]) || !bounded(row[k], k === 'stars' ? 3 : 1e7))) continue;
    const ledger = {};
    for (const key of Object.keys(SCORE_LABELS)) ledger[key] = Number.isFinite(row.ledger?.[key]) && Math.abs(row.ledger[key]) <= 1e10 ? row.ledger[key] : 0;
    unique.set(row.id, { id: row.id, at: new Date(row.at).toISOString(), mode: row.mode, outcome: row.outcome,
      level: row.level, generatorVersion: row.generatorVersion, worldId: WORLDS.some(w => w.id === row.worldId) ? row.worldId : null,
      seed: typeof row.seed === 'string' ? row.seed.replace(/[^A-Za-z0-9_:-]/g, '').slice(0,160) : '',
      intensity: row.intensity, length: row.length, worldChoice: WORLDS.some(w => w.id === row.worldChoice) ? row.worldChoice : null,
      time: row.time, score: row.score, hits: row.hits, mistakes: row.mistakes, abilityUses: row.abilityUses,
      stars: row.stars, relic: row.relic === true, practice: row.practice === true, ledger });
  }
  return [...unique.values()].sort((a,b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id)).slice(-HISTORY_LIMIT);
}
export function recordAttempt(progress, game, outcome, at = new Date(), id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`) {
  if (!outcomes.includes(outcome) || game.historyRecorded || game.time <= 0 || (outcome === 'completed' && game.state !== 'finished')) return null;
  const spec = game.story?.spec, relics = game.world.pickups.filter(p => p.kind === 'relic');
  const relic = relics.length > 0 && relics.every(p => p.used);
  const row = { id, at: at.toISOString(), mode: game.mode, outcome, level: spec?.level || game.sector + 1,
    generatorVersion: spec?.generatorVersion || 4, worldId: spec ? spec.worldId || worldForChapter(spec.chapter).id : null,
    worldChoice: spec?.worldChoice || null, seed: spec?.seed || game.world.seed, intensity: spec?.intensity || 1, length: spec?.runLength || 0,
    time: game.time, score: game.score, hits: game.hits, mistakes: game.story?.puzzle.mistakes || 0,
    abilityUses: game.abilityUses || 0, practice: game.assist, relic,
    stars: game.story && outcome === 'completed' ? 1 + Number(!game.assist && !game.hits && !game.story.puzzle.mistakes) + Number(relic) : 0,
    ledger: { ...game.scoreLedger } };
  progress.history = normalizeHistory([...(progress.history || []), row]); game.historyRecorded = true;
  return row;
}
export function earnedRewards(progress) {
  return WORLDS.map(world => ({ id: `badge-${world.id}`, worldId: world.id, name: world.reward.replace('Insignia: ', ''),
    completed: Array.from({ length: 20 }, (_, i) => progress.records[world.levels[0] + i]).filter(r => r?.completed).length,
    required: 20 })).map(reward => ({ ...reward, earned: reward.completed === reward.required }));
}
