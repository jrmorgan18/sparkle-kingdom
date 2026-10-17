import { expect, test } from '@playwright/test';
import { launch, openParent, readState, spoken } from './helpers';

test('Count the Jewels: each jewel counts once, then "How many?"', async ({ page }) => {
  await launch(page);
  await page.getByTestId('play').tap();
  await expect(page.getByTestId('game-jewels')).toBeVisible();
  const jewels = page.locator('[data-testid="jewel"]');
  expect(await jewels.count()).toBe(6);
  // Numeral choices only appear after counting.
  await expect(page.getByTestId('option')).toHaveCount(0);

  await jewels.nth(0).tap();
  await jewels.nth(0).tap(); // tapping a lit jewel again doesn't count it twice
  await expect(page.locator('[data-testid="jewel"][data-lit]')).toHaveCount(1);
  for (let i = 1; i < 6; i++) await jewels.nth(i).tap();
  await expect(page.locator('[data-testid="jewel"][data-lit]')).toHaveCount(6);
  await expect.poll(async () => (await spoken(page)).join(' | ')).toContain('six');

  await expect(page.getByTestId('option')).toHaveCount(3);
  await page.locator('[data-testid="option"][data-correct]').tap();
  await expect(page.getByTestId('game-next')).toBeVisible();
});

test('Pearl Necklace: gentle wiggle, replayed prompt, glowing hint after a second miss, and teen skips tracked', async ({ page }) => {
  await launch(page);
  await page.getByTestId('play').tap();
  // Get through the warm-up to the necklace.
  await expect(page.getByTestId('game-jewels')).toBeVisible();
  const jewels = page.locator('[data-testid="jewel"]');
  for (let i = 0; i < 6; i++) await jewels.nth(i).tap();
  await page.locator('[data-testid="option"][data-correct]').tap();
  for (let r = 0; r < 2; r++) {
    await expect(page.getByTestId('game-next')).toHaveAttribute('data-round', String(r));
    await page.locator('[data-testid="option"][data-correct]').tap();
  }
  const game = page.getByTestId('game-necklace');
  await expect(game).toHaveAttribute('data-round', '0');

  // The gap is spoken as "hmm?" inside the run.
  await expect.poll(async () => (await spoken(page)).join(' | ')).toContain('hmm? ');
  const gapValue = Number(await page.locator('[data-testid="option"][data-correct]').getAttribute('data-value'));

  // Wrong pick #1: the number AFTER the gap (a skip). No red X — it wiggles and the prompt replays.
  const before = (await spoken(page)).length;
  const skip = page.locator(`[data-testid="option"][data-value="${gapValue + 1}"]`);
  await skip.tap();
  await expect(skip).toHaveClass(/animate-wiggle/);
  await expect.poll(async () => (await spoken(page)).slice(before).join(' | ')).toContain('Which pearl is missing?');
  await expect(page.getByText(/wrong/i)).toHaveCount(0);
  await expect(page.locator('[data-testid="option"][data-correct]')).not.toHaveClass(/glow-hint/);

  // Wrong pick #2: the correct pearl glows.
  await page.locator('[data-testid="option"]:not([data-correct])').last().tap();
  await expect(page.locator('[data-testid="option"][data-correct]')).toHaveClass(/glow-hint/);
  await page.locator('[data-testid="option"][data-correct]').tap();
  await expect(game).toHaveAttribute('data-round', '1');

  await page.waitForTimeout(500);
  const s = await readState(page);
  const rec = s.skills[`n:seq:${gapValue}`];
  expect(rec).toMatchObject({ misses: 1, skips: 1, firstTryCorrect: 0 });

  await openParent(page);
  await expect(page.getByTestId('shaky-teens')).toContainText(`${gapValue}`);
  await expect(page.getByTestId('shaky-teens')).toContainText('skipped 1×');
});
