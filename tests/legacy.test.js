import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Execute the original scripts with inert DOM/canvas adapters. This checks game
// reset logic, not real browser rendering. The instrumentation is test-only.
function loadLegacy(file, probe) {
  const elements = new Map(), listeners = new Map();
  const drawing = new Proxy({}, { get: () => () => {} });
  const element = id => {
    if (!elements.has(id)) elements.set(id, { style: {}, textContent: '', classList: { add() {}, remove() {}, toggle() {} },
      events: {}, addEventListener(type, fn) { this.events[type] = fn; }, getContext: () => drawing });
    return elements.get(id);
  };
  const context = vm.createContext({ innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    performance: { now: () => 0 }, document: { getElementById: element },
    addEventListener: (type, fn) => listeners.set(type, fn), requestAnimationFrame() {} });
  const source = readFileSync(file, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, `${probe}\n})();`), context);
  return { context, elements, listeners };
}
for (const file of ['level-007-pro.html', 'level-007b-alt-scenario.html']) {
  test(`${file}: start/restart repopulates enemies and releases input`, () => {
    const { context, elements } = loadLegacy(new URL(`../game/levels/${file}`, import.meta.url),
      'globalThis.probe = {state, keys};');
    elements.get('start').events.click();
    assert.equal(context.probe.state.enemies.length, 2);
    context.probe.state.enemies.pop(); context.probe.keys.add('KeyD');
    elements.get('restart').events.click();
    assert.equal(context.probe.state.enemies.length, 2); assert.equal(context.probe.keys.size, 0);
  });
}
test('legacy 100-sector campaign regenerates identical geometry on restart', () => {
  const { context, elements } = loadLegacy(new URL('../game/depth-100-prototype.html', import.meta.url), 'globalThis.probe = {state};');
  elements.get('start').events.click();
  const first = JSON.stringify(context.probe.state.platforms);
  elements.get('start').events.click();
  assert.equal(JSON.stringify(context.probe.state.platforms), first);
});
