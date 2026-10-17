// Dev helper: one screenshot of each mini-game. Usage: node scripts/shots-games.mjs <outDir> [baseUrl] [tab|ipad]
import { chromium, devices } from '@playwright/test';

const out = process.argv[2] ?? 'shots';
const base = process.argv[3] ?? 'http://localhost:4180';
const dev = process.argv[4] === 'ipad' ? devices['iPad (gen 7)'] : devices['Galaxy Tab S4 landscape'];
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...dev, reducedMotion: 'reduce' });
const page = await ctx.newPage();
await page.goto(base + '/');
await page.waitForTimeout(800);
await page.evaluate(async () => {
  const db = await new Promise((r) => {
    const q = indexedDB.open('sparkle-kingdom');
    q.onsuccess = () => r(q.result);
  });
  const s = await new Promise((r) => (db.transaction('kv').objectStore('kv').get('state').onsuccess = (e) => r(e.target.result)));
  s.placement = { doneAt: 1, baselineOk: true, shakyTeens: [14, 17], solidTeens: [] };
  s.settings.sessionMinutes = 8;
  s.settings.sessionsPerDay = 0;
  s.settings.voiceOn = false;
  await new Promise((r) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(s, 'state');
    tx.oncomplete = r;
  });
});
const seen = new Set();
for (let session = 0; session < 4 && seen.size < 9; session++) {
  await page.goto(base + '/#/');
  await page.reload();
  await page.getByTestId('play').click();
  for (let k = 0; k < 200; k++) {
    await page.waitForTimeout(250);
    const phase = await page.getByTestId('adventure').getAttribute('data-phase');
    if (phase === 'goodbye') {
      await page.getByTestId('goodbye-home').click();
      break;
    }
    if (phase === 'reward') {
      if (await page.getByTestId('open-chest').isVisible()) await page.getByTestId('open-chest').click({ force: true });
      else await page.getByTestId('reward-next').click().catch(() => {});
      await page.waitForTimeout(300);
      continue;
    }
    const kind = await page.getByTestId('adventure').getAttribute('data-game-kind');
    if (!kind) continue;
    const mode = (await page.locator('[data-mode]').getAttribute('data-mode').catch(() => null)) ?? '';
    const tag = kind + (mode ? `-${mode}` : '');
    if (!seen.has(tag)) {
      seen.add(tag);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${out}/game-${tag}.png` });
    }
    try {
      if (kind === 'jewels') {
        const unlit = page.locator('[data-testid="jewel"]:not([data-lit])');
        while ((await unlit.count()) > 0) await unlit.first().click();
        await page.locator('[data-testid="option"][data-correct]').click({ timeout: 3000 });
      } else if (kind === 'match') {
        const words = await page.getByTestId('card').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('data-word')))]);
        for (const w of words) {
          const c = page.locator(`[data-testid="card"][data-word="${w}"]`);
          await c.nth(0).click();
          await c.nth(1).click();
        }
        await page.waitForTimeout(2500);
      } else if (mode === 'build') {
        const t = Number(await page.locator('[data-mode="build"]').getAttribute('data-target'));
        for (let i = 0; i < t - 10; i++) await page.getByTestId('add-shell').click();
        await page.getByTestId('done').click();
        await page.waitForTimeout(1500);
      } else if (kind === 'shop') {
        const t = Number(await page.getByTestId('basket').getAttribute('data-target'));
        for (let i = 0; i < t; i++) await page.getByTestId('pile-pearl').first().click();
        await page.screenshot({ path: `${out}/game-shop-filled.png` });
        await page.getByTestId('done').click();
        await page.waitForTimeout(1500);
      } else {
        await page.locator('[data-testid="option"][data-correct]').first().click({ force: true, timeout: 3000 });
        await page.waitForTimeout(1500);
      }
    } catch {
      /* next tick */
    }
  }
}
console.log('captured', [...seen].join(', '));
await browser.close();
