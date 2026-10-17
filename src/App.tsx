import { useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { Character } from './art/characters';
import { configureVoice, unlockAudio } from './audio/player';
import { Button } from './components/ui';
import type { SceneId } from './engine/types';
import { SCENE_IDS } from './engine/seed';
import { useRoute } from './lib/router';
import { setSoundEnabled } from './lib/sound';
import { useGame } from './store/game';
import { AdventureScreen } from './screens/Adventure';
import { Collection } from './screens/Collection';
import { SceneEditor, ScenePicker } from './screens/Decorate';
import { DressUp } from './screens/DressUp';
import { Home } from './screens/Home';
import { ParentArea } from './screens/parent/ParentDashboard';

function Router() {
  const [a, b] = useRoute();
  if (a === 'play') return <AdventureScreen />;
  if (a === 'dress-up') return <DressUp />;
  if (a === 'collection') return <Collection />;
  if (a === 'parent') return <ParentArea />;
  if (a === 'decorate') return b && SCENE_IDS.includes(b as SceneId) ? <SceneEditor key={b} sceneId={b as SceneId} /> : <ScenePicker />;
  return <Home />;
}

/**
 * Make pinch, long-press, and double-tap harmless during play: block iOS gesture zoom and the
 * long-press context menu (the parent area keeps normal text behavior for its forms).
 */
function useChildSafeGestures() {
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const onMenu = (e: Event) => {
      if (!(e.target as HTMLElement)?.closest?.('[data-testid="parent-dashboard"], [data-testid="parent-gate"]')) e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener('gesturestart', block);
    document.addEventListener('contextmenu', onMenu);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    // The first touch anywhere unlocks audio on iOS.
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => {
      document.removeEventListener('gesturestart', block);
      document.removeEventListener('contextmenu', onMenu);
      document.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('pointerdown', unlock);
    };
  }, []);
}

export function App() {
  const state = useGame((g) => g.state);
  const error = useGame((g) => g.error);
  const init = useGame((g) => g.init);
  const resetAll = useGame((g) => g.resetAll);
  const rawDoc = useGame((g) => g.rawDoc);

  useEffect(() => {
    void init();
  }, [init]);
  useChildSafeGestures();

  const motion = state?.settings.motion ?? 'system';
  useEffect(() => {
    document.documentElement.classList.toggle('motion-reduced', motion === 'reduced');
    document.documentElement.classList.toggle('motion-full', motion === 'full');
  }, [motion]);
  useEffect(() => setSoundEnabled(state?.settings.soundOn ?? true), [state?.settings.soundOn]);
  useEffect(() => configureVoice({ on: state?.settings.voiceOn ?? true, rate: state?.settings.speechRate ?? 0.85 }), [state?.settings.voiceOn, state?.settings.speechRate]);

  if (error) {
    return (
      <main className="mx-auto flex max-w-xl flex-col items-center gap-4 p-8 text-center">
        <Character id="pearl" className="w-32" />
        <h1 className="text-3xl font-bold">The saved game couldn’t be loaded</h1>
        <p className="text-ink-soft">{error}</p>
        {rawDoc != null && (
          <Button
            variant="secondary"
            onClick={() => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([JSON.stringify(rawDoc)], { type: 'application/json' }));
              a.download = 'sparkle-kingdom-unreadable-save.json';
              a.click();
            }}
          >
            Download the saved data
          </Button>
        )}
        <Button variant="danger" onClick={() => window.confirm('Start fresh? Saved progress on this device will be replaced.') && void resetAll()}>
          Start fresh
        </Button>
      </main>
    );
  }

  if (!state) {
    return (
      <div className="kingdom-bg flex min-h-screen flex-col items-center justify-center gap-4" aria-busy="true">
        <Character id="pearl" className="h-48 w-auto animate-gentle-pulse" />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion={motion === 'reduced' ? 'always' : motion === 'full' ? 'never' : 'user'}>
      <Router />
    </MotionConfig>
  );
}
