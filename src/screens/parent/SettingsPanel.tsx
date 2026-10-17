import { useState } from 'react';
import { p } from '../../audio/clips';
import { say, speechSupported } from '../../audio/player';
import { Button } from '../../components/ui';
import { COUNTING_MAX_OPTIONS, SESSION_MINUTES_OPTIONS } from '../../engine/config';
import { parentSetCountingMax } from '../../engine/parent';
import type { Settings } from '../../engine/types';
import { hashPin, PIN_MAX, PIN_MIN, validPin } from '../../lib/pin';
import { act, useAppState } from '../../store/game';
import { Section } from './ParentDashboard';

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-ink/5 py-3 first:border-t-0">
      <div className="min-w-56 flex-1">
        <div className="font-semibold">{label}</div>
        {hint && <div className="text-sm text-ink-soft">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Choice<T extends string | number>({ value, options, onChange, testid, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; testid: string; label: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          data-testid={`${testid}-${o.v}`}
          aria-label={label(o.v)}
          onClick={() => onChange(o.v)}
          className={`min-h-11 rounded-xl px-4 font-display font-semibold ${value === o.v ? 'bg-royal text-white' : 'bg-blush text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPanel() {
  const s = useAppState();
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => act((d) => void (d.settings[k] = v));
  return (
    <div className="flex flex-col gap-5">
      <Section title="Play">
        <Row label="Child’s name" hint="Used for saved picture names only.">
          <input value={s.settings.childName} onChange={(e) => set('childName', e.target.value.slice(0, 30))} className="rounded-xl border-2 border-ink/10 px-3 py-2" data-testid="child-name" />
        </Row>
        <Row label="Adventure length" hint="About 3, 5, or 8 minutes (3, 4, or 6 mini-games).">
          <Choice value={s.settings.sessionMinutes} options={SESSION_MINUTES_OPTIONS.map((v) => ({ v, label: `${v} min` }))} onChange={(v) => set('sessionMinutes', v)} testid="session-minutes" label={(v) => `${v} minutes`} />
        </Row>
        <Row label="Adventures per day" hint="After this many, Pearl goes to sleep until tomorrow (dress-up and decorating stay open).">
          <Choice value={s.settings.sessionsPerDay} options={[1, 2, 3, 0].map((v) => ({ v, label: v === 0 ? 'No limit' : String(v) }))} onChange={(v) => set('sessionsPerDay', v)} testid="sessions-per-day" label={(v) => (v ? `${v} per day` : 'No limit')} />
        </Row>
        <Row label="Counting range" hint="Numbers up to this are practiced. 11 and up are the focus; 1–10 are warm-ups.">
          <Choice value={s.settings.countingMax} options={COUNTING_MAX_OPTIONS.map((v) => ({ v, label: `Up to ${v}` }))} onChange={(v) => act((d) => parentSetCountingMax(d, v))} testid="counting-max" label={(v) => `Count up to ${v}`} />
        </Row>
      </Section>
      <Section title="Sound & motion">
        <Row label="Sound effects">
          <Choice value={s.settings.soundOn ? 'on' : 'off'} options={[{ v: 'on', label: 'On' }, { v: 'off', label: 'Off' }]} onChange={(v) => set('soundOn', v === 'on')} testid="sound" label={(v) => `Sound ${v}`} />
        </Row>
        <Row label="Spoken prompts" hint={speechSupported() ? 'Your recordings first, then the built-in voice.' : 'The built-in voice isn’t available in this browser; only your recordings will play.'}>
          <Choice value={s.settings.voiceOn ? 'on' : 'off'} options={[{ v: 'on', label: 'On' }, { v: 'off', label: 'Off' }]} onChange={(v) => set('voiceOn', v === 'on')} testid="voice" label={(v) => `Voice ${v}`} />
        </Row>
        <Row label="Built-in voice speed">
          <input type="range" min={0.6} max={1.1} step={0.05} value={s.settings.speechRate} onChange={(e) => set('speechRate', Number(e.target.value))} aria-label="Voice speed" />
          <Button size="sm" variant="secondary" onClick={() => void say([p('welcome')])}>
            Test voice
          </Button>
        </Row>
        <Row label="Animations" hint="“Calm” turns off bubbles drifting, sparkles, and twirls.">
          <Choice
            value={s.settings.motion}
            options={[
              { v: 'system', label: 'Follow device' },
              { v: 'reduced', label: 'Calm' },
              { v: 'full', label: 'Full' },
            ]}
            onChange={(v) => set('motion', v)}
            testid="motion"
            label={(v) => `Motion ${v}`}
          />
        </Row>
      </Section>
      <PinSection />
    </div>
  );
}

function PinSection() {
  const s = useAppState();
  const [pin, setPin] = useState('');
  const [repeat, setRepeat] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <Section title="Grown-ups PIN">
      {!s.settings.parentPinHash && (
        <p className="rounded-2xl bg-gold-light p-3" data-testid="pin-reminder">
          No PIN yet — the gate is asking a multiplication question. Set a PIN to make it simpler for you and harder for little fingers.
        </p>
      )}
      <p className="text-sm text-ink-soft">
        {PIN_MIN}–{PIN_MAX} digits. Saved as a salted hash, not the digits. This is a family gate, not security. Forgot it? The gate has a “Forgot the PIN?” link.
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!validPin(pin)) return setMsg(`Use ${PIN_MIN}–${PIN_MAX} digits.`);
          if (pin !== repeat) return setMsg('The two PINs don’t match.');
          act((d) => void (d.settings.parentPinHash = hashPin(pin)));
          setPin('');
          setRepeat('');
          setMsg('PIN saved.');
        }}
      >
        <label className="flex flex-col text-sm">
          New PIN
          <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_MAX))} className="rounded-xl border-2 border-ink/10 px-3 py-2 text-lg" data-testid="pin-new" />
        </label>
        <label className="flex flex-col text-sm">
          Repeat PIN
          <input type="password" inputMode="numeric" value={repeat} onChange={(e) => setRepeat(e.target.value.replace(/\D/g, '').slice(0, PIN_MAX))} className="rounded-xl border-2 border-ink/10 px-3 py-2 text-lg" data-testid="pin-repeat" />
        </label>
        <Button type="submit" data-testid="pin-save">
          Save PIN
        </Button>
        {s.settings.parentPinHash && (
          <Button variant="secondary" onClick={() => (act((d) => void (d.settings.parentPinHash = null)), setMsg('PIN removed.'))}>
            Remove PIN
          </Button>
        )}
      </form>
      {msg && (
        <p className="font-semibold" data-testid="pin-msg" aria-live="polite">
          {msg}
        </p>
      )}
    </Section>
  );
}
