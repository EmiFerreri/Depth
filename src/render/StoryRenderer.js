import { BALANCE as B } from '../config/balance.js';
export function drawStory(c, game, reduced) {
  const { world, story, time } = game;
  const ring = (x, y, radius, color) => {
    c.strokeStyle = color; c.lineWidth = 3; c.beginPath();
    c.arc(x, y, radius, 0.3, Math.PI * 1.83); c.stroke();
  };
  c.save(); c.textAlign = 'center';
  const glow = reduced ? 0 : Math.sin(time * 2) * 3;
  ring(world.clue.x, world.clue.y, 22 + glow, '#795b8d');
  c.fillStyle = '#695775'; c.font = '12px monospace';
  c.fillText(story.clueFound ? 'HUELLA DESCIFRADA' : 'ACÉRCATE A LA HUELLA', world.clue.x, B.floor + 35);
  if (story.clueFound) {
    c.fillText('○  →  ○ ○ ○  →  ○ ○', world.clue.x, B.floor - 76);
  }
  for (const pad of world.platforms) {
    const center = pad.x + pad.w / 2;
    const remembered = story.puzzle.sequence.slice(0, story.puzzle.progress).includes(pad.pad);
    const active = story.puzzle.contact === pad.pad;
    c.fillStyle = remembered ? '#338667' : '#795b8d';
    c.fillRect(pad.x, pad.y, pad.w, active ? 8 : 4);
    c.globalAlpha = 0.08; c.fillRect(pad.x, pad.y + 8, pad.w, B.floor - pad.y - 8); c.globalAlpha = 1;
    c.font = 'bold 28px monospace'; c.fillText(String(pad.pad), center, pad.y - 32);
    for (let i = 0; i < pad.pad; i++) {
      c.beginPath(); c.arc(center + (i - (pad.pad - 1) / 2) * 20, pad.y + 30, 4, 0, Math.PI * 2); c.fill();
    }
    c.font = '10px monospace'; c.fillText(remembered ? 'RECUERDO' : `${pad.pad} ${pad.pad === 1 ? 'PULSO' : 'PULSOS'}`, center, B.floor + 30);
  }
  const gate = world.gate;
  c.fillStyle = story.gateOpen ? '#338667' : '#795b8d';
  c.globalAlpha = story.gateOpen ? 0.1 : 0.16; c.fillRect(gate.x, gate.y, gate.w, gate.h); c.globalAlpha = 1;
  c.lineWidth = 2; c.strokeStyle = c.fillStyle;
  if (!story.gateOpen) {
    c.strokeRect(gate.x, gate.y, gate.w, gate.h);
    for (let y = 125; y < B.floor; y += 35) { c.beginPath(); c.moveTo(gate.x, y); c.lineTo(gate.x + gate.w, y - 24); c.stroke(); }
  } else {
    c.fillRect(gate.x, gate.y, gate.w, 8); c.fillRect(gate.x, B.floor - 8, gate.w, 8);
  }
  c.font = '11px monospace'; c.fillText(story.gateOpen ? 'PASO ABIERTO' : 'SELLO DE MEMORIA', gate.x, B.floor + 55);
  if (story.gateOpen) {
    ring(world.echo.x, world.echo.y, 26 + glow, '#795b8d');
    c.fillStyle = '#795b8d'; c.font = '12px monospace';
    c.fillText(story.echoFound ? 'LUMA SIGUE AQUÍ' : 'EL PRIMER ECO', world.echo.x, B.floor + 30);
  }
  c.restore();
}
