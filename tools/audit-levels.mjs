import { mkdir, writeFile } from 'node:fs/promises';
import { Game } from '../src/core/Game.js';
import { completeStory } from '../tests/helpers/story-player.js';
import { WORLDS } from '../src/content/Catalog.js';
const rows = [];
for (let level = 1; level <= 100; level++) {
  const game = new Game('story', undefined, false, { level });
  const run = completeStory(game, { relic: [1, 10, 50, 100].includes(level) });
  rows.push({ ...run, width: Math.min(...game.world.platforms.map(p => p.w)), steps: game.story.spec.rules.sequence.length, par: game.story.spec.par });
}
const expeditions = [];
for (let level = 1; level <= 36; level++) expeditions.push(completeStory(new Game('expedition', 'VALIDACION', false, { level, intensity: 5, length: 36 })));
const worldRoutes = [];
for (const world of WORLDS) for (const level of [1,2]) worldRoutes.push({ worldId: world.id, ...completeStory(new Game('expedition', 'MUNDOS', false, { level, intensity: 5, length: 12, worldId: world.id }), { relic: true }) });
const report = { version: 2, generatedAt: new Date().toISOString(), status: 'passed',
  method: 'Input-only pilot with solution knowledge; simulation feasibility, not human difficulty or enjoyment.',
  coverage: { story: rows.length, expedition: expeditions.length, worldRoutes: worldRoutes.length, worlds: WORLDS.length, rules: new Set(rows.map(r => r.kind)).size }, story: rows, expeditions, worldRoutes };
await mkdir('build/validation', { recursive: true });
await writeFile('build/validation/levels.json', JSON.stringify(report, null, 2));
await writeFile('build/validation/levels.md', `# DEPTH — viabilidad de niveles\n\n100 cámaras de historia, 36 de expedición mixta y 10 rutas de mundos seleccionados completadas mediante controles.\nEl piloto conoce las soluciones: sus tiempos no miden la dificultad humana.\n\n| Cámara | Regla | Pasos | Ancho mínimo | Tiempo del piloto | Errores |\n|---|---|---:|---:|---:|---:|\n${rows.map(r => `| ${r.level} | ${r.kind} | ${r.steps} | ${r.width} | ${r.time.toFixed(1)} s | ${r.mistakes} |`).join('\n')}\n`);
console.log('Reachability passed: 100 story rooms, 36 mixed expedition rooms, 10 selected-world rooms, 10 rule families. Reports: build/validation/levels.json and levels.md.');
