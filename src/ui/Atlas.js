import { WORLDS, CHARACTERS, ABILITIES, OBSTACLES, REWARDS, CHAPTER_CATALOG } from '../content/Catalog.js';
import { MEMORIES } from '../content/Memories.js';
import { earnedRewards } from '../core/History.js';
export function element(tag, text, className = '') {
  const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node;
}
export function renderAtlas(container, progress, chooseWorld) {
  container.replaceChildren();
  const badges = earnedRewards(progress), grid = element('div', undefined, 'atlas-grid');
  for (const [index, world] of WORLDS.entries()) {
    const card = element('section', undefined, 'world-card'); card.style.setProperty('--world-accent', world.accent);
    card.append(element('p', `MUNDO ${index + 1} / CÁMARAS ${world.levels.join('–')}`, 'eyebrow'), element('h3', world.name),
      element('p', world.premise), element('p', world.objective, 'world-objective'),
      element('p', world.chapters.map(ch => CHAPTER_CATALOG[ch].name).join(' → '), 'mini-label'));
    const badge = badges[index]; card.append(element('p', `${badge.earned ? '★' : '☆'} ${badge.name} · ${badge.completed}/20`, 'badge-line'));
    const play = element('button', 'EXPLORAR ESTE MUNDO', 'secondary'); play.addEventListener('click', () => chooseWorld(world.id)); card.append(play); grid.append(card);
  }
  container.append(grid);
  const archive = element('section', undefined, 'atlas-section'); archive.append(element('h3', `Ecos conservados · ${progress.memories?.length || 0}/20`), element('p', 'Recoge fragmentos y completa la cámara para conservar escenas de Luma. También puedes encontrarlas en expediciones de mundos.'));
  for (const memory of MEMORIES) { const known = progress.memories?.includes(memory.id), item = element('details'); item.append(element('summary', known ? memory.title : `○ Eco por descubrir · ${WORLDS.find(w => w.id === memory.worldId).name}`), element('p', known ? memory.text : 'Este recuerdo espera en un fragmento opcional.')); archive.append(item); }
  container.append(archive);
  for (const [title, rows, description] of [
    ['Quienes dejan huellas', CHARACTERS, row => `${row.role}. ${row.story} Señal: ${row.signature}.`],
    ['Capacidades', ABILITIES, row => `${row.key} · ${row.description}${row.cooldown ? ` Recarga: ${row.cooldown} s.` : ''}`],
    ['Leer el peligro', OBSTACLES, row => `${row.description} ${row.response}.`],
    ['Lo que te llevas', REWARDS, row => `${row.description}${row.points ? ` Valor base: ${row.points} puntos × combo.` : ''}`],
  ]) {
    const section = element('section', undefined, 'atlas-section'); section.append(element('h3', title));
    for (const row of rows) { const item = element('details'); item.append(element('summary', row.name), element('p', description(row))); section.append(item); }
    container.append(section);
  }
}
export function renderHistory(container, progress, replay) {
  container.replaceChildren(); const rows = [...(progress.history || [])].reverse();
  const completed = rows.filter(r => r.outcome === 'completed').length;
  container.append(element('p', `${rows.length}/200 intentos conservados · ${completed} completados · ${Math.floor(rows.reduce((sum,r) => sum + r.time, 0) / 60)} minutos registrados.`));
  if (!rows.length) { container.append(element('p', 'Tu primera ruta empieza aquí. Las partidas se registran al completar, reiniciar o volver al menú.')); return; }
  const labels = { completed: 'Completado', restarted: 'Reiniciado', abandoned: 'Menú' };
  for (const row of rows) {
    const item = element('details', undefined, 'history-row'), world = WORLDS.find(w => w.id === row.worldId);
    item.append(element('summary', `${labels[row.outcome]} · ${world?.name || row.mode.toUpperCase()} / ${row.level} · ${Math.floor(row.score).toLocaleString('es')} pts`));
    item.append(element('p', `${new Date(row.at).toLocaleString('es')} · ${row.time.toFixed(1)} s · ${row.hits} impactos · ${row.mistakes} errores · ${row.abilityUses} capacidades · ${row.practice ? 'Práctica' : 'Estándar'}`));
    if (row.mode === 'story' || row.mode === 'expedition') {
      item.append(element('p', `v${row.generatorVersion} · ${row.seed} · ${'★'.repeat(row.stars) || 'Sin estrellas'}${row.mode === 'expedition' ? ` · Intensidad ${row.intensity} · ${row.length || 'Abismo'}` : ''}`, 'route-code'));
      const button = element('button', 'VOLVER A JUGAR', 'secondary'); button.addEventListener('click', () => replay(row)); item.append(button);
    }
    container.append(item);
  }
}
