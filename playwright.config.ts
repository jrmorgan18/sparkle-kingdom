import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  // Full adventures are long, and WebKit on Windows is slow under parallel load.
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: 4,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4174',
    trace: 'retain-on-failure',
    // Gentle pulses/bobs never look "stable" to Playwright; reduced motion also exercises that setting.
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    // Android tablet (Chromium, touch, landscape)
    { name: 'android-tablet', use: { ...devices['Galaxy Tab S4 landscape'] } },
    // iPad (WebKit, touch, portrait)
    { name: 'ipad', use: { ...devices['iPad (gen 7)'] } },
  ],
});
