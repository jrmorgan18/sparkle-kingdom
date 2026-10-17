import { expect, test } from '@playwright/test';
import { finishToHome, launch, playAdventure, readState, seed } from './helpers';

test('earn a dress-up item from an adventure, equip it, save a look, and keep it after reload', async ({ page }) => {
  await launch(page);
  await playAdventure(page);
  const s = await readState(page);
  const earned = Object.keys(s.owned)[0];
  expect(earned).toBe('dr-gold-crown');
  await finishToHome(page);

  await page.getByTestId('dress-up').tap();
  await expect(page.getByTestId('dress-up-screen')).toHaveAttribute('data-character', 'pearl');
  await page.getByTestId('slot-crown').tap();
  const item = page.getByTestId('wear-dr-gold-crown');
  await item.tap();
  await expect(item).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('save-look').tap();
  await expect(page.getByTestId('look')).toHaveCount(1);

  // The treasure chest shows the earned crown; everything else is a sparkly silhouette.
  await page.getByTestId('open-collection').tap();
  await expect(page.getByTestId('collect-dr-gold-crown')).toHaveAttribute('data-owned', 'true');
  await expect(page.getByTestId('collect-st-pink-shell')).toHaveAttribute('data-owned', 'false');

  await page.waitForTimeout(600);
  await page.goto('/#/dress-up');
  await page.reload();
  await page.getByTestId('slot-crown').tap();
  await expect(page.getByTestId('wear-dr-gold-crown')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('look')).toHaveCount(1);
  // Taking it off doesn't lose it.
  await page.getByTestId('wear-dr-gold-crown').tap();
  await expect(page.getByTestId('wear-dr-gold-crown')).toHaveAttribute('aria-pressed', 'false');
});

test('decorate a scene: tap-to-place, drag, resize, layer, remove, reset with confirmation, reload', async ({ page }) => {
  await launch(page);
  await seed(page, (s) => {
    s.owned['st-pink-shell'] = { at: 1, source: 'earned' };
    s.owned['st-seahorse'] = { at: 1, source: 'earned' };
  });
  await page.getByTestId('decorate').tap();
  await page.getByTestId('scene-castle').tap();
  const canvas = page.getByTestId('scene-canvas');
  await expect(canvas).toBeVisible();

  await page.getByTestId('tray-st-pink-shell').tap();
  const box = (await canvas.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width * 0.3, box.y + box.height * 0.6);
  await expect(page.getByTestId('placed-sticker')).toHaveCount(1);

  await page.getByTestId('tray-st-seahorse').tap();
  await page.getByTestId('place-center').tap();
  await expect(page.getByTestId('placed-sticker')).toHaveCount(2);
  await page.getByTestId('tool-bigger').tap();
  await page.getByTestId('tool-back').tap();

  const first = page.locator('[data-sticker="st-pink-shell"]');
  const fb = (await first.boundingBox())!;
  await page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3, { steps: 8 });
  await page.mouse.up();
  const moved = (await first.boundingBox())!;
  expect(moved.x + moved.width / 2).toBeGreaterThan(box.x + box.width * 0.75);
  expect(moved.x + moved.width / 2).toBeLessThan(box.x + box.width * 0.85);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);

  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.getByTestId('placed-sticker')).toHaveCount(2);
  const after = (await page.locator('[data-sticker="st-pink-shell"]').boundingBox())!;
  expect(Math.abs(after.x + after.width / 2 - (moved.x + moved.width / 2))).toBeLessThan(4);

  // Removing a sticker keeps it in the tray.
  await page.locator('[data-sticker="st-seahorse"]').click();
  await page.getByTestId('tool-remove').tap();
  await expect(page.getByTestId('placed-sticker')).toHaveCount(1);
  await expect(page.getByTestId('tray-st-seahorse')).toBeVisible();

  await page.getByTestId('reset-scene').tap();
  await page.getByTestId('reset-no').tap();
  await expect(page.getByTestId('placed-sticker')).toHaveCount(1);
  await page.getByTestId('reset-scene').tap();
  await page.getByTestId('reset-yes').tap();
  await expect(page.getByTestId('placed-sticker')).toHaveCount(0);
});
