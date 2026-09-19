// Generated tones only. Audio begins after a user gesture and needs no asset/API.
export class Audio {
  enabled = true;
  async unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { this.enabled = false; }
  }
  play(type, combo = 1) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const tones = { jump: 220, dash: 110, shard: 460 + combo * 28, boost: 660, rail: 330, hit: 70, enemy: 150, checkpoint: 880, finish: 1046, shield: 520, gravity: 390 };
    if (!tones[type]) return;
    const c = this.context, osc = c.createOscillator(), gain = c.createGain();
    osc.type = type === 'hit' ? 'triangle' : 'sine'; osc.frequency.setValueAtTime(tones[type], c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(tones[type] * 1.3, c.currentTime + 0.12);
    gain.gain.setValueAtTime(0.035, c.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.16);
    osc.connect(gain); gain.connect(c.destination); osc.start(); osc.stop(c.currentTime + 0.17);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
}
