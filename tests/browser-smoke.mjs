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
  await page.getByRole('button', { name: 'INICIAR FLOW' }).waitFor();
  await page.screenshot({ path: 'build/screenshots/menu.png', fullPage: true });
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
  assert.deepEqual(errors, []);
  console.log('Browser smoke passed: modes, movement, jump, pause/resume, focus loss, mobile and console.');
} finally { await browser.close(); }
