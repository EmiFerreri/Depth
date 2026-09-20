import { MEMORIES } from './Memories.js';
import { STORY_CHAPTERS } from '../story/StoryData.js';
import { LEVEL_NAMES } from '../story/LevelNames.js';
export const CHARACTERS = [
  { id: 'nox', name: 'Nox', role: 'Explorador', playable: true, signature: 'Núcleo claro dentro de una esfera de grafito', abilityId: 'anchor',
    story: 'Busca a Luma siguiendo lo que PRISMA no ha podido borrar. Su desafío es ayudarla a elegir, incluso cuando la respuesta sea nueva.' },
  { id: 'luma', name: 'Luma', role: 'Guardiana de sus recuerdos', playable: true, signature: 'Anillo violeta incompleto', abilityId: 'veil',
    story: 'Sus primeras señales son involuntarias. En los capítulos de cooperación y despertar toma el control de su propio camino.' },
  { id: 'prisma', name: 'PRISMA', role: 'Antagonista', playable: false, signature: 'Tres anillos cerrados y simétricos', abilityId: null,
    story: 'Confunde amar con predecir. Sus defensas convierten recuerdos en órdenes que el jugador puede aprender a deshacer.' },
];
export const ABILITIES = [
  { id: 'jump', name: 'Salto encadenado', key: 'Espacio', character: 'both', cooldown: 0, description: 'Puedes volver a saltar en el aire. El techo limita la altura.' },
  { id: 'dash', name: 'Impulso', key: 'Shift', character: 'both', cooldown: 0.8, description: 'Acelera en la dirección elegida. No atraviesa sellos de memoria.' },
  { id: 'anchor', name: 'Ancla', key: 'F', character: 'nox', cooldown: 6, duration: 0.65, description: 'Frena el movimiento y protege brevemente del daño. Úsala para preparar un aterrizaje.' },
  { id: 'veil', name: 'Velo', key: 'F', character: 'luma', cooldown: 8, duration: 2.4, description: 'Reduce temporalmente la gravedad y concede una protección inicial de 0,35 s.' },
];
export const OBSTACLES = [
  { id: 'spikes', name: 'Fragmentos cortantes', response: 'Saltar o protegerse', description: 'Peligro fijo a nivel del suelo.' },
  { id: 'pulse-beam', name: 'Barrera pulsante', response: 'Esperar la pausa o pasar por arriba', description: 'Alterna paso libre, aviso y activación; el estado se muestra con texto.' },
  { id: 'sentinel', name: 'Centinela', response: 'Elegir otra trayectoria o usar protección', description: 'Patrulla entre dos extremos con movimiento determinista.' },
  { id: 'crumble', name: 'Puente frágil', response: 'Cruzar antes del derrumbe', description: 'Soporte opcional: cede tras 0,7 s de contacto y reaparece 2 s después.' },
  { id: 'spring', name: 'Resorte de memoria', response: 'Aterrizar sobre él', description: 'Devuelve impulso vertical al caer; no modifica la secuencia del acertijo.' },
  { id: 'updraft', name: 'Corriente ascendente', response: 'Aprovechar la flotación', description: 'Reduce la aceleración hacia el suelo dentro de su zona visible.' },
];
export const WORLDS = [
  { id: 'vestibule', name: 'El Vestíbulo', levels: [1, 20], chapters: [0, 1], motif: 'arches', paper: '#f4f3ee', accent: '#795b8d',
    premise: 'La ciudad ha quedado arriba. Las primeras huellas conducen a una casa que recuerda al revés.', objective: 'Reconocer las señales de Luma y aprender a leerlas.', mechanics: ['sequence', 'mirror'], obstacles: ['spring', 'spikes'], reward: 'Insignia: Cartógrafo de las huellas' },
  { id: 'gardens', name: 'Jardines del Espejismo', levels: [21, 40], chapters: [2, 3], motif: 'branches', paper: '#f0f3ed', accent: '#347e68',
    premise: 'Las curvas del antiguo baile crecen como ramas. Entre ellas, PRISMA hace florecer voces falsas.', objective: 'Dominar la dirección y distinguir los anillos auténticos.', mechanics: ['direction', 'truth'], obstacles: ['pulse-beam', 'spikes'], reward: 'Insignia: Oído del jardín' },
  { id: 'archives', name: 'Archivos Suspendidos', levels: [41, 60], chapters: [4, 5], motif: 'shelves', paper: '#f4f1e9', accent: '#947238',
    premise: 'Recuerdos sin fecha flotan entre estantes. Un peso, una pausa y una hora correcta pueden recomponer una escena.', objective: 'Sostener lo verdadero y reconstruir el orden de los hechos.', mechanics: ['hold', 'archive'], obstacles: ['crumble', 'updraft', 'spikes'], reward: 'Insignia: Custodio del tiempo' },
  { id: 'nexus', name: 'Nexo de Cristal', levels: [61, 80], chapters: [6, 7], motif: 'bridges', paper: '#eef1f4', accent: '#567b9a',
    premise: 'Nox y Luma ya pueden ayudarse. Los circuitos de una libertad falsa se interponen entre ambos.', objective: 'Cooperar y apagar la red de órdenes.', mechanics: ['duet', 'switch'], obstacles: ['sentinel', 'crumble', 'spikes'], reward: 'Insignia: Dos lados, un camino' },
  { id: 'core', name: 'Corazón de PRISMA', levels: [81, 100], chapters: [8, 9], motif: 'rings', paper: '#f2eef3', accent: '#925f85',
    premise: 'La máquina mezcla sus defensas. En cada silencio, Luma recupera una decisión propia.', objective: 'Unir las capacidades aprendidas y dejar que Luma cruce la salida.', mechanics: ['rhythm', 'synthesis'], obstacles: ['pulse-beam', 'sentinel', 'spikes'], reward: 'Insignia: Nadie despierta solo' },
];
export const REWARDS = [
  { id: 'fragment', name: 'Fragmento', points: 40, description: 'Puntos de exploración sujetos al combo; se recoge una vez por intento.' },
  { id: 'energy', name: 'Energía', points: 80, description: 'Reduce 3 s la recarga de la capacidad del personaje activo.' },
  { id: 'relic', name: 'Reliquia', points: 300, description: 'Ruta opcional y estrella permanente al completar la cámara.' },
  { id: 'stars', name: 'Estrellas', points: 0, description: 'Completar, precisión en estándar y reliquia: tres logros independientes.' },
];
export const CHAPTER_CATALOG = STORY_CHAPTERS.map((name, index) => ({ id: `chapter-${index + 1}`, index, name,
  worldId: WORLDS[Math.floor(index / 2)].id, levels: [index * 10 + 1, index * 10 + 10], playableCharacters: index === 6 || index === 9 ? ['nox', 'luma'] : ['nox'] }));
export const LEVEL_CATALOG = LEVEL_NAMES.map((title, index) => ({ id: `level-${String(index + 1).padStart(3, '0')}`, level: index + 1, title,
  chapterId: CHAPTER_CATALOG[Math.floor(index / 10)].id, worldId: WORLDS[Math.floor(index / 20)].id }));
export const worldForChapter = chapter => WORLDS[Math.floor(chapter / 2)];
export const getWorld = id => WORLDS.find(world => world.id === id);
export function getCatalog() { return { schemaVersion: 1, generatorVersions: [4, 5], worlds: WORLDS, chapters: CHAPTER_CATALOG,
  levels: LEVEL_CATALOG, characters: CHARACTERS, abilities: ABILITIES, obstacles: OBSTACLES, rewards: REWARDS, memories: MEMORIES }; }
