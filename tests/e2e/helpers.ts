import { expect, type Page } from '@playwright/test';

/** Mid-morning local time, so adding hours stays on the same calendar day. */
export const START = new Date('2026-10-16T10:00:00');
export const DAY = 24 * 60 * 60 * 1000;

/** Fresh game at a controlled time. Each Playwright test gets an empty browser profile. */
export async function launch(page: Page, at: Date = START, opts: { voice?: boolean } = {}) {
  await page.clock.setFixedTime(at);
  await page.goto('/');
  await expect(page.getByTestId('home')).toBeVisible();
  // Spoken prompts still go to the debug log when voice is off; turning it off keeps tests quick.
  if (!opts.voice) await seed(page, (s) => void (s.settings.voiceOn = false));
}

/** Edits the saved game document directly in IndexedDB, then reloads. */
export async function seed(page: Page, mutate: (s: any) => void) {
  await page.waitForTimeout(400); // let the first save land
  await page.evaluate(async (src) => {
    const fn = new Function('s', `(${src})(s)`);
    const db: IDBDatabase = await new Promise((res, rej) => {
      const r = indexedDB.open('sparkle-kingdom');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const s = await new Promise<any>((res) => (db.transaction('kv').objectStore('kv').get('state').onsuccess = (e) => res((e.target as IDBRequest).result)));
    fn(s);
    await new Promise((res) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(s, 'state');
      tx.oncomplete = res;
    });
    db.close();
  }, mutate.toString());
  await page.reload();
}

export async function readState(page: Page): Promise<any> {
  return page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((res) => {
      const r = indexedDB.open('sparkle-kingdom');
      r.onsuccess = () => res(r.result);
    });
    const s = await new Promise<any>((res) => (db.transaction('kv').objectStore('kv').get('state').onsuccess = (e) => res((e.target as IDBRequest).result)));
    db.close();
    return s;
  });
}

/** Progress signature from explicit data attributes (never from animations). */
async function signature(page: Page): Promise<string> {
  return page.evaluate(() => {
    const a = document.querySelector('[data-testid="adventure"]');
    if (!a) return 'none';
    const game = a.querySelector('[data-testid^="game-"]');
    const reward = a.querySelector('[data-testid="reward-reveal"]');
    const opened = a.querySelector('[data-testid="reward-item"]') ? 'open' : 'closed';
    return [a.getAttribute('data-phase'), a.getAttribute('data-game-index'), game?.getAttribute('data-round') ?? '', reward?.getAttribute('data-index') ?? '', reward ? opened : ''].join('|');
  });
}

async function waitForProgress(page: Page, before: string) {
  await expect.poll(() => signature(page), { timeout: 20_000 }).not.toBe(before);
}

/** Answers the current question correctly, using the real touch interactions for each game. */
async function answerCurrent(page: Page) {
  const adv = page.getByTestId('adventure');
  const kind = await adv.getAttribute('data-game-kind');
  if (kind === 'jewels') {
    const unlit = page.locator('[data-testid="jewel"]:not([data-lit])');
    while ((await unlit.count()) > 0) await unlit.first().tap();
    await page.locator('[data-testid="option"][data-correct]').tap();
    return;
  }
  if (kind === 'match') {
    const words = await page.getByTestId('card').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('data-word')!))]);
    for (const w of words) {
      const cards = page.locator(`[data-testid="card"][data-word="${w}"]`);
      await cards.nth(0).tap();
      await cards.nth(1).tap();
      await expect(cards.nth(0)).toHaveAttribute('data-face', 'true');
    }
    return;
  }
  if (kind === 'tenframe' && (await page.locator('[data-mode="build"]').count())) {
    const target = Number(await page.locator('[data-mode="build"]').getAttribute('data-target'));
    for (let i = 0; i < target - 10; i++) await page.getByTestId('add-shell').tap();
    await expect(page.getByTestId('frame-build')).toHaveAttribute('data-filled', String(target - 10));
    await page.getByTestId('done').tap();
    return;
  }
  if (kind === 'shop') {
    const target = Number(await page.getByTestId('basket').getAttribute('data-target'));
    for (let i = 0; i < target; i++) await page.getByTestId('pile-pearl').first().tap();
    await expect(page.getByTestId('basket')).toHaveAttribute('data-count', String(target));
    await page.getByTestId('done').tap();
    return;
  }
  // Bubbles drift slowly, so they never count as "stable" for Playwright: tap without the wait.
  await page.locator('[data-testid="option"][data-correct]').first().tap({ force: kind === 'bubble' });
}

/** Plays from the Play button through to the goodbye screen, answering correctly. Returns games played. */
export async function playAdventure(page: Page): Promise<string[]> {
  await page.getByTestId('play').tap();
  const adv = page.getByTestId('adventure');
  await expect(adv).toBeVisible();
  const kinds: string[] = [];
  for (let step = 0; step < 120; step++) {
    // Phase and progress come from one snapshot so they can't disagree.
    const before = await signature(page);
    const phase = before.split('|')[0];
    if (phase === 'goodbye') return kinds;
    // The intro starts the first game by itself after Pearl's line.
    if (phase === 'intro') {
      // nothing to do
    } else if (phase === 'game') {
      const kind = (await adv.getAttribute('data-game-kind'))!;
      if (kinds[kinds.length - 1] !== kind) kinds.push(kind);
      await page.locator('[data-testid^="game-"]').waitFor();
      await answerCurrent(page);
    } else if (phase === 'reward') {
      if (await page.getByTestId('open-chest').isVisible()) await page.getByTestId('open-chest').tap({ force: true });
      else await page.getByTestId('reward-next').tap();
    }
    await waitForProgress(page, before);
  }
  throw new Error('Adventure did not finish');
}

export async function finishToHome(page: Page) {
  await expect(page.getByTestId('goodbye')).toBeVisible();
  await page.getByTestId('goodbye-home').tap();
  await expect(page.getByTestId('home')).toBeVisible();
}

/** Opens the grown-ups area by solving the no-PIN multiplication gate. */
export async function openParent(page: Page) {
  await page.goto('/#/parent');
  const label = await page.getByTestId('gate-label').textContent();
  const [, a, b] = label!.match(/(\d+) × (\d+)/)!;
  await page.getByTestId('gate-answer').fill(String(Number(a) * Number(b)));
  await page.getByTestId('gate-submit').click();
  await expect(page.getByTestId('parent-dashboard')).toBeVisible();
}

export async function spoken(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __sparkleSpoken: string[] }).__sparkleSpoken.slice());
}
