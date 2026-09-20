import { Game } from './core/Game.js';
import { FixedClock } from './core/Time.js';
import { Input } from './core/Input.js';
import { Renderer } from './render/Renderer.js';
import { Audio } from './audio/Audio.js';
import { loadProfile, saveRecord } from './core/Storage.js';
import { loadProgress, saveProgress, completeLevel, mergeProgress, stars } from './core/Progress.js';
import { recordAttempt, earnedRewards } from './core/History.js';
import { SCORE_LABELS } from './core/Score.js';
import { WORLDS, worldForChapter } from './content/Catalog.js';
import { renderAtlas, renderHistory, element } from './ui/Atlas.js';
import { normalizeRequest } from './generation/Generator.js';
import { MODES, CHAPTERS, BALANCE as B } from './config/balance.js';
import { STORY, STORY_CHAPTERS } from './story/StoryData.js';
import { LEVEL_NAMES } from './story/LevelNames.js';
import { challengeSeed, normalizeSeed, getLevelSpec, nextLevel, pulseIsOpen, TOTAL_LEVELS } from './story/Campaign.js';
const $ = id => document.getElementById(id);
const canvas = $('game'), renderer = new Renderer(canvas), clock = new FixedClock(), audio = new Audio();
let storage;
try { storage = localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; }
const profile = loadProfile(storage);
let journey = loadProgress(storage, profile);
let mode = 'story', game = new Game(mode, undefined, false, { level: journey.selected });
let preparedRoute = null;
let toastTimer = 0, previousTime = performance.now(), hudTimer = 0, lockedAutoRun = false;
const input = new Input(canvas, togglePause, () => { if (game.state === 'running') restart(); }, openJournal);
const isNarrative = value => value === 'story' || value === 'expedition';
const formatTime = time => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}.${String(Math.floor(time * 100) % 100).padStart(2, '0')}`;
const recordKey = () => `${game.mode}:${game.story?.spec.id || game.world.seed}:${game.assist ? 'practice' : 'standard'}:${lockedAutoRun ? 'auto' : 'manual'}`;
function showToast(text) { $('toast').textContent = text; $('toast').classList.add('visible'); toastTimer = 3.5; }
function persist() {
  const saved = saveProgress(storage, journey);
  if (!saved) $('save-status').textContent = 'El navegador no permite guardar. Exporta tu progreso antes de cerrar.';
  return saved;
}
function menuOptions() {
  return mode === 'story' ? { level: Number($('level-select').value) || journey.selected } :
    { level: 1, seed: normalizeSeed($('exp-seed').value), intensity: Number($('exp-intensity').value), length: Number($('exp-length').value), generatorVersion: Number($('exp-version').value), worldId: $('exp-world').value || null };
}
function refreshBest() {
  const options = menuOptions(), preview = new Game(mode, options.seed, $('assist').checked, options);
  const key = `${mode}:${preview.story?.spec.id || preview.world.seed}:${preview.assist ? 'practice' : 'standard'}:${!isNarrative(mode) && $('autorun').checked ? 'auto' : 'manual'}`;
  const best = profile.records[key]; $('best').textContent = best ? Math.floor(best.score).toLocaleString('es') : '—';
  if (mode === 'story') {
    const spec = preview.story.spec;
    $('selected-chapter').textContent = `CAPÍTULO ${spec.chapter + 1} · ${spec.chapterTitle} · ${spec.rules.name}`;
    $('mode-description').textContent = `${spec.title} · Tiempo objetivo ${formatTime(spec.par)}. Completar, resolver sin errores y encontrar la reliquia dan una estrella cada uno.`;
  }
}
function refreshJourney() {
  $('level-select').replaceChildren();
  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    const option = document.createElement('option'); option.value = level;
    option.textContent = `${String(level).padStart(3, '0')} · ${LEVEL_NAMES[level - 1]}${level > journey.unlocked ? ' · Bloqueado' : ` · ${'★'.repeat(stars(journey.records[level]))}`}`;
    option.disabled = level > journey.unlocked; $('level-select').append(option);
  }
  $('level-select').value = journey.selected;
  const completed = Object.keys(journey.records).length, totalStars = Object.values(journey.records).reduce((sum, r) => sum + stars(r), 0);
  $('journey-summary').textContent = `${completed}/100 cámaras · ${totalStars}/300 estrellas`;
  $('exp-resume').hidden = !journey.expedition;
  if (journey.expedition) $('exp-resume').textContent = `CONTINUAR ${journey.expedition.seed} · CÁMARA ${journey.expedition.level}`;
}
function selectMode(value) {
  mode = value;
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('mode-description').textContent = MODES[mode].description; $('start').firstChild.textContent = `INICIAR ${MODES[mode].name} `;
  $('autorun').disabled = isNarrative(mode); $('movement-note').hidden = !isNarrative(mode);
  $('journey-controls').hidden = mode !== 'story'; $('expedition-controls').hidden = mode !== 'expedition';
  refreshBest();
}
function closeDialogs() {
  for (const id of ['pause-dialog', 'result-dialog', 'story-intro', 'journal-dialog', 'map-dialog', 'atlas-dialog', 'history-dialog']) if ($(id).open) $(id).close();
}
function start(showIntro = true, options = menuOptions()) {
  closeDialogs(); input.clear(); clock.reset(); renderer.reset();
  game = new Game(mode, options.seed, $('assist').checked, options); lockedAutoRun = !isNarrative(mode) && $('autorun').checked;
  if (mode === 'story') journey.selected = game.story.spec.level;
  if (mode === 'expedition') journey.expedition = expeditionCheckpoint(game.story.spec);
  if (game.story) persist();
  $('menu').hidden = true; for (const id of ['hud', 'telemetry', 'touch-controls']) $(id).hidden = false;
  $('story-panel').hidden = !game.story;
  document.querySelector('[data-control="shoot"]').hidden = !!game.story;
  document.querySelector('[data-control="swap"]').hidden = !game.story?.allowSwap;
  $('ability-use').hidden = !game.world.abilitiesEnabled;
  document.querySelector('[data-control="ability"]').hidden = !game.world.abilitiesEnabled;
  $('swap-character').hidden = !game.story?.allowSwap;
  document.body.classList.toggle('story-playing', !!game.story);
  document.body.classList.add('playing'); canvas.tabIndex = -1; canvas.focus(); audio.unlock();
  $('toast').classList.remove('visible'); toastTimer = 0;
  if (game.story && showIntro) {
    const spec = game.story.spec;
    $('story-title').textContent = spec.title;
    $('story-intro-label').textContent = `${spec.mode === 'story' ? 'ECOS DE TI' : spec.seed} / ${String(spec.level).padStart(3, '0')}`;
    $('story-introduction').textContent = spec.introduction;
    $('story-farewell').textContent = spec.level === 1 && mode === 'story' ? STORY.farewell : spec.echo;
    $('story-rule').textContent = `Regla: ${spec.rules.name}. Busca la huella y consulta ECOS. ${spec.rules.memorySeconds ? `Cada paso debe llegar antes de ${spec.rules.memorySeconds.toFixed(0)} s; los bloques completos se conservan.` : 'No hay límite para completar la cámara.'}`;
    $('story-intro').showModal();
  } else begin();
  updateHUD();
}
function expeditionCheckpoint(spec, level = spec.level) { return { level, seed: spec.seed, intensity: spec.intensity, length: spec.runLength, generatorVersion: spec.generatorVersion || 4, worldId: spec.worldChoice || null }; }
function restart() {
  if (recordAttempt(journey, game, 'restarted')) persist();
  const spec = game.story?.spec;
  start(false, spec ? { ...expeditionCheckpoint(spec), level: spec.level } : {});
}
function begin() {
  closeDialogs(); input.clear(); clock.reset(); previousTime = performance.now(); game.start(); canvas.focus(); audio.unlock();
  if (!game.story) showToast(mode === 'daily' ? `Ruta diaria · ${game.world.seed.slice(-10)} UTC` : 'Salta. Sigue la curva. Busca el impulso.');
}
function togglePause() {
  if ($('journal-dialog').open || $('story-intro').open) return;
  if (game.state === 'running') { game.pause(); input.clear(); clock.reset(); $('pause-dialog').showModal(); }
  else if (game.state === 'paused') { game.resume(); closeDialogs(); input.clear(); clock.reset(); previousTime = performance.now(); canvas.focus(); }
}
function menu() {
  if (recordAttempt(journey, game, 'abandoned')) persist();
  closeDialogs(); input.clear(); clock.reset(); renderer.reset(); refreshJourney();
  game = new Game(mode, undefined, false, mode === 'story' ? { level: journey.selected } : {});
  $('menu').hidden = false; for (const id of ['hud', 'telemetry', 'touch-controls', 'story-panel']) $(id).hidden = true;
  $('toast').classList.remove('visible'); document.body.classList.remove('playing', 'story-playing'); selectMode(mode); $('start').focus();
}
function openJournal() {
  if (!game.story || game.state !== 'running') return;
  game.pause(); input.clear(); clock.reset(); $('journal-entries').replaceChildren();
  for (const entry of game.story.journal) {
    const section = document.createElement('section'), title = document.createElement('h3'), text = document.createElement('p');
    title.textContent = entry.title; text.textContent = entry.text; section.append(title, text); $('journal-entries').append(section);
  }
  $('journal-empty').hidden = game.story.clueFound;
  $('journal-help').hidden = !game.story.clueFound; $('journal-help').open = false;
  $('journal-solution').textContent = game.story.spec.help;
  $('journal-dialog').showModal();
}
function closeJournal() {
  $('journal-dialog').close(); input.clear(); clock.reset(); previousTime = performance.now(); game.resume(); canvas.focus();
}
function finish() {
  const previousBadges = new Set(earnedRewards(journey).filter(r => r.earned).map(r => r.id));
  recordAttempt(journey, game, 'completed');
  const saved = saveRecord(storage, profile, recordKey(), Math.floor(game.score), game.time);
  $('result-score').textContent = Math.floor(game.score).toLocaleString('es'); $('result-time').textContent = formatTime(game.time);
  $('result-combo').textContent = `×${game.bestCombo}`; $('result-hits').textContent = game.hits;
  $('story-result').hidden = !game.story; $('next-level').hidden = true;
  let progressSaved = persist();
  if (game.story) {
    const spec = game.story.spec, result = completeLevel(journey, game), next = nextLevel(spec);
    if (mode === 'expedition') journey.expedition = next ? expeditionCheckpoint(spec, next) : null;
    progressSaved = persist();
    $('result-label').textContent = `${spec.mode === 'story' ? spec.chapterTitle : spec.seed} · ${String(spec.level).padStart(3, '0')}`;
    const ending = mode === 'story' && !next;
    $('result-title').textContent = ending ? 'Nadie despierta solo.' : 'Un recuerdo más.';
    $('result-echo').textContent = spec.echo;
    $('result-epilogue').textContent = ending ? 'Nox sostiene la salida. Luma cruza por decisión propia. Su anillo sigue abierto: ahora es el lugar por donde entran las sorpresas. En la superficie dibujan un nuevo infinito y prometen volver por quienes siguen dentro.' : `${spec.title}: la puerta queda abierta. ${next ? 'Tu avance está listo para la siguiente cámara.' : 'Expedición completada. Puedes repetir el código o descubrir otra ruta.'}`;
    $('result-stars').textContent = `${'★'.repeat(stars(result))}${'☆'.repeat(3 - stars(result))}`;
    $('result-goals').textContent = `✓ Cámara completada · ${result.clean ? '✓' : '○'} Sin errores ni daño (estándar) · ${result.relic ? '✓' : '○'} Reliquia · ${game.time <= spec.par ? '✓' : '○'} Tiempo objetivo ${formatTime(spec.par)}. Errores: ${game.story.puzzle.mistakes}.`;
    $('next-level').hidden = !next;
    if (next) $('next-level').firstChild.textContent = `SIGUIENTE CÁMARA · ${String(next).padStart(3, '0')} `;
    $('again').firstChild.textContent = 'REPETIR Y MEJORAR ';
  } else {
    $('result-title').textContent = 'Flow found.'; $('result-label').textContent = 'RUTA COMPLETADA'; $('again').firstChild.textContent = 'OTRA TRAYECTORIA ';
  }
  const newBadges = earnedRewards(journey).filter(r => r.earned && !previousBadges.has(r.id));
  $('reward-note').textContent = newBadges.map(r => `★ Insignia obtenida: ${r.name}`).join(' · ');
  $('score-breakdown').replaceChildren();
  for (const [key, label] of Object.entries(SCORE_LABELS)) { $('score-breakdown').append(element('dt', label), element('dd', game.scoreLedger[key].toFixed(1))); }
  $('record-note').textContent = saved && progressSaved ? 'Avance y marcas guardados en este navegador.' : 'No se pudo guardar todo. Exporta el progreso desde el menú antes de cerrar.';
  input.clear(); $('result-dialog').showModal();
}
function updateHUD() {
  const story = game.story, spec = story?.spec;
  $('mode-label').textContent = spec ? `${spec.worldName || worldForChapter(spec.chapter).name} / ${spec.chapter + 1}` : `${MODES[mode].name} / ${CHAPTERS[Math.floor(game.sector / 10) % 10]}`;
  $('sector').firstChild.textContent = String(spec?.level || game.sector + 1).padStart(2, '0');
  $('sector').lastElementChild.textContent = ` / ${spec ? spec.mode === 'story' ? TOTAL_LEVELS : spec.runLength || '100k' : game.world.sectors}`;
  $('score').textContent = String(Math.floor(game.score)).padStart(6, '0'); $('time').textContent = formatTime(game.time);
  $('health').textContent = '● '.repeat(game.player.hp) + '○ '.repeat(3 - game.player.hp);
  $('speed').textContent = Math.round(Math.hypot(game.player.vx, game.player.vy)); $('combo').textContent = `×${game.combo}`;
  $('progress').style.width = `${Math.min(100, game.maxX / game.world.length * 100)}%`;
  $('dash-bar').style.width = `${Math.max(0, 1 - game.player.dashCooldown / B.dashCooldown) * 100}%`;
  $('dash-label').textContent = game.player.dashCooldown ? 'RECARGANDO' : 'DASH LISTO';
  if (story) {
    const cooldown = game.player.abilityCooldown;
    $('ability-use').textContent = `${game.activeCharacter === 'luma' ? 'VELO' : 'ANCLA'} · ${cooldown > 0 ? cooldown.toFixed(1) + ' s' : 'F'}`;
    $('ability-use').disabled = cooldown > 0;
    if ($('story-objective').textContent !== story.status) $('story-objective').textContent = story.status;
    const total = spec.rules.kind === 'switch' ? spec.rules.count : story.puzzle.sequence.length;
    $('memory-progress').textContent = story.gateOpen ? 'PUERTA ABIERTA' : `${spec.rules.name.toUpperCase()} · ${story.puzzle.progress}/${total}${story.puzzle.checkpoint ? ` · BLOQUE ${story.puzzle.checkpoint}` : ''}`;
    $('rule-detail').textContent = story.describeNext();
    $('journal-open').textContent = `ECOS ${story.journal.length} · E`;
    $('swap-character').textContent = `${game.activeCharacter === 'luma' ? 'LUMA' : 'NOX'} · Q ⇄`;
    const rhythm = spec.rules.steps.some(s => s.pulse);
    $('rhythm-status').hidden = !rhythm || story.gateOpen;
    if (rhythm) {
      const open = pulseIsOpen(game.time, spec.rules), phase = game.time % spec.rules.pulsePeriod;
      $('rhythm-status').textContent = `${open ? '○ SILENCIO ABIERTO' : '● MELODÍA ACTIVA'} · ${(open ? spec.rules.pulseOpen - phase : spec.rules.pulsePeriod - phase).toFixed(1)} s`;
      $('rhythm-status').classList.toggle('open', open);
    }
    $('memory-timer').hidden = !story.puzzle.remaining;
    $('memory-timer').textContent = `Próximo recuerdo antes de ${story.puzzle.remaining.toFixed(1)} s`;
  }
}
// Snapshot is read-only; it contains no way to mutate or solve a level.
window.depth = Object.freeze({ snapshot: () => ({ state: game.state, mode: game.mode, x: game.player.x, y: game.player.y,
  hp: game.player.hp, score: game.score, time: game.time, sector: game.sector, seed: game.world.seed,
  abilityUses: game.abilityUses, worldId: game.story?.spec.worldId || null, generatorVersion: game.story?.spec.generatorVersion || 4,
  bullets: game.bullets.length, combo: game.combo, character: game.activeCharacter,
  story: game.story ? { level: game.story.spec.level, kind: game.story.spec.rules.kind, clueFound: game.story.clueFound,
    progress: game.story.puzzle.progress, gateOpen: game.story.gateOpen, echoFound: game.story.echoFound, mistakes: game.story.puzzle.mistakes } : null }) });
function showMap() {
  $('map-chapters').replaceChildren();
  STORY_CHAPTERS.forEach((name, chapter) => {
    const section = document.createElement('section'), heading = document.createElement('h3'), grid = document.createElement('div');
    heading.textContent = `${String(chapter + 1).padStart(2, '0')} · ${name}`; grid.className = 'level-grid';
    for (let i = 0; i < 10; i++) {
      const level = chapter * 10 + i + 1, button = document.createElement('button');
      button.disabled = level > journey.unlocked; button.textContent = `${String(level).padStart(3, '0')} ${'★'.repeat(stars(journey.records[level]))}`;
      button.setAttribute('aria-label', `${level}: ${LEVEL_NAMES[level - 1]}, ${stars(journey.records[level])} estrellas`);
      button.addEventListener('click', () => { journey.selected = level; persist(); refreshJourney(); selectMode('story'); $('map-dialog').close(); $('start').focus(); });
      grid.append(button);
    }
    if (chapter % 2 === 0) { const world = worldForChapter(chapter); $('map-chapters').append(element('h3', `${chapter / 2 + 1}. ${world.name}`, 'map-world'), element('p', world.objective)); }
    section.append(heading, grid);
    if (journey.records[(chapter + 1) * 10]) { const echo = document.createElement('p'); echo.textContent = getLevelSpec('story', { level: (chapter + 1) * 10 }).echo; section.append(echo); }
    $('map-chapters').append(section);
  });
  $('map-dialog').showModal();
}
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => selectMode(button.dataset.mode)));
$('level-select').addEventListener('change', () => { journey.selected = Number($('level-select').value); persist(); refreshBest(); });
for (const id of ['assist', 'autorun', 'exp-intensity', 'exp-length', 'exp-seed', 'exp-world', 'exp-version']) $(id).addEventListener('change', () => {
  $('exp-world').disabled = $('exp-version').value === '4'; if ($('exp-world').disabled) $('exp-world').value = '';
  clearPrepared(); refreshBest();
});
for (const world of WORLDS) { const option = element('option', world.name); option.value = world.id; $('exp-world').append(option); }
$('exp-seed').value = challengeSeed();
for (const period of ['daily', 'weekly']) $(`exp-${period}`).addEventListener('click', () => { $('exp-seed').value = challengeSeed(period); clearPrepared(); refreshBest(); });
$('exp-new').addEventListener('click', () => { $('exp-seed').value = `ECO-${Math.random().toString(36).slice(2, 10).toUpperCase()}`; clearPrepared(); refreshBest(); });
$('exp-resume').addEventListener('click', () => { const run = { ...journey.expedition }; $('exp-seed').value = run.seed; $('exp-intensity').value = run.intensity; $('exp-length').value = run.length; $('exp-version').value = run.generatorVersion || 4; $('exp-world').value = run.worldId || ''; $('exp-world').disabled = $('exp-version').value === '4'; clearPrepared(); start(true, run); });
$('map-open').addEventListener('click', showMap); $('map-close').addEventListener('click', () => $('map-dialog').close());
$('export-progress').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(journey, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'depth-progreso.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); $('save-status').textContent = 'Copia preparada. Guárdala para conservar tus recuerdos.';
});
$('import-progress').addEventListener('click', () => $('progress-file').click());
$('progress-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 1000000) throw new Error('El archivo es demasiado grande.');
    journey = mergeProgress(journey, JSON.parse(await file.text()));
    const saved = persist(); refreshJourney(); refreshBest();
    $('save-status').textContent = saved ? 'Progreso combinado. Conservamos tus mejores logros.' : 'Progreso cargado solo para esta sesión. Exporta antes de cerrar.';
  } catch { $('save-status').textContent = 'No se pudo leer esa copia. Tu progreso anterior sigue intacto.'; }
  event.target.value = '';
});
$('reduced').checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('reduced').addEventListener('change', () => { renderer.reduced = $('reduced').checked; renderer.trail = []; renderer.particles = []; });
renderer.reduced = $('reduced').checked;
$('start').addEventListener('click', () => start());
for (const id of ['restart', 'again']) $(id).addEventListener('click', restart);
$('next-level').addEventListener('click', () => {
  const spec = game.story.spec, next = nextLevel(spec); if (!next) return;
  const options = { ...expeditionCheckpoint(spec, next) }, nextSpec = getLevelSpec(mode, options);
  start(nextSpec.chapter !== spec.chapter, options);
});
for (const id of ['pause', 'resume']) $(id).addEventListener('click', togglePause);
for (const id of ['quit', 'result-menu', 'story-back']) $(id).addEventListener('click', menu);
$('pause-dialog').addEventListener('cancel', event => { event.preventDefault(); togglePause(); });
for (const id of ['result-dialog', 'story-intro']) $(id).addEventListener('cancel', event => { event.preventDefault(); menu(); });
$('story-begin').addEventListener('click', begin);
$('journal-open').addEventListener('click', openJournal); $('journal-close').addEventListener('click', closeJournal);
$('journal-dialog').addEventListener('cancel', event => { event.preventDefault(); closeJournal(); });
$('swap-character').addEventListener('click', () => { if (game.state === 'running') input.actions.add('swap'); canvas.focus(); });
$('ability-use').addEventListener('click', () => { if (game.state === 'running') input.actions.add('ability'); canvas.focus(); });
$('sound').addEventListener('click', () => {
  audio.enabled = !audio.enabled; $('sound').setAttribute('aria-pressed', String(audio.enabled));
  $('sound').setAttribute('aria-label', `Sonido ${audio.enabled ? 'activado' : 'desactivado'}`); $('sound').lastElementChild.textContent = audio.enabled ? 'ON' : 'OFF';
  if (audio.enabled) audio.unlock();
});
$('fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { showToast('Pantalla completa no disponible en este navegador.'); }
});
function clearPrepared() {
  preparedRoute = null; $('generated-status').textContent = ''; $('play-generated').hidden = true; $('download-generated').hidden = true;
}
$('atlas-open').addEventListener('click', () => {
  renderAtlas($('atlas-content'), journey, worldId => {
    $('exp-world').value = worldId; $('exp-version').value = '5'; $('exp-world').disabled = false; clearPrepared();
    selectMode('expedition'); $('atlas-dialog').close(); $('exp-intensity').focus();
  }); $('atlas-dialog').showModal();
});
$('history-open').addEventListener('click', () => {
  renderHistory($('history-content'), journey, row => {
    selectMode(row.mode); $('assist').checked = row.practice;
    start(true, { level: row.level, seed: row.seed, intensity: row.intensity, length: row.length, generatorVersion: row.generatorVersion, worldId: row.worldChoice });
  }); $('history-dialog').showModal();
});
for (const name of ['atlas','history']) $(`${name}-close`).addEventListener('click', () => $(`${name}-dialog`).close());
$('generate-route').addEventListener('click', async () => {
  const options = normalizeRequest({ mode: 'expedition', ...menuOptions() }), requested = JSON.stringify(options);
  clearPrepared(); $('generate-route').disabled = true; $('generated-status').textContent = 'Preparando la cámara…';
  try {
    const response = await fetch('/api/v1/levels/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requested, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Generador no disponible');
    const envelope = await response.json(), params = normalizeRequest(envelope.parameters);
    if (JSON.stringify(normalizeRequest({ mode: 'expedition', ...menuOptions() })) !== requested) return;
    const local = new Game(params.mode, params.seed, false, params);
    if (JSON.stringify(params) !== requested || JSON.stringify(local.world) !== JSON.stringify(envelope.world)) throw new Error('La versión del servidor y del juego no coincide');
    preparedRoute = envelope;
    $('generated-status').textContent = `${envelope.id} · ${local.world.levelInfo.worldName || worldForChapter(local.world.levelInfo.chapter).name} · ${local.story.spec.rules.name} · ${local.world.platforms.length} plataformas. Estructura comprobada.`;
    $('play-generated').hidden = false; $('download-generated').hidden = false;
  } catch { $('generated-status').textContent = 'No se pudo preparar la ruta en el servidor. Con npm start se habilita esta función; INICIAR EXPEDICIÓN también genera la ruta en tu navegador.'; }
  finally { $('generate-route').disabled = false; }
});
$('play-generated').addEventListener('click', () => { if (preparedRoute) { selectMode('expedition'); start(true, preparedRoute.parameters); } });
$('download-generated').addEventListener('click', () => {
  if (!preparedRoute) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(preparedRoute, null, 2)], { type: 'application/json' }));
  const link = element('a'); link.href = url; link.download = `depth-ruta-v${preparedRoute.generatorVersion}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
function autoPause() { if (game.state === 'running') togglePause(); input.clear(); }
addEventListener('blur', autoPause); document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
function frame(now) {
  const dt = Math.min((now - previousTime) / 1000, 0.1); previousTime = now;
  if (game.state === 'running') {
    clock.advance(dt, step => {
      game.step(step, { ...input.read(renderer), autoRun: lockedAutoRun }); renderer.effects(game.events);
      for (const event of game.events) {
        audio.play(event.type, game.combo); if (event.text) showToast(event.text);
        if (event.type === 'boost') showToast('IMPULSO · conserva el momentum');
        if (event.type === 'gravity') showToast('GRAVEDAD LIGERA · 5 segundos');
        if (event.type === 'shield') showToast(game.player.shield ? 'ESCUDO ACTIVADO' : 'ESCUDO ABSORBIDO');
        if (event.type === 'energy') showToast('ENERGÍA · 3 segundos menos de recarga');
        if (event.type === 'relic') showToast('RELIQUIA RECUPERADA · completa la cámara para guardarla');
        if (event.type === 'finish') finish();
      }
    });
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('visible'); }
  } else clock.reset();
  renderer.draw(game, game.state === 'running' ? dt : 0);
  hudTimer += dt; if (hudTimer >= 0.05) { updateHUD(); hudTimer = 0; }
  requestAnimationFrame(frame);
}
refreshJourney(); selectMode(mode); updateHUD(); requestAnimationFrame(frame);
