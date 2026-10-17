import { expect, test } from '@playwright/test';
import { launch, seed } from './helpers';

test('no horizontal overflow, and child touch targets are at least 72px', async ({ page }) => {
  await launch(page);
  await seed(page, (s) => {
    for (const id of ['dr-gold-crown', 'dr-coral-tail', 'st-pink-shell', 'st-crab']) s.owned[id] = { at: 1, source: 'earned' };
  });
  for (const route of ['', 'play', 'dress-up', 'collection', 'decorate', 'decorate/lagoon', 'decorate/ballroom']) {
    await page.goto(`/#/${route}`);
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, route || 'home').toBeLessThanOrEqual(1);
    // Every visible button in child areas is at least 72px in both directions (parent lock excepted).
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter((b) => !b.closest('[data-testid="parent-dashboard"]') && b.getAttribute('data-testid') !== 'parent-link' && !b.classList.contains('sr-only'))
        .map((b) => ({ id: b.getAttribute('data-testid') ?? b.getAttribute('aria-label'), r: b.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.height > 0 && (r.width < 71.5 || r.height < 71.5))
        .map(({ id, r }) => `${id} ${Math.round(r.width)}x${Math.round(r.height)}`),
    );
    expect(small, route || 'home').toEqual([]);
  }
});
