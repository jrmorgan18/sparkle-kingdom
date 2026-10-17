/**
 * Record voices: every clip the game uses, with record / play / re-record / delete. Recorded clips
 * replace the built-in voice immediately; anything not recorded keeps using speech synthesis.
 */
import { useEffect, useRef, useState } from 'react';
import { clipCatalog, SECTION_TITLES, type ClipDef, type ClipSection } from '../../audio/clips';
import { removeRecording, saveRecording, say, speechSupported, stopSpeaking, useClips } from '../../audio/player';
import { RECORDER_MESSAGES, recordingSupported, startRecording, type ActiveRecording, type RecorderError } from '../../audio/recorder';
import { Button, Pill } from '../../components/ui';
import { now } from '../../lib/clock';
import { useAppState } from '../../store/game';
import { Section } from './ParentDashboard';

const SECTIONS: ClipSection[] = ['words', 'numbers', 'prompts', 'praise', 'sentence-words'];

export function VoicesPanel() {
  const s = useAppState();
  const catalog = clipCatalog(s.curriculum, s.settings.countingMax);
  const recorded = useClips((c) => c.ids);
  const done = catalog.filter((c) => recorded.has(c.clip)).length;
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<RecorderError | null>(recordingSupported() ? null : 'unsupported');
  const rec = useRef<ActiveRecording | null>(null);

  useEffect(
    () => () => {
      rec.current?.cancel();
      stopSpeaking();
    },
    [],
  );

  const start = async (clip: ClipDef) => {
    if (rec.current) return;
    setError(null);
    stopSpeaking();
    try {
      setActive(clip.clip);
      rec.current = await startRecording(() => void stop(clip));
    } catch (e) {
      setActive(null);
      rec.current = null;
      setError((e as { kind?: RecorderError }).kind ?? 'failed');
    }
  };

  const stop = async (clip: ClipDef) => {
    const r = rec.current;
    if (!r) return;
    rec.current = null;
    const blob = await r.stop();
    setActive(null);
    if (blob.size > 0) {
      await saveRecording(clip.clip, blob, now());
      void say([clip]);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Section title="Record voices">
        <p>
          Your voice is the best teacher. Record each clip below and the game will use it right away. Anything you haven’t recorded uses the device’s built-in voice
          {speechSupported() ? '' : ' (not available in this browser — unrecorded clips will be silent)'}.
        </p>
        <p className="text-sm text-ink-soft">Prompts are joined from small clips: “Find the word” + “see”. Say each clip clearly with a short pause before and after. Clips stop automatically after 8 seconds.</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-4 min-w-48 flex-1 overflow-hidden rounded-full bg-blush">
            <div className="h-full bg-rose" style={{ width: `${(done / Math.max(1, catalog.length)) * 100}%` }} />
          </div>
          <b data-testid="record-progress">
            {done} of {catalog.length} clips recorded
          </b>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="h-5 w-5" />
            Show only clips not recorded yet
          </label>
        </div>
        {error && (
          <p className="rounded-2xl bg-[#fff0e0] p-3 font-semibold text-oops" data-testid="mic-error" role="alert">
            {RECORDER_MESSAGES[error]}
          </p>
        )}
      </Section>
      {SECTIONS.map((sec) => {
        const items = catalog.filter((c) => c.section === sec && (!onlyMissing || !recorded.has(c.clip)));
        if (!items.length) return null;
        return (
          <Section key={sec} title={SECTION_TITLES[sec]}>
            <ul className="flex flex-col divide-y divide-ink/5">
              {items.map((c) => {
                const has = recorded.has(c.clip);
                const isActive = active === c.clip;
                return (
                  <li key={c.clip} className="flex flex-wrap items-center gap-3 py-2" data-testid={`clip-${c.clip}`} data-recorded={has || undefined}>
                    <span className="min-w-32 flex-1">
                      <b className="font-display text-xl">{c.text}</b>
                      {c.hint && <span className="ml-2 text-sm text-ink-soft">{c.hint}</span>}
                    </span>
                    {has ? <Pill className="bg-good-light text-good">Your voice</Pill> : <Pill className="bg-[#eee9f5] text-ink-soft">Built-in voice</Pill>}
                    <Button size="sm" variant="secondary" aria-label={`Play ${c.text}`} onClick={() => void say([c])} disabled={isActive}>
                      ▶ Play
                    </Button>
                    {isActive ? (
                      <Button size="sm" variant="danger" className="animate-gentle-pulse" onClick={() => void stop(c)} data-testid="record-stop">
                        ■ Stop
                      </Button>
                    ) : (
                      <Button size="sm" variant="rose" onClick={() => void start(c)} disabled={Boolean(active) || error === 'unsupported'} data-testid={`record-${c.clip}`}>
                        ● {has ? 'Re-record' : 'Record'}
                      </Button>
                    )}
                    {has && !isActive && (
                      <Button size="sm" variant="ghost" onClick={() => void removeRecording(c.clip)} aria-label={`Delete recording of ${c.text}`}>
                        Delete
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        );
      })}
    </div>
  );
}
