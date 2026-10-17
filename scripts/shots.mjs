// Dev helper: screenshots of key screens for a visual check. Usage: node scripts/shots.mjs <outDir> [baseUrl]
import { chromium, devices } from '@playwright/test';

const out = process.argv[2] ?? 'shots';
const base = process.argv[3] ?? 'http://localhost:4180';
const browser = await chromium.launch();

async function seed(page, mutate) {
  await page.evaluate(async (src) => {
    const fn = new Function('s', src);
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('sparkle-kingdom');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const get = () => new Promise((res) => (db.transaction('kv').objectStore('kv').get('state').onsuccess = (e) => res(e.target.result)));
    const s = await get();
    fn(s);
    await new Promise((res) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(s, 'state');
      tx.oncomplete = res;
    });
  }, mutate);
  await page.reload();
}

const only = process.argv[4];
for (const [name, dev] of [
  ['tab', devices['Galaxy Tab S4 landscape']],
  ['ipad', devices['iPad (gen 7)']],
].filter(([n]) => !only || n === only)) {
  const ctx = await browser.newContext({ ...dev, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(base + '/');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}-home.png` });
  await seed(
    page,
    `const ids = ['dr-gold-crown','st-pink-shell','dr-coral-tail','st-conch','dr-rose-gown','dr-pearl-necklace','dr-star-wand','dr-glass-slippers','st-seahorse','st-coral-castle','dr-lilac-tutu','dr-pearl-tiara'];
     for (const id of ids) s.owned[id] = { at: 1, source: 'earned' };
     s.dressing.outfits.pearl = { tail: 'dr-coral-tail', crown: 'dr-gold-crown', necklace: 'dr-pearl-necklace', wand: 'dr-star-wand' };
     s.dressing.outfits.rosie = { dress: 'dr-rose-gown', crown: 'dr-pearl-tiara', shoes: 'dr-glass-slippers' };`,
  );
  await page.goto(base + '/#/dress-up');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}-dressup.png` });
  await page.getByTestId('character-rosie').click();
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${out}/${name}-dressup-rosie.png` });
  await page.goto(base + '/#/collection');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}-collection.png` });
  await page.goto(base + '/#/decorate/castle');
  await page.waitForTimeout(500);
  await page.getByTestId('tray-st-coral-castle').tap();
  await page.getByTestId('place-center').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${name}-decorate.png` });
  await page.goto(base + '/#/decorate');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-scenes.png` });
  // Play: placement adventure — capture each game.
  await page.goto(base + '/#/play');
  for (let k = 0; k < 40; k++) {
    await page.waitForTimeout(700);
    const phase = await page.getByTestId('adventure').getAttribute('data-phase').catch(() => null);
    const kind = await page.getByTestId('adventure').getAttribute('data-game-kind').catch(() => null);
    await page.screenshot({ path: `${out}/${name}-play-${String(k).padStart(2, '0')}-${phase}-${kind ?? ''}.png` });
    if (phase === 'goodbye') break;
    if (phase === 'reward') {
      if (await page.getByTestId('open-chest').isVisible().catch(() => false)) await page.getByTestId('open-chest').click({ force: true });
      else await page.getByTestId('reward-next').click().catch(() => {});
      continue;
    }
    const jewel = page.locator('[data-testid="jewel"]:not([data-lit])').first();
    if (await jewel.isVisible().catch(() => false)) {
      while (await jewel.isVisible().catch(() => false)) await jewel.click();
      continue;
    }
    const opt = page.locator('[data-testid="option"][data-correct]').first();
    if (await opt.isVisible().catch(() => false)) await opt.click({ force: true });
  }
  await ctx.close();
}
await browser.close();
