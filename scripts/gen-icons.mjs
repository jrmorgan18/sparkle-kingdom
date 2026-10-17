// Renders public/favicon.svg to the PNG icons needed for iOS/Android home-screen install.
// Uses Playwright's Chromium (already a dev dependency), so no extra image tooling is required.
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const targets = [
  { file: 'apple-touch-icon.png', size: 180, pad: 0 },
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'icon-512-maskable.png', size: 512, pad: 0.12 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2));
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:#ffd6ec;display:flex;align-items:center;justify-content:center;width:${t.size}px;height:${t.size}px">` +
      `<div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
  );
  await writeFile(new URL(`../public/${t.file}`, import.meta.url), await page.screenshot({ type: 'png' }));
  console.log('wrote', t.file);
}
await browser.close();
