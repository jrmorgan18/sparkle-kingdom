/** Minimal hash router: works on any static host with no server rewrites, and survives reloads. */
import { useSyncExternalStore } from 'react';

function current(): string {
  return window.location.hash.replace(/^#\/?/, '');
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): string[] {
  const path = useSyncExternalStore(subscribe, current, () => '');
  return path.split('/').filter(Boolean).map(decodeURIComponent);
}

export function go(path: string): void {
  const target = `#/${path.replace(/^\/+/, '')}`;
  if (window.location.hash !== target) window.location.hash = target;
  window.scrollTo({ top: 0 });
}

export function back(fallback = ''): void {
  if (window.history.length > 1) window.history.back();
  else go(fallback);
}

export const routes = {
  home: () => '',
  play: () => 'play',
  dressUp: () => 'dress-up',
  collection: () => 'collection',
  decorate: (sceneId?: string) => (sceneId ? `decorate/${sceneId}` : 'decorate'),
  parent: () => 'parent',
};
