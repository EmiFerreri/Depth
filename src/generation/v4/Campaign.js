import { seededRandom } from '../../world/ChunkGenerator.js';
import { STORY, STORY_CHAPTERS } from '../../story/StoryData.js';
import { LEVEL_NAMES } from '../../story/LevelNames.js';
export const CAMPAIGN_VERSION = 4;
export const TOTAL_LEVELS = 100;
export const RULE_NAMES = ['Recuerdos', 'Espejo', 'Dirección', 'Voces auténticas', 'Quietud', 'Archivo', 'Cooperación', 'Interruptores', 'Silencio', 'Despertar'];
export const CHAPTER_ECHOES = [STORY.echo,
  'Recuerdo nuestra casa. No recuerdo por qué ahora me da miedo.',
  'Mi mente olvidó tu nombre. Mi cuerpo todavía sabe bailar contigo.',
  'Cuando parezca demasiado perfecto… no soy yo.',
  'Tengo miedo de recordar. También tengo miedo de no hacerlo.',
  'Yo escuché tu voz diciendo que no me querías. Ahora veo que tú no estabas allí.',
  'No puedo salir todavía. Pero puedo ayudarte a entrar.',
  'No busques a la que siempre te da la razón. Busca a la que todavía puede sorprenderte.',
  'Hay un silencio entre sus órdenes. Nos encontramos allí.',
  'Ya puedo escucharte. Ahora necesito escucharme a mí.'];
export const CHAPTER_INTROS = [STORY.introduction,
  'PRISMA ha reconstruido vuestra casa al revés. Luma señala las contradicciones: para deshacer una mentira hay que empezar por su final.',
  'Luma recuerda un baile. No basta con llegar al lugar correcto: importa desde qué lado os encontrabais.',
  'El jardín repite su voz. Busca los anillos abiertos. Los cerrados pertenecen a PRISMA, aunque lleven el mismo número.',
  'Cada recuerdo tiene un peso. Esta vez Luma necesita que te quedes. Aterriza y sostén la plataforma hasta que termine de iluminarse.',
  'El archivo está desordenado. Los números de las plataformas no indican cuándo pasó cada cosa. Sus horas sí.',
  'Luma ha encontrado una grieta en la hipnosis. Alterna entre ambos personajes: cada uno conserva su posición y puede activar sus propias huellas.',
  'La salida perfecta es una red de órdenes. Cada plataforma cambia su luz y la siguiente. Apaga la red para que Luma pueda decidir.',
  'La melodía tiene intervalos de silencio. Mira el pulso: solo durante la ventana abierta podrás restaurar un recuerdo.',
  'PRISMA mezcla sus últimas defensas. Combina dirección, quietud, silencio y la ayuda de Luma. No necesitas hacerlo perfecto para llegar a ella.'];
export function normalizeSeed(value = 'LUMA') {
  return String(value).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 48) || 'LUMA';
}
export function challengeSeed(period = 'daily', date = new Date()) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (period === 'weekly') utc.setUTCDate(utc.getUTCDate() - (utc.getUTCDay() + 6) % 7);
  return `${period === 'weekly' ? 'SEMANA' : 'DIA'}-${utc.toISOString().slice(0, 10)}`;
}
export function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function getLevelSpec(mode = 'story', options = {}) {
  const expedition = mode === 'expedition';
  const level = Math.max(1, Math.min(expedition ? 100000 : TOTAL_LEVELS, Math.floor(Number(options.level) || 1)));
  const intensity = expedition ? Math.max(1, Math.min(5, Math.floor(Number(options.intensity) || 1))) : 1;
  const runLength = expedition && [0, 12, 36].includes(options.length) ? options.length : 12;
  const seed = expedition ? normalizeSeed(options.seed) : 'ECOS-DE-TI';
  const chapter = expedition ? [...shuffle([...Array(9).keys()], seededRandom(`${seed}:deck:${Math.floor((level - 1) / 10)}`)), 9][(level - 1) % 10] : Math.floor((level - 1) / 10);
  const difficulty = expedition ? Math.min(1, (intensity - 1) * 0.2 + (level - 1) * 0.012) : (level - 1) / 99;
  const random = seededRandom(`${seed}:v${CAMPAIGN_VERSION}:${level}:${intensity}:${runLength}`);
  const count = 3 + Math.floor(difficulty * 2.99);
  const within = (level - 1) % 10;
  const length = 3 + Math.floor(difficulty * 3) + (within >= 3 ? 1 : 0) + (within >= 7 ? 1 : 0);
  const first = !expedition && level === 1;
  const kind = ['sequence', 'mirror', 'direction', 'truth', 'hold', 'archive', 'duet', 'switch', 'rhythm', 'synthesis'][chapter];
  const labels = shuffle(Array.from({ length: count }, (_, i) => i + 1), random);
  let sequence = first ? [1, 3, 2] : Array.from({ length }, (_, i) => labels[i % count]);
  const timestamps = shuffle(Array.from({ length: count }, (_, i) => 10 + i * 7), random);
  if (kind === 'archive') sequence = [...labels].sort((a, b) => timestamps[a - 1] - timestamps[b - 1]);
  if (kind === 'switch') sequence = labels.filter((_, i) => i < Math.max(2, count - 1)).sort((a, b) => a - b);
  const steps = sequence.map((pad, i) => ({ pad,
    direction: kind === 'direction' || (kind === 'synthesis' && i % 3 === 0) ? (i % 2 ? -1 : 1) : 0,
    hold: kind === 'hold' || (kind === 'synthesis' && i % 3 === 1) ? 0.75 + difficulty * 1.25 : 0,
    character: kind === 'duet' || kind === 'synthesis' ? (i % 2 ? 'luma' : 'nox') : null,
    pulse: kind === 'rhythm' || (kind === 'synthesis' && i % 3 === 2),
  }));
  const rules = { kind, name: RULE_NAMES[chapter], sequence, steps, count, timestamps,
    pulsePeriod: 4.8, pulseOpen: Math.max(1.6, 2.8 - difficulty * 1.2),
    checkpointEvery: length >= 6 && kind !== 'switch' ? 3 : 0,
    // Only advanced expeditions have a memory deadline; story can always be read calmly.
    memorySeconds: expedition && intensity >= 4 && kind !== 'hold' && kind !== 'switch' ? 30 - difficulty * 6 : 0 };
  const numbers = sequence.join(' → ');
  const directions = steps.map(s => `${s.pad}${s.direction > 0 ? ' desde izquierda' : s.direction < 0 ? ' desde derecha' : ''}${s.character ? ` (${s.character === 'nox' ? 'Nox' : 'Luma'})` : ''}${s.hold ? `, quietud ${s.hold.toFixed(1)} s` : ''}${s.pulse ? ', en silencio' : ''}`).join(' → ');
  const hints = {
    sequence: `Las luces recuerdan este orden: ${numbers}.`,
    mirror: `El espejo muestra ${[...sequence].reverse().join(' → ')}. Léelo desde el final hacia el principio.`,
    direction: `Cruza cada huella desde el lado que recuerda: ${directions}. Las flechas señalan tu dirección de movimiento al aterrizar.`,
    truth: `Sigue ${numbers}, pero solo sobre los anillos abiertos. Un anillo cerrado falsifica el recuerdo.`,
    hold: `Orden: ${numbers}. Quédate sobre cada huella ${steps[0].hold.toFixed(1)} segundos; moverte fuera interrumpe la carga.`,
    archive: 'Ordena los fragmentos por su hora, de la más temprana a la más tardía. El número es su nombre, no su fecha.',
    duet: `Cada huella necesita a quien la recuerda: ${directions}. Q o el botón CAMBIAR alternan entre Nox y Luma.`,
    switch: 'PRISMA encendió una red de órdenes. Cada plataforma cambia su luz y la siguiente, hacia la derecha. La última solo cambia la suya. Apágalas todas.',
    rhythm: `Orden: ${numbers}. Aterriza durante SILENCIO ABIERTO. Una nota fuera de tiempo rompe la secuencia.`,
    synthesis: `Las últimas defensas: ${directions}. Puedes consultar el próximo paso y conservar cada bloque de tres recuerdos.`,
  };
  return { mode, level, chapter, difficulty, intensity, runLength, seed, rules,
    id: expedition ? `exp-v${CAMPAIGN_VERSION}:${seed}:${intensity}:${runLength}:${level}` : `story-v${CAMPAIGN_VERSION}:${level}`,
    title: expedition ? `Expedición ${String(level).padStart(2, '0')} · ${RULE_NAMES[chapter]}` : LEVEL_NAMES[level - 1],
    chapterTitle: STORY_CHAPTERS[chapter], introduction: CHAPTER_INTROS[chapter],
    clue: first ? STORY.clue : hints[kind],
    help: kind === 'switch' ? `Desde el estado inicial, pulsa: ${numbers}. Cada plataforma invierte su luz y la siguiente; si ya cambiaste luces, empieza por la primera encendida desde la izquierda.` : directions,
    echo: !expedition && level === 100 ? 'Ayúdame a recordar cómo salir. El siguiente paso lo elijo yo.' : CHAPTER_ECHOES[chapter],
    par: Math.round(35 + count * 10 + sequence.length * 12 + difficulty * 45),
  };
}
export function nextLevel(spec) {
  const limit = spec.mode === 'story' ? TOTAL_LEVELS : spec.runLength || 100000;
  return spec.level < limit ? spec.level + 1 : null;
}
export function pulseIsOpen(time, rules) { return time % rules.pulsePeriod < rules.pulseOpen; }
