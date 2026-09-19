// Optional local browser gate: npm install --no-save --package-lock=false playwright
// Then: npx playwright install chromium; npm start (another terminal); node tests/browser-smoke.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
await mkdir('build/screenshots', { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8000');
  await page.getByRole('button', { name: 'INICIAR HISTORIA' }).waitFor();
  await page.screenshot({ path: 'build/screenshots/menu.png', fullPage: true });
  await page.click('#start');
  await page.locator('#story-intro[open]').waitFor();
  assert.equal(await page.evaluate(() => window.depth.snapshot().state), 'ready');
  await page.screenshot({ path: 'build/screenshots/story-intro.png' });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#menu').isVisible(), true);
  await page.click('#start'); await page.click('#story-begin');
  await page.waitForFunction(() => window.depth.snapshot().time > 0.2);
  assert.equal(await page.evaluate(() => window.depth.snapshot().x), 100);
  await page.keyboard.down('KeyD');
  await page.waitForFunction(() => window.depth.snapshot().story.clueFound);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('KeyE');
  await page.locator('#journal-dialog[open]').waitFor();
  const journalTime = await page.evaluate(() => window.depth.snapshot().time);
  await page.keyboard.press('KeyR'); await page.waitForTimeout(180);
  assert.equal(await page.evaluate(() => window.depth.snapshot().time), journalTime);
  assert.equal(await page.locator('#journal-help').isVisible(), true);
  await page.screenshot({ path: 'build/screenshots/story-journal.png' });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.depth.snapshot().state === 'running');
  await page.click('#pause'); await page.click('#restart');
  await page.waitForFunction(() => window.depth.snapshot().time > 0.1);
  assert.equal(await page.evaluate(() => window.depth.snapshot().story.clueFound), false);
  // Complete the first chamber with real keyboard input; verify save and continuation.
  let progress = 0;
  for (const target of [620, 1380, 1000]) {
    const x = await page.evaluate(() => window.depth.snapshot().x), right = target > x;
    await page.keyboard.down(right ? 'KeyD' : 'KeyA');
    await page.waitForFunction(({ target, right }) => right ? window.depth.snapshot().x >= target - 25 : window.depth.snapshot().x <= target + 25, { target, right });
    await page.keyboard.up(right ? 'KeyD' : 'KeyA'); await page.waitForTimeout(300);
    await page.keyboard.press('Space'); progress++;
    await page.waitForFunction(value => window.depth.snapshot().story.progress === value, progress);
  }
  await page.keyboard.down('KeyD');
  await page.waitForFunction(() => window.depth.snapshot().state === 'finished');
  await page.keyboard.up('KeyD');
  await page.screenshot({ path: 'build/screenshots/story-result.png' });
  assert.equal(await page.locator('#next-level').isVisible(), true);
  await page.click('#next-level');
  await page.waitForFunction(() => window.depth.snapshot().story.level === 2 && window.depth.snapshot().state === 'running');
  await page.click('#pause'); await page.click('#quit');
  await page.click('[data-mode="sprint"]');
  await page.click('#start');
  await page.waitForFunction(() => window.depth.snapshot().x > 150);
  assert.equal(await page.evaluate(() => window.depth.snapshot().mode), 'sprint');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.depth.snapshot().y < 550);
  await page.keyboard.press('Shift');
  await page.click('#pause');
  const paused = await page.evaluate(() => window.depth.snapshot());
  await page.waitForTimeout(180);
  assert.equal((await page.evaluate(() => window.depth.snapshot())).time, paused.time);
  await page.click('#resume');
  await page.waitForFunction(t => window.depth.snapshot().time > t, paused.time);
  await page.screenshot({ path: 'build/screenshots/playing.png' });
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForFunction(() => window.depth.snapshot().state === 'paused');
  await page.click('#quit');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('[data-mode="story"]'); await page.click('#start');
  await page.click('#story-begin');
  await page.screenshot({ path: 'build/screenshots/mobile-story.png' });
  assert.equal(await page.locator('#journal-open').isVisible(), true);
  assert.equal(await page.locator('[data-control="shoot"]').isVisible(), false);
  await page.click('#journal-open'); await page.click('#journal-close');
  await page.click('#pause'); await page.click('#quit');
  await page.click('[data-mode="sprint"]');
  await page.screenshot({ path: 'build/screenshots/mobile-menu.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.click('#start');
  await page.waitForFunction(() => window.depth.snapshot().time > 0.2);
  await page.click('[data-control="jump"]');
  await page.waitForFunction(() => window.depth.snapshot().y < 550);
  await page.screenshot({ path: 'build/screenshots/mobile-playing.png' });
  // Check all other entry modes can start and return to the menu.
  for (const mode of ['daily', 'campaign', 'flow']) {
    await page.click('#pause'); await page.click('#quit');
    await page.click(`[data-mode="${mode}"]`); await page.click('#start');
    await page.waitForFunction(m => window.depth.snapshot().mode === m && window.depth.snapshot().time > 0.1, mode);
  }
  await page.click('#pause'); await page.click('#quit');
  await page.click('[data-mode="story"]'); await page.click('#map-open');
  assert.equal(await page.locator('.level-grid button:not(:disabled)').count(), 2);
  await page.screenshot({ path: 'build/screenshots/progression-map.png' });
  await page.click('#map-close');
  await page.click('[data-mode="expedition"]'); await page.fill('#exp-seed', 'PRUEBA-LOCAL');
  await page.selectOption('#exp-intensity', '3'); await page.selectOption('#exp-length', '36');
  await page.click('#start'); await page.click('#story-begin');
  assert.match(await page.evaluate(() => window.depth.snapshot().seed), /PRUEBA-LOCAL:3:36/);
  await page.click('#pause'); await page.click('#quit');
  assert.equal(await page.locator('#exp-resume').isVisible(), true);
  // Exercise the backup import UI, never a private engine mutation.
  const records = Object.fromEntries(Array.from({ length: 94 }, (_, i) => [i + 1, { completed: true, clean: false, relic: false, bestTime: 100 }]));
  await page.locator('#progress-file').setInputFiles({ name: 'qa-progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, records, selected: 95 })) });
  await page.waitForFunction(() => document.querySelector('#level-select').value === '95');
  await page.click('[data-mode="story"]'); await page.click('#start'); await page.click('#story-begin');
  await page.keyboard.press('KeyQ');
  await page.waitForFunction(() => window.depth.snapshot().character === 'luma');
  await page.screenshot({ path: 'build/screenshots/luma-synthesis.png' });
  assert.deepEqual(errors, []);
  console.log('Browser smoke passed: story completion/save/next, map, expedition, backup import, Luma, arcade, pause, mobile and console.');
} finally { await browser.close(); }
