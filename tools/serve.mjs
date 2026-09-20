import { createDepthServer } from '../server/http.mjs';
const port = Number(process.env.PORT || 8000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un entero entre 1 y 65535.');
const server = createDepthServer();
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`DEPTH + API: http://127.0.0.1:${port} · /api/v1/health (Ctrl+C para salir)`));
