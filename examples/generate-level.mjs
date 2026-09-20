// Start the server with npm start in another terminal.
const base = process.env.DEPTH_API_URL || 'http://127.0.0.1:8000';
const response = await fetch(`${base}/api/v1/levels/generate`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'expedition', seed: 'LUMA-RECUERDA', level: 1, intensity: 3, length: 36, worldId: 'archives', generatorVersion: 5 }),
  signal: AbortSignal.timeout(10000),
});
const result = await response.json();
if (!response.ok) throw new Error(result.error?.message || `HTTP ${response.status}`);
console.log(JSON.stringify(result, null, 2));
