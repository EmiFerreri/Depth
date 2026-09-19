import { Game } from './core/Game.js';
import { FixedClock } from './core/Time.js';
import { Input } from './core/Input.js';
import { Renderer } from './render/Renderer.js';
import { Audio } from './audio/Audio.js';
import { loadProfile, saveRecord } from './core/Storage.js';
import { MODES, CHAPTERS, BALANCE as B } from './config/balance.js';
const $ = id => document.getElementById(id);
const canvas = $('game'), renderer = new Renderer(canvas), clock = new FixedClock(), audio = new Audio();
let storage;
try { storage = localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; }
const profile = loadProfile(storage);
let mode = 'flow', game = new Game(mode), toastTimer = 0, previousTime = performance.now(), hudTimer = 0;
let lockedAutoRun = true;
const input = new Input(canvas, togglePause, () => { if (game.state === 'running' || game.state === 'paused') start(); });
const formatTime = time => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}.${String(Math.floor(time * 100) % 100).padStart(2, '0')}`;
const recordKey = () => `${game.mode}:${game.world.seed}:${game.assist ? 'practice' : 'standard'}:${lockedAutoRun ? 'auto' : 'manual'}`;
function showToast(text) { $('toast').textContent = text; $('toast').classList.add('visible'); toastTimer = 2.6; }
function refreshBest() {
  const preview = new Game(mode, undefined, $('assist').checked);
  const key = `${mode}:${preview.world.seed}:${preview.assist ? 'practice' : 'standard'}:${$('autorun').checked ? 'auto' : 'manual'}`;
  const best = profile.records[key]; $('best').textContent = best ? Math.floor(best.score).toLocaleString('es') : '—';
}
function selectMode(value) {
  mode = value;
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('mode-description').textContent = MODES[mode].description; $('start').firstChild.textContent = `INICIAR ${MODES[mode].name} `;
  refreshBest();
}
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => selectMode(button.dataset.mode)));
$('assist').addEventListener('change', refreshBest); $('autorun').addEventListener('change', refreshBest);
$('reduced').checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('reduced').addEventListener('change', () => { renderer.reduced = $('reduced').checked; renderer.trail = []; renderer.particles = []; });
renderer.reduced = $('reduced').checked;
function closeDialogs() { for (const id of ['pause-dialog', 'result-dialog']) if ($(id).open) $(id).close(); }
function start() {
  closeDialogs(); input.clear(); clock.reset(); renderer.reset();
  game = new Game(mode, undefined, $('assist').checked); lockedAutoRun = $('autorun').checked; game.start();
  $('menu').hidden = true; for (const id of ['hud', 'telemetry', 'touch-controls']) $(id).hidden = false;
  document.body.classList.add('playing'); canvas.tabIndex = -1; canvas.focus(); audio.unlock();
  showToast(mode === 'daily' ? `Ruta diaria · ${game.world.seed.slice(-10)} UTC` : 'Salta. Sigue la curva. Busca el impulso.'); updateHUD();
}
function togglePause() {
  if (game.state === 'running') {
    game.pause(); input.clear(); clock.reset(); $('pause-dialog').showModal();
  } else if (game.state === 'paused') {
    game.resume(); closeDialogs(); input.clear(); clock.reset(); previousTime = performance.now(); canvas.focus();
  }
}
function menu() {
  closeDialogs(); game = new Game(mode); input.clear(); clock.reset(); renderer.reset();
  $('menu').hidden = false; for (const id of ['hud', 'telemetry', 'touch-controls']) $(id).hidden = true;
  $('toast').classList.remove('visible'); document.body.classList.remove('playing'); refreshBest(); $('start').focus();
}
function finish() {
  const saved = saveRecord(storage, profile, recordKey(), Math.floor(game.score), game.time);
  $('result-score').textContent = Math.floor(game.score).toLocaleString('es'); $('result-time').textContent = formatTime(game.time);
  $('result-combo').textContent = `×${game.bestCombo}`; $('result-hits').textContent = game.hits;
  $('record-note').textContent = saved ? `${game.assist ? 'Marca de práctica' : 'Marca'} guardada en este navegador.` : 'Partida completada. Este navegador no permite guardar la marca.';
  input.clear(); $('result-dialog').showModal();
}
function updateHUD() {
  $('mode-label').textContent = `${MODES[mode].name} / ${CHAPTERS[Math.floor(game.sector / 10) % 10]}`;
  $('sector').firstChild.textContent = String(game.sector + 1).padStart(2, '0'); $('sector').lastElementChild.textContent = ` / ${game.world.sectors}`;
  $('score').textContent = String(Math.floor(game.score)).padStart(6, '0'); $('time').textContent = formatTime(game.time);
  $('health').textContent = '● '.repeat(game.player.hp) + '○ '.repeat(3 - game.player.hp);
  $('speed').textContent = Math.round(Math.hypot(game.player.vx, game.player.vy)); $('combo').textContent = `×${game.combo}`;
  $('progress').style.width = `${Math.min(100, game.maxX / game.world.length * 100)}%`;
  $('dash-bar').style.width = `${Math.max(0, 1 - game.player.dashCooldown / B.dashCooldown) * 100}%`;
  $('dash-label').textContent = game.player.dashCooldown ? 'RECARGANDO' : 'DASH LISTO';
  // Read-only state supports local browser regression checks; it cannot mutate the game.
  window.depth = Object.freeze({ snapshot: () => ({ state: game.state, mode: game.mode, x: game.player.x, y: game.player.y, hp: game.player.hp,
    score: game.score, time: game.time, sector: game.sector, seed: game.world.seed, bullets: game.bullets.length, combo: game.combo }) });
}
for (const id of ['start', 'restart', 'again']) $(id).addEventListener('click', start);
for (const id of ['pause', 'resume']) $(id).addEventListener('click', togglePause);
for (const id of ['quit', 'result-menu']) $(id).addEventListener('click', menu);
$('pause-dialog').addEventListener('cancel', event => { event.preventDefault(); togglePause(); });
$('result-dialog').addEventListener('cancel', event => { event.preventDefault(); menu(); });
$('sound').addEventListener('click', () => {
  audio.enabled = !audio.enabled; $('sound').setAttribute('aria-pressed', String(audio.enabled));
  $('sound').setAttribute('aria-label', `Sonido ${audio.enabled ? 'activado' : 'desactivado'}`); $('sound').lastElementChild.textContent = audio.enabled ? 'ON' : 'OFF';
  if (audio.enabled) audio.unlock();
});
$('fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { showToast('Pantalla completa no disponible en este navegador.'); }
});
function autoPause() { if (game.state === 'running') togglePause(); input.clear(); }
addEventListener('blur', autoPause); document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
function frame(now) {
  const dt = Math.min((now - previousTime) / 1000, 0.1); previousTime = now;
  if (game.state === 'running') {
    clock.advance(dt, step => {
      game.step(step, { ...input.read(renderer), autoRun: lockedAutoRun });
      renderer.effects(game.events);
      for (const event of game.events) {
        audio.play(event.type, game.combo);
        if (event.text) showToast(event.text);
        if (event.type === 'boost') showToast('IMPULSO · conserva el momentum');
        if (event.type === 'gravity') showToast('GRAVEDAD LIGERA · 5 segundos');
        if (event.type === 'shield') showToast(game.player.shield ? 'ESCUDO ACTIVADO' : 'ESCUDO ABSORBIDO');
        if (event.type === 'finish') finish();
      }
    });
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('visible'); }
  } else clock.reset();
  renderer.draw(game, game.state === 'running' ? dt : 0);
  hudTimer += dt; if (hudTimer >= 0.05) { updateHUD(); hudTimer = 0; }
  requestAnimationFrame(frame);
}
selectMode(mode); updateHUD(); requestAnimationFrame(frame);
