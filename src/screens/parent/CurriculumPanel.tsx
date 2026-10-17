import { useState } from 'react';
import { PictureArt } from '../../art/pictures';
import { Button, Pill } from '../../components/ui';
import { wordKey } from '../../engine/mastery';
import {
  parentAddWeek,
  parentAddWord,
  parentDeleteWeek,
  parentMarkWeekLearned,
  parentMoveWeek,
  parentMoveWord,
  parentMoveWordToWeek,
  parentRemoveWord,
  parentReplaceWord,
  parentSetWeekLocked,
  parentUpdateWord,
  type EditError,
  type WordInput,
} from '../../engine/parent';
import { currentWeek, weekLearned } from '../../engine/weeks';
import { PICTURE_IDS, PICTURE_LABELS, type PictureId } from '../../data/pictures';
import { act, useAppState } from '../../store/game';
import { Section } from './ParentDashboard';
import { StatusPill } from './ProgressPanels';

const ERRORS: Record<EditError, string> = {
  'empty-word': 'Type a word.',
  'empty-sentence': 'Type a short example sentence.',
  'word-not-in-sentence': 'The sentence must include the word (so she can find it in Royal Invitation).',
  duplicate: 'That word is already in another week.',
  'no-week': 'That week no longer exists.',
};

export function CurriculumPanel() {
  const s = useAppState();
  const cur = currentWeek(s);
  const [open, setOpen] = useState<string | null>(cur?.id ?? null);
  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Weekly sight words"
        right={
          <Button variant="secondary" data-testid="add-week" onClick={() => setOpen(act((d, t) => parentAddWeek(d, t)))}>
            + Add a week
          </Button>
        }
      >
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-6 w-6" checked={s.config.autoUnlockWeeks} onChange={(e) => act((d) => void (d.config.autoUnlockWeeks = e.target.checked))} data-testid="auto-unlock" />
          <span>Unlock the next week automatically when this week’s words are learned</span>
        </label>
        <p className="text-sm text-ink-soft">Changes never erase learning history. A removed or replaced word keeps its record, and re-adding it brings the record back.</p>
        <div className="flex flex-col gap-2">
          {s.curriculum.weeks.map((w, i) => {
            const wp = s.weekProgress[w.id];
            const isOpen = open === w.id;
            return (
              <div key={w.id} className="rounded-2xl bg-blush" data-testid={`week-${i + 1}`} data-unlocked={wp?.unlocked || undefined}>
                <button type="button" className="flex min-h-14 w-full flex-wrap items-center gap-2 px-4 py-2 text-left" onClick={() => setOpen(isOpen ? null : w.id)} data-testid={`expand-week-${i + 1}`} aria-expanded={isOpen}>
                  <b className="font-display text-xl">Week {i + 1}</b>
                  <span className="font-display text-lg">{w.wordIds.map((id) => s.curriculum.words[id]?.text).join(' · ') || '(empty)'}</span>
                  <span className="flex-1" />
                  {cur?.id === w.id && <Pill className="bg-rose-light text-rose-dark">Current</Pill>}
                  {weekLearned(s, w) && <Pill className="bg-good-light text-good">Learned</Pill>}
                  <Pill className={wp?.unlocked ? 'bg-lagoon-light text-lagoon-dark' : 'bg-[#eee9f5] text-ink-soft'}>{wp?.unlocked ? 'Unlocked' : wp?.lockedByParent ? 'Locked by you' : 'Locked'}</Pill>
                </button>
                {isOpen && <WeekEditor weekId={w.id} index={i} onDeleted={() => setOpen(null)} />}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function WeekEditor({ weekId, index, onDeleted }: { weekId: string; index: number; onDeleted: () => void }) {
  const s = useAppState();
  const week = s.curriculum.weeks.find((w) => w.id === weekId)!;
  const wp = s.weekProgress[weekId];
  const [adding, setAdding] = useState(false);
  const last = s.curriculum.weeks.length - 1;
  return (
    <div className="flex flex-col gap-3 border-t border-ink/5 p-4">
      <div className="flex flex-wrap gap-2">
        {wp?.unlocked ? (
          <Button size="sm" variant="secondary" data-testid={`lock-week-${index + 1}`} onClick={() => act((d, t) => parentSetWeekLocked(d, weekId, true, t))}>
            Relock week
          </Button>
        ) : (
          <Button size="sm" variant="lagoon" data-testid={`unlock-week-${index + 1}`} onClick={() => act((d, t) => parentSetWeekLocked(d, weekId, false, t))}>
            Unlock week
          </Button>
        )}
        <Button size="sm" variant="secondary" data-testid={`mark-week-${index + 1}`} disabled={!week.wordIds.length || weekLearned(s, week)} onClick={() => act((d, t) => parentMarkWeekLearned(d, weekId, t))}>
          Mark all learned
        </Button>
        <Button size="sm" variant="secondary" disabled={index === 0} onClick={() => act((d) => parentMoveWeek(d, weekId, -1))}>
          ↑ Move week earlier
        </Button>
        <Button size="sm" variant="secondary" disabled={index === last} onClick={() => act((d) => parentMoveWeek(d, weekId, 1))}>
          ↓ Move week later
        </Button>
        {!week.wordIds.length && (
          <Button size="sm" variant="danger" onClick={() => act((d) => parentDeleteWeek(d, weekId)) && onDeleted()}>
            Delete empty week
          </Button>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {week.wordIds.map((id, k) => (
          <WordRow key={id} weekId={weekId} wordId={id} first={k === 0} lastWord={k === week.wordIds.length - 1} weekIndex={index} lastWeek={index === last} />
        ))}
      </ul>
      {adding ? (
        <WordForm
          submitLabel="Add word"
          onCancel={() => setAdding(false)}
          onSubmit={(input) => {
            const r = act((d) => parentAddWord(d, weekId, input));
            if (!r.error) setAdding(false);
            return r.error ?? null;
          }}
        />
      ) : (
        <Button size="sm" variant="secondary" className="self-start" data-testid={`add-word-${index + 1}`} onClick={() => setAdding(true)}>
          + Add a word to this week
        </Button>
      )}
    </div>
  );
}

function WordRow({ weekId, wordId, first, lastWord, weekIndex, lastWeek }: { weekId: string; wordId: string; first: boolean; lastWord: boolean; weekIndex: number; lastWeek: boolean }) {
  const s = useAppState();
  const w = s.curriculum.words[wordId];
  const [mode, setMode] = useState<'view' | 'edit' | 'replace'>('view');
  if (!w) return null;
  return (
    <li className="rounded-2xl bg-white p-3" data-testid={`edit-word-${wordId}`}>
      <div className="flex flex-wrap items-center gap-3">
        {w.picture ? <PictureArt id={w.picture} className="h-12 w-12" /> : <span className="h-12 w-12 rounded-xl bg-blush" />}
        <b className="font-display text-2xl">{w.text}</b>
        <span className="text-ink-soft">“{w.sentence}”</span>
        <StatusPill rec={s.skills[wordKey(wordId)]} />
        {w.customized && <Pill className="bg-gold-light text-ink">Edited</Pill>}
        <span className="flex-1" />
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" aria-label="Move up" disabled={first} onClick={() => act((d) => parentMoveWord(d, weekId, wordId, -1))}>
            ↑
          </Button>
          <Button size="sm" variant="ghost" aria-label="Move down" disabled={lastWord} onClick={() => act((d) => parentMoveWord(d, weekId, wordId, 1))}>
            ↓
          </Button>
          <Button size="sm" variant="ghost" disabled={weekIndex === 0} onClick={() => act((d) => parentMoveWordToWeek(d, weekId, wordId, -1))}>
            To week {weekIndex}
          </Button>
          <Button size="sm" variant="ghost" disabled={lastWeek} onClick={() => act((d) => parentMoveWordToWeek(d, weekId, wordId, 1))}>
            To week {weekIndex + 2}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')} data-testid={`edit-${wordId}`}>
            Edit
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setMode(mode === 'replace' ? 'view' : 'replace')} data-testid={`replace-${wordId}`}>
            Replace
          </Button>
          <Button size="sm" variant="secondary" onClick={() => act((d) => parentRemoveWord(d, weekId, wordId))} data-testid={`remove-${wordId}`}>
            Remove
          </Button>
        </div>
      </div>
      {mode === 'edit' && (
        <WordForm
          fixedWord={w.text}
          initial={{ text: w.text, sentence: w.sentence, picture: w.picture ?? '' }}
          submitLabel="Save"
          onCancel={() => setMode('view')}
          onSubmit={(input) => {
            const err = act((d) => parentUpdateWord(d, wordId, { sentence: input.sentence, picture: input.picture ?? '' }));
            if (!err) setMode('view');
            return err;
          }}
        />
      )}
      {mode === 'replace' && (
        <WordForm
          submitLabel="Replace word"
          onCancel={() => setMode('view')}
          onSubmit={(input) => {
            const r = act((d) => parentReplaceWord(d, weekId, wordId, input));
            return r.error ?? null;
          }}
        />
      )}
    </li>
  );
}

function WordForm({ initial, fixedWord, submitLabel, onSubmit, onCancel }: { initial?: WordInput; fixedWord?: string; submitLabel: string; onSubmit: (input: WordInput) => EditError | null; onCancel: () => void }) {
  const [text, setText] = useState(initial?.text ?? '');
  const [sentence, setSentence] = useState(initial?.sentence ?? '');
  const [picture, setPicture] = useState<PictureId | ''>((initial?.picture as PictureId) ?? '');
  const [error, setError] = useState('');
  return (
    <form
      className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_1fr_auto]"
      data-testid="word-form"
      onSubmit={(e) => {
        e.preventDefault();
        const err = onSubmit({ text: fixedWord ?? text, sentence, picture });
        setError(err ? ERRORS[err] : '');
      }}
    >
      <label className="flex flex-col text-sm">
        Word
        <input value={fixedWord ?? text} disabled={Boolean(fixedWord)} onChange={(e) => setText(e.target.value)} className="rounded-xl border-2 border-ink/10 px-3 py-2 text-lg disabled:bg-blush" data-testid="word-input" />
      </label>
      <label className="flex flex-col text-sm">
        Example sentence (2–5 words, must include the word)
        <input value={sentence} onChange={(e) => setSentence(e.target.value)} className="rounded-xl border-2 border-ink/10 px-3 py-2 text-lg" data-testid="sentence-input" />
      </label>
      <label className="flex flex-col text-sm">
        Picture (optional)
        <select value={picture} onChange={(e) => setPicture(e.target.value as PictureId | '')} className="rounded-xl border-2 border-ink/10 px-3 py-2 text-lg">
          <option value="">No picture</option>
          {PICTURE_IDS.map((id) => (
            <option key={id} value={id}>
              {PICTURE_LABELS[id]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <Button type="submit" size="sm" data-testid="word-save">
          {submitLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {error && (
        <p className="font-semibold text-oops sm:col-span-4" data-testid="word-error">
          {error}
        </p>
      )}
      <p className="text-xs text-ink-soft sm:col-span-4">New words use the built-in voice until you record them on the Record voices tab.</p>
    </form>
  );
}
