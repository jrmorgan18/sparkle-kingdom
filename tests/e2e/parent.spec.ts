import { expect, test } from '@playwright/test';
import { launch, openParent, readState } from './helpers';

test('grown-ups PIN: set, require, pause after wrong guesses, and reset via forgot-PIN', async ({ page }) => {
  await launch(page);
  const solveMath = async () => {
    const label = await page.getByTestId('gate-label').textContent();
    const [, a, b] = label!.match(/(\d+) × (\d+)/)!;
    expect(Number(a)).toBeGreaterThan(9);
    await page.getByTestId('gate-answer').fill(String(Number(a) * Number(b)));
    await page.getByTestId('gate-submit').click();
  };

  await page.getByTestId('parent-link').tap();
  await solveMath();
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('pin-reminder')).toBeVisible();
  await page.getByTestId('pin-new').fill('482915');
  await page.getByTestId('pin-repeat').fill('482916');
  await page.getByTestId('pin-save').click();
  await expect(page.getByTestId('pin-msg')).toContainText('don’t match');
  await page.getByTestId('pin-repeat').fill('482915');
  await page.getByTestId('pin-save').click();
  await expect(page.getByTestId('pin-msg')).toContainText('PIN saved');

  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.getByTestId('gate-label')).toHaveText('Enter the grown-ups PIN');
  for (const guess of ['1111', '2222', '3333']) {
    await page.getByTestId('gate-answer').fill(guess);
    await page.getByTestId('gate-submit').click();
  }
  await expect(page.getByTestId('gate-error')).toContainText('wait 30 seconds');
  await expect(page.getByTestId('gate-answer')).toBeDisabled();

  await page.clock.setFixedTime(new Date(Date.now() + 31_000));
  await page.reload();
  await page.getByTestId('gate-answer').fill('482915');
  await page.getByTestId('gate-submit').click();
  await expect(page.getByTestId('parent-dashboard')).toBeVisible();

  await page.reload();
  await page.getByTestId('forgot-pin').click();
  const label = await page.getByTestId('gate-label').textContent();
  expect(Number(label!.match(/(\d+) ×/)![1])).toBeGreaterThan(99);
  await solveMath();
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('pin-reminder')).toBeVisible();
});

test('record voices: progress count, and a clear fallback when microphone permission is denied', async ({ page }) => {
  await page.addInitScript(() => {
    const deny = () => Promise.reject(Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }));
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = deny;
    else Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: deny } });
    if (typeof (window as any).MediaRecorder === 'undefined') (window as any).MediaRecorder = class { static isTypeSupported() { return true; } };
  });
  await launch(page);
  await openParent(page);
  await page.getByTestId('tab-voices').click();
  await expect(page.getByTestId('record-progress')).toHaveText(/^0 of \d+ clips recorded$/);
  const total = Number((await page.getByTestId('record-progress').textContent())!.match(/of (\d+)/)![1]);
  expect(total).toBeGreaterThan(90);
  await expect(page.getByTestId('clip-w:see')).toBeVisible();
  await expect(page.getByTestId('clip-n:20')).toBeVisible();
  await expect(page.getByTestId('clip-p:findWord')).toBeVisible();

  await page.getByTestId('record-w:see').click();
  await expect(page.getByTestId('mic-error')).toContainText('built-in voice');
  await expect(page.getByTestId('clip-w:see')).not.toHaveAttribute('data-recorded', 'true');
  // The game still works with speech synthesis.
  await page.goto('/#/');
  await page.getByTestId('play').tap();
  await expect(page.getByTestId('game-jewels')).toBeVisible();
});

test('parent overrides: unlock a week early, relock it, and extend the counting range', async ({ page }) => {
  await launch(page);
  await openParent(page);
  await page.getByTestId('tab-words').click();
  await page.getByTestId('expand-week-3').click();
  await page.getByTestId('unlock-week-3').click();
  await expect(page.getByTestId('week-3')).toHaveAttribute('data-unlocked', 'true');
  await page.getByTestId('lock-week-3').click();
  await expect(page.getByTestId('week-3')).not.toHaveAttribute('data-unlocked', 'true');

  await page.getByTestId('tab-settings').click();
  await page.getByTestId('counting-max-30').click();
  await page.getByTestId('tab-voices').click();
  await expect(page.getByTestId('clip-n:30')).toBeVisible();
  await page.waitForTimeout(600);
  const s = await readState(page);
  expect(s.settings.countingMax).toBe(30);
  expect(s.weekProgress['week-3']).toMatchObject({ unlocked: false, lockedByParent: true });
});
