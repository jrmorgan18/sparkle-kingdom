import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { Button, Card, Screen } from '../../components/ui';
import { ParentTopBar } from './ParentTopBar';
import { checkPin, COOLDOWN_MS, makeChallenge, MAX_TRIES } from '../../lib/pin';
import { go, routes } from '../../lib/router';
import { act, useAppState } from '../../store/game';

/** Session-only unlock flag. This is a family "grown-ups only" gate, not real security. */
export const useParentGate = create<{ open: boolean; setOpen: (v: boolean) => void }>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

/** Wrong-attempt tracking lives outside the component so leaving and re-entering doesn't reset it. */
const attempts = { wrong: 0, lockedUntil: 0 };

type Mode = 'pin' | 'math' | 'reset';

export function ParentGate() {
  const s = useAppState();
  const setOpen = useParentGate((g) => g.setOpen);
  const hasPin = Boolean(s.settings.parentPinHash);
  const [mode, setMode] = useState<Mode>(hasPin ? 'pin' : 'math');
  const challenge = useMemo(() => makeChallenge(mode === 'reset' ? 'reset' : 'fallback'), [mode]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [, tick] = useState(0);

  const lockedMs = Math.max(0, attempts.lockedUntil - Date.now());
  useEffect(() => {
    if (!lockedMs) return;
    const t = setTimeout(() => tick((n) => n + 1), lockedMs + 50);
    return () => clearTimeout(t);
  }, [lockedMs]);

  const fail = () => {
    attempts.wrong++;
    setValue('');
    if (attempts.wrong >= MAX_TRIES) {
      attempts.wrong = 0;
      attempts.lockedUntil = Date.now() + COOLDOWN_MS;
      setError('Too many tries. Please wait 30 seconds.');
    } else setError(mode === 'pin' ? 'That PIN isn’t right.' : 'That’s not quite right. Try again.');
  };

  const succeed = () => {
    attempts.wrong = 0;
    if (mode === 'reset') act((d) => void (d.settings.parentPinHash = null));
    setOpen(true);
  };

  const submit = () => {
    if (lockedMs) return;
    if (mode === 'pin') return checkPin(value, s.settings.parentPinHash) ? succeed() : fail();
    return Number(value) === challenge.answer ? succeed() : fail();
  };

  const label = mode === 'pin' ? 'Enter the grown-ups PIN' : `What is ${challenge.a} × ${challenge.b}?`;

  return (
    <div className="parent-bg min-h-screen" data-testid="parent-gate">
      <ParentTopBar title="Grown-ups only" onBack={() => go(routes.home())} />
      <Screen>
        <Card className="mx-auto flex max-w-md flex-col gap-4">
          <p className="text-lg">
            {mode === 'reset' ? 'Forgot the PIN? Solve this to remove it. (Progress is not affected.)' : 'This area is for parents. Please answer to continue.'}
          </p>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label className="font-display text-2xl font-semibold" htmlFor="gate-answer" data-testid="gate-label">
              {label}
            </label>
            <input
              id="gate-answer"
              data-testid="gate-answer"
              type={mode === 'pin' ? 'password' : 'text'}
              inputMode="numeric"
              autoComplete="off"
              maxLength={mode === 'pin' ? 8 : 7}
              value={value}
              disabled={lockedMs > 0}
              onChange={(e) => {
                setValue(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              className="min-h-14 rounded-2xl border-4 border-ink/10 px-4 text-2xl tracking-widest focus:border-royal focus:outline-none disabled:opacity-50"
            />
            {(error || lockedMs > 0) && (
              <p className="font-semibold text-oops" data-testid="gate-error" aria-live="polite">
                {lockedMs > 0 ? 'Too many tries. Please wait 30 seconds.' : error}
              </p>
            )}
            <Button type="submit" size="lg" data-testid="gate-submit" disabled={lockedMs > 0 || !value}>
              Enter
            </Button>
          </form>
          {mode === 'pin' && (
            <button type="button" className="self-start text-sm text-ink-soft underline" onClick={() => (setMode('reset'), setValue(''), setError(''))} data-testid="forgot-pin">
              Forgot the PIN?
            </button>
          )}
          {mode === 'reset' && (
            <button type="button" className="self-start text-sm text-ink-soft underline" onClick={() => (setMode('pin'), setValue(''), setError(''))}>
              Back to PIN entry
            </button>
          )}
          {!hasPin && <p className="text-sm text-ink-soft">Tip: set a grown-ups PIN in Settings so this question isn’t needed.</p>}
        </Card>
      </Screen>
    </div>
  );
}
