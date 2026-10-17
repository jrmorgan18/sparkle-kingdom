import { expect, test } from '@playwright/test';
import { DAY, finishToHome, launch, openParent, playAdventure, readState, START } from './helpers';

test('first launch: home has only Play, Dress Up, Decorate; the first adventure is the placement check', async ({ page }) => {
  await launch(page);
  // Child-facing controls are pictures; the grown-ups lock is the only other control.
  const buttons = page.getByTestId('home').locator('button');
  await expect(page.getByTestId('play')).toBeVisible();
  await expect(page.getByTestId('dress-up')).toBeVisible();
  await expect(page.getByTestId('decorate')).toBeVisible();
  await expect(page.getByTestId('parent-link')).toBeVisible();
  expect(await buttons.count()).toBe(5); // Pearl (tap to hear her), Play, Dress Up, Decorate, grown-ups lock

  await page.getByTestId('play').tap();
  await expect(page.getByTestId('adventure')).toHaveAttribute('data-placement', 'true');
  await page.goto('/#/');
  const kinds = await playAdventure(page);
  expect(kinds).toEqual(['jewels', 'next', 'necklace', 'shell']);
  await finishToHome(page);

  const s = await readState(page);
  expect(s.placement).toMatchObject({ baselineOk: true, shakyTeens: [] });
  expect(s.placement.solidTeens).toEqual([12, 13, 14, 15, 17, 19]);
  expect(s.sessions).toHaveLength(1);
  expect(Object.keys(s.owned)).toHaveLength(1); // one reward for finishing — none for tapping

  await openParent(page);
  await expect(page.getByTestId('placement-summary')).toContainText('1–10 baseline solid');
});

test('a full regular adventure: alternating word and number games, reward chest, gentle ending, then Pearl rests', async ({ page }) => {
  await launch(page);
  await playAdventure(page); // placement
  await finishToHome(page);
  const kinds = await playAdventure(page);
  expect(kinds).toHaveLength(4); // 5-minute default
  kinds.forEach((k, i) => expect(['shell', 'bubble', 'invite', 'match'].includes(k)).toBe(i % 2 === 0));
  await expect(page.getByTestId('goodbye')).toBeVisible();
  await finishToHome(page);

  const s = await readState(page);
  expect(s.sessions).toHaveLength(2);
  expect(s.sessions.every((x: any) => x.endedAt)).toBe(true);
  expect(Object.keys(s.owned)).toHaveLength(2);

  // Two adventures a day by default: Pearl is sleeping now, but dress-up and decorating stay open.
  await page.getByTestId('play').tap();
  await expect(page.getByTestId('sleeping')).toBeVisible();

  // Next morning she's awake again.
  await page.clock.setFixedTime(new Date(START.getTime() + DAY));
  await page.goto('/#/');
  await page.reload();
  await page.getByTestId('play').tap();
  await expect(page.getByTestId('adventure')).toBeVisible();
});

test('learning a word takes first-try answers on two different days', async ({ page }) => {
  await launch(page);
  await playAdventure(page); // placement: meets "I" and "a"
  await finishToHome(page);
  await playAdventure(page); // more correct answers the same day
  await finishToHome(page);

  let s = await readState(page);
  expect(s.skills['w:i'].firstTryCorrect).toBeGreaterThan(0);
  expect(s.skills['w:i'].learnedAt).toBeNull(); // same day doesn't count

  await page.clock.setFixedTime(new Date(START.getTime() + DAY));
  await page.reload();
  await playAdventure(page);
  await finishToHome(page);

  s = await readState(page);
  for (const id of ['i', 'a', 'see']) {
    expect(s.skills[`w:${id}`].learnedAt, id).not.toBeNull();
    expect(s.skills[`w:${id}`].correctDays).toHaveLength(2);
  }
  // Week 1 learned → week 2 unlocked automatically.
  expect(s.weekProgress['week-2'].unlocked).toBe(true);

  await openParent(page);
  await page.getByTestId('tab-mastery').click();
  await expect(page.getByTestId('word-row-see')).toHaveAttribute('data-status', 'learned');
  await expect(page.getByTestId('word-row-the')).toHaveAttribute('data-status', 'new');
});

test('progress survives a reload in the middle of an adventure', async ({ page }) => {
  await launch(page);
  await page.getByTestId('play').tap();
  await expect(page.getByTestId('game-jewels')).toBeVisible();
  const jewels = page.locator('[data-testid="jewel"]');
  const n = await jewels.count();
  for (let i = 0; i < n; i++) await jewels.nth(i).tap();
  await page.locator('[data-testid="option"][data-correct]').tap();
  await page.waitForTimeout(600);
  await page.reload();
  const s = await readState(page);
  expect(s.skills['n:count:6']).toMatchObject({ attempts: 1, firstTryCorrect: 1 });
  expect(s.sessions[0].endedAt).toBeNull();
});
