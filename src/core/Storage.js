const KEY = 'depth.profile.v2';
export function loadProfile(storage) {
  try {
    const data = JSON.parse(storage.getItem(KEY));
    if (!data || data.version !== 2 || typeof data.records !== 'object' || !data.records || Array.isArray(data.records)) throw new Error();
    const records = {};
    for (const [key, value] of Object.entries(data.records).slice(-100)) {
      if (value && Number.isFinite(value.score) && value.score >= 0 && value.score < 1e9 && Number.isFinite(value.time) && value.time > 0 && value.time < 86400) records[key] = { score: value.score, time: value.time };
    }
    return { version: 2, records };
  } catch { return { version: 2, records: {} }; }
}
export function saveRecord(storage, profile, key, score, time) {
  if (!Number.isFinite(score) || !Number.isFinite(time) || time <= 0 || score < 0) return false;
  const previous = Object.hasOwn(profile.records, key) ? profile.records[key] : null;
  profile.records[key] = { score: Math.max(previous?.score || 0, score), time: Math.min(previous?.time || Infinity, time) };
  profile.records = Object.fromEntries(Object.entries(profile.records).slice(-100));
  try { storage.setItem(KEY, JSON.stringify(profile)); return true; } catch { return false; }
}
