import test from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../src/core/Input.js';
test('keyboard repeats, focus loss and pointer cancellation cannot stick controls', t => {
  const previous = Object.fromEntries(['document', 'addEventListener', 'HTMLInputElement', 'HTMLSelectElement'].map(k => [k, globalThis[k]]));
  t.after(() => { for (const [key, value] of Object.entries(previous)) if (value === undefined) delete globalThis[key]; else globalThis[key] = value; });
  const listeners = {}, controls = [];
  for (const action of ['left', 'right', 'jump', 'dash', 'shoot']) controls.push({ dataset: { control: action }, listeners: {},
    addEventListener(name, fn) { this.listeners[name] = fn; }, setPointerCapture() {} });
  globalThis.document = { querySelectorAll: () => controls }; globalThis.addEventListener = (name, fn) => { listeners[name] = fn; };
  globalThis.HTMLInputElement = class {}; globalThis.HTMLSelectElement = class {};
  const canvas = { listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } };
  let pauses = 0; const input = new Input(canvas, () => pauses++, () => {});
  const event = (code, repeat = false) => ({ code, repeat, target: { closest: () => null }, preventDefault() {} });
  listeners.keydown(event('Space')); assert.equal(input.read().jump, true);
  listeners.keydown(event('Space', true)); assert.equal(input.read().jump, false);
  listeners.keydown(event('KeyP', true)); assert.equal(pauses, 0);
  listeners.keydown(event('KeyD')); assert.equal(input.read().move, 1);
  listeners.blur(); assert.equal(input.read().move, 0);
  const right = controls[1], shoot = controls[4];
  right.listeners.pointerdown({ pointerId: 1, preventDefault() {} }); shoot.listeners.pointerdown({ pointerId: 2, preventDefault() {} });
  assert.equal(input.read().move, 1); assert.equal(input.read().shoot, true);
  right.listeners.pointercancel({ pointerId: 1 }); assert.equal(input.read().move, 0); assert.equal(input.read().shoot, true);
  shoot.listeners.lostpointercapture({ pointerId: 2 }); assert.equal(input.read().shoot, false);
});
