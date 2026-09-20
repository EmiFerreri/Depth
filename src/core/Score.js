export const SCORE_LABELS = { distance: 'Trayectoria', puzzles: 'Recuerdos', pickups: 'Exploración', combat: 'Combate', rails: 'Curvas', completion: 'Cierre', penalties: 'Impactos' };
export function createLedger() { return Object.fromEntries(Object.keys(SCORE_LABELS).map(key => [key, 0])); }
export function addScore(game, amount, category) {
  if (!Number.isFinite(amount) || !Object.hasOwn(game.scoreLedger, category)) throw new Error('Invalid score event');
  const next = Math.max(0, game.score + amount), applied = next - game.score;
  game.scoreLedger[category] += applied; game.score = next;
  return applied;
}
