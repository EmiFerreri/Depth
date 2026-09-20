// Vector motifs are scenery. Mechanical silhouettes and labels remain distinct.
export function drawMotif(c, biome, width, camera) {
  if (!biome) return;
  c.save(); c.strokeStyle = biome.accent; c.globalAlpha = 0.12; c.lineWidth = 2;
  for (let x = -(camera * 0.22 % 360) - 180; x < width + 180; x += 360) {
    c.beginPath();
    if (biome.motif === 'arches') { c.moveTo(x - 90, 590); c.lineTo(x - 90, 325); c.arc(x, 325, 90, Math.PI, 0); c.lineTo(x + 90, 590); }
    if (biome.motif === 'branches') { c.moveTo(x, 590); c.lineTo(x, 220); for (const y of [290,390,490]) { c.moveTo(x, y); c.lineTo(x - 70, y - 65); c.moveTo(x, y - 20); c.lineTo(x + 80, y - 100); } }
    if (biome.motif === 'shelves') { for (const y of [260,360,460]) { c.rect(x - 100, y, 200, 12); for (let i = 0; i < 6; i++) c.rect(x - 90 + i * 32, y - 48, 22, 48); } }
    if (biome.motif === 'bridges') { c.moveTo(x - 120, 470); c.lineTo(x, 250); c.lineTo(x + 120, 470); c.closePath(); c.moveTo(x - 120, 470); c.lineTo(x + 120, 470); c.moveTo(x, 250); c.lineTo(x, 470); }
    if (biome.motif === 'rings') { for (const r of [60,90,120]) { c.moveTo(x + r, 350); c.arc(x, 350, r, 0, Math.PI * 2); } }
    c.stroke();
  }
  c.restore();
}
export function drawWorldFeatures(c, game, visible) {
  const world = game.world, accent = world.biome?.accent || '#795b8d';
  c.save(); c.font = '10px monospace'; c.textAlign = 'center';
  for (const field of world.fields || []) {
    if (!visible(field.x, field.w)) continue;
    c.fillStyle = '#567b9a14'; c.fillRect(field.x, field.y, field.w, field.h);
    c.strokeStyle = '#567b9a'; c.setLineDash([3,7]); c.strokeRect(field.x, field.y, field.w, field.h); c.setLineDash([]);
    c.fillStyle = '#567b9a'; for (let y = field.y + 45; y < field.y + field.h; y += 48) c.fillText('↑   ↑   ↑', field.x + field.w / 2, y);
    c.fillText('CORRIENTE', field.x + field.w / 2, field.y - 10);
  }
  for (const support of world.supports || []) {
    if (!visible(support.x, support.w)) continue;
    c.strokeStyle = '#947238'; c.setLineDash(support.active ? [] : [3,6]);
    c.strokeRect(support.x, support.y, support.w, 8); c.setLineDash([]);
    if (support.active) { c.fillStyle = '#947238'; c.fillRect(support.x, support.y, support.w * Math.min(1, support.charge / support.collapseAfter), 8); }
    c.fillStyle = '#735522'; c.fillText(support.active ? 'FRÁGIL · 0,7 s' : `REAPARECE ${support.downtime.toFixed(1)} s`, support.x + support.w / 2, support.y - 13);
  }
  for (const spring of world.springs || []) {
    if (!visible(spring.x, spring.w)) continue;
    c.strokeStyle = accent; c.lineWidth = 2; c.beginPath();
    c.moveTo(spring.x, spring.y);
    for (let i = 1; i <= 8; i++) c.lineTo(spring.x + i * spring.w / 8, spring.y - (i % 2 ? 9 : 0));
    c.stroke(); c.fillStyle = accent; c.fillText('RESORTE ↑', spring.x + spring.w / 2, spring.y - 21);
  }
  for (const s of world.sentinels || []) {
    if (!visible(s.baseX - s.range, s.range * 2)) continue;
    c.strokeStyle = '#aa4d39'; c.lineWidth = 1; c.setLineDash([3,5]); c.beginPath(); c.moveTo(s.baseX - s.range, s.y); c.lineTo(s.baseX + s.range, s.y); c.stroke(); c.setLineDash([]);
    for (const r of [s.r, s.r * 0.6, s.r * 0.2]) { c.beginPath(); c.arc(s.x, s.y, r, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = '#aa4d39'; c.fillText('CENTINELA', s.baseX, s.y - 32);
  }
  c.restore();
}
export function drawBeam(c, hazard) {
  c.save();
  c.strokeStyle = hazard.state === 'active' ? '#bd402c' : hazard.state === 'warning' ? '#947238' : '#347e68';
  c.fillStyle = hazard.state === 'active' ? '#bd402c99' : '#347e6810';
  c.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
  c.setLineDash(hazard.state === 'active' ? [] : [4,6]); c.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h); c.setLineDash([]);
  c.fillStyle = c.strokeStyle; c.font = '10px monospace'; c.textAlign = 'center';
  c.fillText(hazard.state === 'active' ? '× ACTIVA' : hazard.state === 'warning' ? '! AVISO' : '○ LIBRE', hazard.x + hazard.w / 2, hazard.y - 15);
  c.restore();
}
