import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const root = new URL('../', import.meta.url);
let count = 0;
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) await scan(name);
    else if (/\.(mjs|js)$/.test(name)) { check(await readFile(name, 'utf8'), name); }
    else if (name.endsWith('.html')) {
      for (const match of (await readFile(name, 'utf8')).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if (match[1].trim()) check(match[1], name);
    } else if (name.endsWith('.json')) JSON.parse(await readFile(name, 'utf8'));
  }
}
function check(source, name) {
  const result = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: source, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${name}\n${result.stderr}`);
  count++;
}
await scan((await import('node:url')).fileURLToPath(root));
console.log(`${count} JavaScript syntax checks passed; JSON parsed.`);
