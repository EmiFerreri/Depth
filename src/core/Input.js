export class Input {
  constructor(canvas, onPause, onRestart) {
    this.keys = new Set(); this.touch = new Map(); this.actions = new Set(); this.pointer = null; this.firing = false;
    const keyActions = { Space: 'jump', KeyW: 'jump', ArrowUp: 'jump', ShiftLeft: 'dash', ShiftRight: 'dash' };
    addEventListener('keydown', event => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code) && !event.target.closest('button')) event.preventDefault();
      if (event.repeat) return;
      if (event.code === 'Escape' || event.code === 'KeyP') { onPause(); return; }
      if (event.code === 'KeyR') { onRestart(); return; }
      this.keys.add(event.code);
      if (keyActions[event.code]) this.actions.add(keyActions[event.code]);
    });
    addEventListener('keyup', event => this.keys.delete(event.code));
    addEventListener('blur', () => this.clear());
    canvas.addEventListener('pointermove', event => { if (event.pointerType !== 'touch') this.pointer = { x: event.clientX, y: event.clientY }; });
    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') { this.actions.add('jump'); return; }
      this.pointer = { x: event.clientX, y: event.clientY }; this.firing = true;
    });
    addEventListener('pointerup', () => { this.firing = false; });
    addEventListener('pointercancel', () => { this.firing = false; });
    document.querySelectorAll('[data-control]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        event.preventDefault(); button.setPointerCapture(event.pointerId);
        const action = button.dataset.control; this.touch.set(event.pointerId, action);
        if (action === 'jump' || action === 'dash') this.actions.add(action);
      });
      const release = event => this.touch.delete(event.pointerId);
      button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
    });
  }
  clear() { this.keys.clear(); this.touch.clear(); this.actions.clear(); this.firing = false; }
  read(renderer) {
    const touched = new Set(this.touch.values());
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight') || touched.has('right');
    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft') || touched.has('left');
    const data = { move: Number(right) - Number(left), jump: this.actions.has('jump'), dash: this.actions.has('dash'),
      down: this.keys.has('KeyS') || this.keys.has('ArrowDown'), shoot: this.firing || this.keys.has('KeyJ') || touched.has('shoot') };
    if (this.firing && this.pointer) {
      const position = renderer.worldPoint(this.pointer); data.aimX = position.x; data.aimY = position.y;
    }
    this.actions.clear(); return data;
  }
}
