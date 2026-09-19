import { BALANCE as B } from '../config/balance.js';
export function drawStory(c, game, reduced) {
  const { world, story, time } = game, spec = story.spec;
  const ring = (x, y, radius, color, open = true) => {
    c.strokeStyle = color; c.lineWidth = 3; c.beginPath();
    c.arc(x, y, radius, open ? 0.3 : 0, open ? Math.PI * 1.83 : Math.PI * 2); c.stroke();
  };
  c.save(); c.textAlign = 'center';
  const glow = reduced ? 0 : Math.sin(time * 2) * 3;
  ring(world.clue.x, world.clue.y, 22 + glow, '#795b8d');
  c.fillStyle = '#695775'; c.font = '12px monospace';
  c.fillText(story.clueFound ? 'HUELLA DESCIFRADA · E' : 'ACÉRCATE A LA HUELLA', world.clue.x, B.floor + 35);
  if (story.clueFound && spec.mode === 'story' && spec.level === 1) c.fillText('○  →  ○ ○ ○  →  ○ ○', world.clue.x, B.floor - 76);
  for (const pad of world.platforms) {
    const center = pad.x + pad.w / 2;
    const remembered = spec.rules.kind === 'switch' ? !story.puzzle.isOn(pad.pad) : story.puzzle.sequence.slice(0, story.puzzle.progress).includes(pad.pad);
    const active = story.puzzle.contact === pad.pad;
    c.fillStyle = remembered ? '#338667' : '#795b8d';
    c.fillRect(pad.x, pad.y, pad.w, active ? 8 : 4);
    c.globalAlpha = 0.08; c.fillRect(pad.x, pad.y + 8, pad.w, B.floor - pad.y - 8); c.globalAlpha = 1;
    c.font = 'bold 24px monospace'; c.fillText(String(Math.abs(pad.pad)), center, pad.y - 32);
    if (spec.rules.kind === 'truth') ring(center, pad.y - 42, 27, '#795b8d', pad.authentic);
    if (spec.rules.kind === 'archive') {
      c.font = '12px monospace'; c.fillText(`12:${String(pad.stamp).padStart(2, '0')}`, center, pad.y + 30);
    } else if (spec.rules.kind === 'switch') {
      c.font = '11px monospace'; c.fillText(story.puzzle.isOn(pad.pad) ? '● ENCENDIDA' : '○ APAGADA', center, pad.y + 30);
    } else for (let i = 0; i < Math.abs(pad.pad); i++) {
      c.beginPath(); c.arc(center + (i - (Math.abs(pad.pad) - 1) / 2) * 14, pad.y + 26, 3, 0, Math.PI * 2); c.fill();
    }
    if (active && story.puzzle.pending) {
      const total = spec.rules.steps[story.puzzle.progress].hold;
      c.fillStyle = '#338667'; c.fillRect(pad.x, pad.y - 8, pad.w * Math.min(1, story.puzzle.charge / total), 4);
    }
    c.fillStyle = '#695775'; c.font = '10px monospace';
    if (spec.rules.kind === 'truth') c.fillText(pad.authentic ? 'ABIERTO' : 'CERRADO', center, B.floor + 30);
  }
  const gate = world.gate;
  c.fillStyle = story.gateOpen ? '#338667' : '#795b8d';
  c.globalAlpha = story.gateOpen ? 0.1 : 0.16; c.fillRect(gate.x, gate.y, gate.w, gate.h); c.globalAlpha = 1;
  c.lineWidth = 2; c.strokeStyle = c.fillStyle;
  if (!story.gateOpen) {
    c.strokeRect(gate.x, gate.y, gate.w, gate.h);
    for (let y = 125; y < B.floor; y += 35) { c.beginPath(); c.moveTo(gate.x, y); c.lineTo(gate.x + gate.w, y - 24); c.stroke(); }
    if (spec.level % 10 === 0) {
      for (let i = 0; i < 3; i++) ring(gate.x + 100, 270, 18 + i * 13, ['#695775', '#8f7361', '#65857a'][i], false);
      c.font = '10px monospace'; c.fillText('PRISMA', gate.x + 100, 342);
    }
  } else {
    c.fillRect(gate.x, gate.y, gate.w, 8); c.fillRect(gate.x, B.floor - 8, gate.w, 8);
    ring(world.echo.x, world.echo.y, 26 + glow, '#795b8d');
    c.fillStyle = '#795b8d'; c.font = '12px monospace';
    c.fillText(story.echoFound ? 'RECUERDO RECUPERADO' : 'EL ECO DE LUMA', world.echo.x, B.floor + 30);
  }
  c.font = '11px monospace'; c.fillText(story.gateOpen ? 'PASO ABIERTO' : 'SELLO DE MEMORIA', gate.x, B.floor + 55);
  c.fillText('SALIDA', world.length - 30, B.floor - 55);
  if (story.allowSwap) {
    const inactive = game.players[game.activeCharacter === 'nox' ? 'luma' : 'nox'];
    c.globalAlpha = 0.35; c.fillStyle = '#795b8d'; c.beginPath(); c.arc(inactive.x, inactive.y, inactive.r, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.font = '10px monospace'; c.fillText(game.activeCharacter === 'nox' ? 'LUMA · Q' : 'NOX · Q', inactive.x, inactive.y - 28);
  }
  c.restore();
}
