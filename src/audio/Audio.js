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
    if (/^pad[12345]$/.test(type)) {
      const count = Number(type.slice(-1));
      for (let i = 0; i < count; i++) this.tone([262, 330, 392, 440, 494][count - 1], i * 0.19);
      return;
    }
    const tones = { ability: 349, spring: 740, crumble: 82, fragment: 587, energy: 698, jump: 220, dash: 110, shard: 460 + combo * 28, boost: 660, rail: 330, hit: 70, enemy: 150, checkpoint: 880, finish: 1046, shield: 520, gravity: 390, clue: 523, echo: 784, relic: 988, swap: 440, 'puzzle-solved': 1046, 'puzzle-wrong': 98 };
    if (!tones[type]) return;
    this.tone(tones[type], 0, type === 'hit' || type === 'puzzle-wrong' ? 'triangle' : 'sine');
  }
  tone(frequency, delay = 0, waveform = 'sine') {
    const c = this.context, osc = c.createOscillator(), gain = c.createGain();
    const start = c.currentTime + delay;
    osc.type = waveform; osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.3, start + 0.12);
    gain.gain.setValueAtTime(0.035, start); gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
    osc.connect(gain); gain.connect(c.destination); osc.start(start); osc.stop(start + 0.17);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
}
