import { spawnSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
// Node directly, without shell quoting or platform-specific npm.cmd assumptions.
const gates = [
  { name: 'Regresiones', args: ['--test', 'tests/engine.test.js', 'tests/input.test.js', 'tests/legacy.test.js', 'tests/story.test.js', 'tests/campaign.test.js', 'tests/worlds.test.js', 'tests/api.test.js'] },
  { name: 'Sintaxis y JSON', args: ['tools/check.mjs'] },
  { name: 'Recorridos completos', args: ['tools/audit-levels.mjs'] },
];
const results = [];
for (const gate of gates) {
  const start = Date.now();
  const run = spawnSync(process.execPath, gate.args, { encoding: 'utf8', cwd: new URL('../', import.meta.url), timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  results.push({ name: gate.name, passed: run.status === 0, durationMs: Date.now() - start, output: `${run.stdout || ''}${run.stderr || ''}${run.error?.message || ''}` });
  console.log(`${run.status === 0 ? 'PASS' : 'FAIL'} · ${gate.name}`);
}
const passed = results.every(r => r.passed);
await mkdir(new URL('../build/validation/', import.meta.url), { recursive: true });
await writeFile(new URL('../build/validation/report.json', import.meta.url), JSON.stringify({ version: pkg.version, generatedAt: new Date().toISOString(), passed, browser: 'not-run', results }, null, 2));
await writeFile(new URL('../build/validation/report.md', import.meta.url), `# Validación local DEPTH ${pkg.version}\n\nResultado: **${passed ? 'PASS' : 'FAIL'}**. Navegador: no ejecutado.\n\n| Puerta | Resultado | Duración |\n|---|---|---|\n${results.map(r => `| ${r.name} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.durationMs} ms |`).join('\n')}\n\nNo demuestra calidad visual, dificultad humana ni retención de jugadores.\nConsulta docs/PLAYTEST.md para completar esas comprobaciones.\n`);
console.log('Informe: build/validation/report.md y report.json');
if (!passed) process.exitCode = 1;
