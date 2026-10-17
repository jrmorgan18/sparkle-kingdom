/**
 * Single source of "now" for the whole app. Engine functions take `now` as a parameter so they are
 * testable; UI code calls `now()`. Browser tests control time with Playwright's page.clock API,
 * which overrides Date.now underneath this.
 */
export function now(): number {
  return Date.now();
}

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
