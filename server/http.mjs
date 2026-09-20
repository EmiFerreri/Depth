import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLevel, validateWorld, GenerationError } from '../src/generation/Generator.js';
import { getCatalog } from '../src/content/Catalog.js';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BODY_LIMIT = 65536;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.md': 'text/plain' };
const NUMBERS = new Set(['level','intensity','length','generatorVersion']);
function send(res, status, data, head = false) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(head ? undefined : JSON.stringify(data));
}
async function body(req) {
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new GenerationError('Content-Type debe ser application/json.', 415);
  const chunks = await new Promise((resolve, reject) => {
    let size = 0, exceeded = false; const collected = [];
    req.on('data', chunk => {
      if (exceeded) return;
      size += chunk.length;
      if (size > BODY_LIMIT) { exceeded = true; collected.length = 0; reject(new GenerationError('El cuerpo supera 64 KiB.', 413)); }
      else collected.push(chunk);
    });
    req.on('end', () => { if (!exceeded) resolve(collected); });
    req.on('error', reject); req.on('aborted', () => reject(new GenerationError('Solicitud interrumpida.', 400)));
  });
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new GenerationError('JSON inválido.'); }
}
function query(search) {
  const result = {};
  for (const [key, value] of search) {
    if (Object.hasOwn(result, key)) throw new GenerationError(`Parámetro repetido: ${key}.`);
    if (NUMBERS.has(key) && !/^(0|[1-9]\d*)$/.test(value)) throw new GenerationError(`Entero inválido: ${key}.`);
    Object.defineProperty(result, key, { value: NUMBERS.has(key) ? Number(value) : value, enumerable: true });
  }
  return result;
}
async function api(req, res, url) {
  // Local development service. Exact authority checks also prevent DNS rebinding.
  const authority = `127.0.0.1:${req.socket.localPort}`, localhost = `localhost:${req.socket.localPort}`;
  if (![authority, localhost].includes(req.headers.host)) throw new GenerationError('Host local requerido.', 403);
  if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) throw new GenerationError('Origen no permitido.', 403);
  if (Number(req.headers['content-length']) > BODY_LIMIT) { req.resume(); throw new GenerationError('El cuerpo supera 64 KiB.', 413); }
  const route = url.pathname.startsWith('/api/v1/') ? url.pathname.slice('/api/v1/'.length) : '', catalogs = getCatalog();
  const readOnly = { health: { status: 'ok', apiVersion: 1, generatorVersions: [4,5], defaultGeneratorVersion: 5 }, catalog: catalogs,
    worlds: catalogs.worlds, characters: catalogs.characters, chapters: catalogs.chapters, abilities: catalogs.abilities, obstacles: catalogs.obstacles, rewards: catalogs.rewards, memories: catalogs.memories };
  if (Object.hasOwn(readOnly, route)) {
    if (!['GET','HEAD'].includes(req.method)) throw new GenerationError('Método no permitido.', 405);
    return send(res, 200, readOnly[route], req.method === 'HEAD');
  }
  if (route === 'levels/generate') {
    if (!['GET','POST'].includes(req.method)) throw new GenerationError('Método no permitido.', 405);
    return send(res, 200, generateLevel(req.method === 'GET' ? query(url.searchParams) : await body(req)));
  }
  if (route === 'levels/batch') {
    if (req.method !== 'POST') throw new GenerationError('Método no permitido.', 405);
    const input = await body(req);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new GenerationError('Se requiere un objeto JSON.');
    const { count = 1, ...parameters } = input;
    if (!Number.isInteger(count) || count < 1 || count > 20) throw new GenerationError('count debe ser un entero entre 1 y 20.');
    const first = generateLevel(parameters), start = first.parameters.level;
    const levels = [first];
    for (let i = 1; i < count; i++) levels.push(generateLevel({ ...first.parameters, level: start + i }));
    return send(res, 200, { schemaVersion: 1, count, levels });
  }
  if (route === 'levels/validate') {
    if (req.method !== 'POST') throw new GenerationError('Método no permitido.', 405);
    const input = await body(req);
    if (!input || typeof input !== 'object' || Array.isArray(input) || !Object.hasOwn(input, 'world') || Object.keys(input).length !== 1) throw new GenerationError('Se requiere { world: ... }.');
    return send(res, 200, validateWorld(input.world));
  }
  throw new GenerationError('Ruta API desconocida.', 404);
}
export function createDepthServer({ root = ROOT } = {}) {
  const absoluteRoot = path.resolve(root);
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) return await api(req, res, url);
      if (!['GET','HEAD'].includes(req.method)) throw new GenerationError('Método no permitido.', 405);
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.split('/').some(part => part.startsWith('.')) || pathname.includes('\\') || pathname.includes('\0')) throw new GenerationError('Ruta no permitida.', 403);
      let file = path.resolve(absoluteRoot, `.${pathname}`);
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      file = await realpath(file);
      const relative = path.relative(absoluteRoot, file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new GenerationError('Ruta no permitida.', 403);
      const bytes = await readFile(file);
      res.writeHead(200, { 'Content-Type': `${TYPES[path.extname(file)] || 'application/octet-stream'}; charset=utf-8`,
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      const status = error instanceof GenerationError ? error.status : error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : error instanceof URIError ? 400 : 500;
      if (!res.headersSent) send(res, status, { error: { status, message: status === 500 ? 'Error interno al procesar la solicitud.' : error instanceof GenerationError ? error.message : 'Recurso no disponible.' } });
    }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000; server.keepAliveTimeout = 2000;
  return server;
}
