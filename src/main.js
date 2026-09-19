import { Game } from './core/Game.js';
import { FixedClock } from './core/Time.js';
import { Input } from './core/Input.js';
import { Renderer } from './render/Renderer.js';
import { Audio } from './audio/Audio.js';
import { loadProfile, saveRecord } from './core/Storage.js';
import { MODES, CHAPTERS, BALANCE as B } from './config/balance.js';
import { STORY } from './story/StoryData.js';
const $ = id => document.getElementById(id);
const canvas = $('game'), renderer = new Renderer(canvas), clock = new FixedClock(), audio = new Audio();
let storage;
try { storage = localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; }
const profile = loadProfile(storage);
let mode = 'story', game = new Game(mode), toastTimer = 0, previousTime = performance.now(), hudTimer = 0;
let lockedAutoRun = true;
const input = new Input(canvas, togglePause, () => { if (game.state === 'running') start(false); }, openJournal);
const formatTime = time => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}.${String(Math.floor(time * 100) % 100).padStart(2, '0')}`;
const recordKey = () => `${game.mode}:${game.world.seed}:${game.assist ? 'practice' : 'standard'}:${lockedAutoRun ? 'auto' : 'manual'}`;
function showToast(text) { $('toast').textContent = text; $('toast').classList.add('visible'); toastTimer = 2.6; }
function refreshBest() {
  const preview = new Game(mode, undefined, $('assist').checked);
  const key = `${mode}:${preview.world.seed}:${preview.assist ? 'practice' : 'standard'}:${mode !== 'story' && $('autorun').checked ? 'auto' : 'manual'}`;
  const best = profile.records[key]; $('best').textContent = best ? Math.floor(best.score).toLocaleString('es') : '—';
}
function selectMode(value) {
  mode = value;
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('mode-description').textContent = MODES[mode].description; $('start').firstChild.textContent = `INICIAR ${MODES[mode].name} `;
  $('autorun').disabled = mode === 'story';
  $('movement-note').hidden = mode !== 'story';
  refreshBest();
}
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => selectMode(button.dataset.mode)));
$('assist').addEventListener('change', refreshBest); $('autorun').addEventListener('change', refreshBest);
$('reduced').checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('reduced').addEventListener('change', () => { renderer.reduced = $('reduced').checked; renderer.trail = []; renderer.particles = []; });
renderer.reduced = $('reduced').checked;
function closeDialogs() { for (const id of ['pause-dialog', 'result-dialog', 'story-intro', 'journal-dialog']) if ($(id).open) $(id).close(); }
function start(showIntro = true) {
  closeDialogs(); input.clear(); clock.reset(); renderer.reset();
  game = new Game(mode, undefined, $('assist').checked); lockedAutoRun = mode !== 'story' && $('autorun').checked;
  $('menu').hidden = true; for (const id of ['hud', 'telemetry', 'touch-controls']) $(id).hidden = false;
  $('story-panel').hidden = !game.story;
  document.querySelector('[data-control="shoot"]').hidden = !!game.story;
  document.body.classList.toggle('story-playing', !!game.story);
  document.body.classList.add('playing'); canvas.tabIndex = -1; canvas.focus(); audio.unlock();
  $('toast').classList.remove('visible'); toastTimer = 0;
  if (game.story && showIntro) $('story-intro').showModal(); else begin();
  updateHUD();
}
function begin() {
  closeDialogs(); input.clear(); clock.reset(); previousTime = performance.now();
  game.start(); canvas.focus(); audio.unlock();
  if (!game.story) showToast(mode === 'daily' ? `Ruta diaria · ${game.world.seed.slice(-10)} UTC` : 'Salta. Sigue la curva. Busca el impulso.');
}
function togglePause() {
  if ($('journal-dialog').open || $('story-intro').open) return;
  if (game.state === 'running') {
    game.pause(); input.clear(); clock.reset(); $('pause-dialog').showModal();
  } else if (game.state === 'paused') {
    game.resume(); closeDialogs(); input.clear(); clock.reset(); previousTime = performance.now(); canvas.focus();
  }
}
function menu() {
  closeDialogs(); game = new Game(mode); input.clear(); clock.reset(); renderer.reset();
  $('menu').hidden = false; for (const id of ['hud', 'telemetry', 'touch-controls']) $(id).hidden = true;
  $('story-panel').hidden = true;
  $('toast').classList.remove('visible'); document.body.classList.remove('playing', 'story-playing'); refreshBest(); $('start').focus();
}
function openJournal() {
  if (!game.story || game.state !== 'running') return;
  game.pause(); input.clear(); clock.reset();
  $('journal-entries').replaceChildren();
  for (const entry of game.story.journal) {
    const section = document.createElement('section'), title = document.createElement('h3'), text = document.createElement('p');
    title.textContent = entry.title; text.textContent = entry.text; section.append(title, text); $('journal-entries').append(section);
  }
  $('journal-empty').hidden = game.story.clueFound;
  $('journal-help').hidden = !game.story.clueFound; $('journal-help').open = false;
  $('journal-dialog').showModal();
}
function closeJournal() {
  $('journal-dialog').close(); input.clear(); clock.reset(); previousTime = performance.now();
  game.resume(); canvas.focus();
}
function finish() {
  const saved = saveRecord(storage, profile, recordKey(), Math.floor(game.score), game.time);
  $('result-score').textContent = Math.floor(game.score).toLocaleString('es'); $('result-time').textContent = formatTime(game.time);
  $('result-combo').textContent = `×${game.bestCombo}`; $('result-hits').textContent = game.hits;
  $('record-note').textContent = saved ? `${game.assist ? 'Marca de práctica' : 'Marca'} guardada en este navegador.` : 'Partida completada. Este navegador no permite guardar la marca.';
  $('result-title').textContent = game.story ? 'Ella sigue aquí.' : 'Flow found.';
  $('result-label').textContent = game.story ? 'LA HUELLA · COMPLETADA' : 'RUTA COMPLETADA';
  $('story-result').hidden = !game.story;
  $('again').firstChild.textContent = game.story ? 'VOLVER A LA HUELLA ' : 'OTRA TRAYECTORIA ';
  input.clear(); $('result-dialog').showModal();
}
function updateHUD() {
  $('mode-label').textContent = game.story ? 'ECOS DE TI / LA HUELLA' : `${MODES[mode].name} / ${CHAPTERS[Math.floor(game.sector / 10) % 10]}`;
  $('sector').firstChild.textContent = String(game.sector + 1).padStart(2, '0'); $('sector').lastElementChild.textContent = ` / ${game.world.sectors}`;
  $('score').textContent = String(Math.floor(game.score)).padStart(6, '0'); $('time').textContent = formatTime(game.time);
  $('health').textContent = '● '.repeat(game.player.hp) + '○ '.repeat(3 - game.player.hp);
  $('speed').textContent = Math.round(Math.hypot(game.player.vx, game.player.vy)); $('combo').textContent = `×${game.combo}`;
  $('progress').style.width = `${Math.min(100, game.maxX / game.world.length * 100)}%`;
  $('dash-bar').style.width = `${Math.max(0, 1 - game.player.dashCooldown / B.dashCooldown) * 100}%`;
  $('dash-label').textContent = game.player.dashCooldown ? 'RECARGANDO' : 'DASH LISTO';
  if (game.story) {
    const story = game.story;
    if ($('story-objective').textContent !== story.status) $('story-objective').textContent = story.status;
    $('memory-progress').textContent = story.gateOpen ? '1 → 3 → 2 · PUERTA ABIERTA' : `${story.puzzle.sequence.map((pad, i) => i < story.puzzle.progress ? pad : '·').join(' → ')} · ${story.puzzle.progress}/3`;
    $('journal-open').textContent = `ECOS ${story.journal.length} · E`;
  }
  // Read-only state supports local browser regression checks; it cannot mutate the game.
  window.depth = Object.freeze({ snapshot: () => ({ state: game.state, mode: game.mode, x: game.player.x, y: game.player.y, hp: game.player.hp,
    score: game.score, time: game.time, sector: game.sector, seed: game.world.seed, bullets: game.bullets.length, combo: game.combo,
    story: game.story ? { clueFound: game.story.clueFound, progress: game.story.puzzle.progress, gateOpen: game.story.gateOpen, echoFound: game.story.echoFound } : null }) });
}
for (const id of ['start', 'restart', 'again']) $(id).addEventListener('click', () => start(id === 'start'));
for (const id of ['pause', 'resume']) $(id).addEventListener('click', togglePause);
for (const id of ['quit', 'result-menu']) $(id).addEventListener('click', menu);
$('pause-dialog').addEventListener('cancel', event => { event.preventDefault(); togglePause(); });
$('result-dialog').addEventListener('cancel', event => { event.preventDefault(); menu(); });
$('story-introduction').textContent = STORY.introduction;
$('story-farewell').textContent = STORY.farewell;
$('result-echo').textContent = STORY.echo;
$('result-epilogue').textContent = STORY.epilogue;
$('result-next').textContent = STORY.next;
$('story-begin').addEventListener('click', begin);
$('story-back').addEventListener('click', menu);
$('story-intro').addEventListener('cancel', event => { event.preventDefault(); menu(); });
$('journal-open').addEventListener('click', openJournal);
$('journal-close').addEventListener('click', closeJournal);
$('journal-dialog').addEventListener('cancel', event => { event.preventDefault(); closeJournal(); });
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
