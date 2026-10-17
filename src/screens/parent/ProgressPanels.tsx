import { useClips } from '../../audio/player';
import { clipCatalog } from '../../audio/clips';
import { Button, Pill } from '../../components/ui';
import { describeKey, sessionsToday, shakyTeenReport } from '../../engine/play';
import { isDue, itemStatus, numKey, wordKey, type ItemStatus } from '../../engine/mastery';
import { parentMarkNumberLearned, parentMarkWordLearned } from '../../engine/parent';
import { ownedCounts } from '../../engine/rewards';
import { NUMBER_SKILLS, type NumberSkill, type SkillRecord } from '../../engine/types';
import { currentWeek, isWeekUnlocked, weekLearned } from '../../engine/weeks';
import { REWARD_BY_ID } from '../../data/rewards';
import { now } from '../../lib/clock';
import { act, useAppState } from '../../store/game';
import { fmtDate, fmtDateTime, Section, Stat } from './ParentDashboard';

const STATUS_STYLE: Record<ItemStatus, string> = {
  new: 'bg-[#eee9f5] text-ink-soft',
  practicing: 'bg-sea-light text-[#1f5fb8]',
  shaky: 'bg-[#fff0e0] text-oops',
  learned: 'bg-good-light text-good',
};
const STATUS_LABEL: Record<ItemStatus, string> = { new: 'Not yet', practicing: 'Practicing', shaky: 'Shaky', learned: 'Learned' };

export function StatusPill({ rec }: { rec: SkillRecord | undefined }) {
  const st = itemStatus(rec);
  return <Pill className={STATUS_STYLE[st]}>{STATUS_LABEL[st]}</Pill>;
}

export function Overview() {
  const s = useAppState();
  const t = now();
  const week = currentWeek(s);
  const weekNo = week ? s.curriculum.weeks.indexOf(week) + 1 : 0;
  const words = Object.keys(s.curriculum.words);
  const learnedWords = words.filter((id) => s.skills[wordKey(id)]?.learnedAt != null).length;
  const counts = ownedCounts(s);
  const shaky = shakyTeenReport(s).filter((r) => r.skips + r.misses > 0 && r.learnedSkills < 3);
  const recorded = useClips((c) => c.ids);
  const catalog = clipCatalog(s.curriculum, s.settings.countingMax);
  const recordedCount = catalog.filter((c) => recorded.has(c.clip)).length;
  const dueCount = Object.values(s.skills).filter((r) => isDue(r, t)).length;
  return (
    <div className="flex flex-col gap-5">
      <Section title="This week">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Current week" value={week ? `Week ${weekNo}` : '—'} testid="current-week" />
          <Stat label="Sight words learned" value={`${learnedWords} / ${words.length}`} testid="words-learned" />
          <Stat label="Adventures today" value={sessionsToday(s, t)} />
          <Stat label="Due for review" value={dueCount} />
        </div>
        {week && (
          <p className="text-lg">
            This week’s words:{' '}
            {week.wordIds.map((id) => (
              <span key={id} className="mr-2 inline-flex items-center gap-1">
                <b>{s.curriculum.words[id]?.text}</b> <StatusPill rec={s.skills[wordKey(id)]} />
              </span>
            ))}
          </p>
        )}
      </Section>
      <Section title="Teen numbers to watch">
        {shaky.length ? (
          <div className="flex flex-wrap gap-2" data-testid="shaky-teens">
            {shaky.map((r) => (
              <Pill key={r.n} className="bg-[#fff0e0] text-oops text-base">
                {r.n}
                {r.skips ? ` · skipped ${r.skips}×` : ''}
                {r.misses ? ` · missed ${r.misses}×` : ''}
              </Pill>
            ))}
          </div>
        ) : (
          <p className="text-ink-soft">No shaky teens yet{s.placement ? '' : ' — the first adventure includes a short warm-up that checks them'}.</p>
        )}
        {s.placement && (
          <p className="text-sm text-ink-soft" data-testid="placement-summary">
            Warm-up check ({fmtDate(s.placement.doneAt)}): 1–10 baseline {s.placement.baselineOk ? 'solid' : 'needs practice'}; shaky teens: {s.placement.shakyTeens.join(', ') || 'none'}; solid: {s.placement.solidTeens.join(', ') || 'none'}.
          </p>
        )}
      </Section>
      <Section title="Treasures & voice">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Dress-up items" value={`${counts.dress} / ${counts.dressTotal}`} />
          <Stat label="Stickers" value={`${counts.stickers} / ${counts.stickersTotal}`} />
          <Stat label="Rewards waiting" value={s.rewardBank.length} />
          <Stat label="Voice clips recorded" value={`${recordedCount} / ${catalog.length}`} />
        </div>
      </Section>
      <Section title="Where progress is saved">
        <p className="text-ink-soft">
          Progress, rewards, and voice recordings are saved <b>in this browser on this device only</b>. They do not sync between tablets or browsers. Use <b>Backup → Export</b> to keep a copy or move to another device.
        </p>
      </Section>
    </div>
  );
}

const SKILL_LABEL: Record<NumberSkill, string> = { seq: 'Sequence', count: 'Counting objects', numeral: 'Numeral' };

export function MasteryPanel() {
  const s = useAppState();
  const t = now();
  const max = s.settings.countingMax;
  return (
    <div className="flex flex-col gap-5">
      <Section title="Sight words">
        <p className="text-sm text-ink-soft">“Learned” = right on the first try on 2 different days. Learned words come back for review after about 1, 3, 7, and 14 days.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left" data-testid="word-mastery">
            <thead className="text-sm text-ink-soft">
              <tr>
                <th className="p-2">Week</th>
                <th className="p-2">Word</th>
                <th className="p-2">Status</th>
                <th className="p-2">First-try right</th>
                <th className="p-2">Days right</th>
                <th className="p-2">Next review</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {s.curriculum.weeks.map((w, wi) =>
                w.wordIds.map((id) => {
                  const rec = s.skills[wordKey(id)];
                  return (
                    <tr key={id} className="border-t border-ink/5" data-testid={`word-row-${id}`} data-status={itemStatus(rec)}>
                      <td className="p-2 text-ink-soft">{wi + 1}</td>
                      <td className="p-2 font-display text-xl font-semibold">{s.curriculum.words[id]?.text}</td>
                      <td className="p-2">
                        <StatusPill rec={rec} />
                      </td>
                      <td className="p-2">{rec ? `${rec.firstTryCorrect} / ${rec.attempts}` : '—'}</td>
                      <td className="p-2">{rec?.correctDays.length ?? 0}</td>
                      <td className="p-2">{rec?.review ? (isDue(rec, t) ? 'Due now' : fmtDate(rec.review.dueAt)) : '—'}</td>
                      <td className="p-2 text-right">
                        {!rec?.learnedAt && isWeekUnlocked(s, w.id) && (
                          <Button size="sm" variant="secondary" data-testid={`mark-word-${id}`} onClick={() => act((d, at) => parentMarkWordLearned(d, id, at))}>
                            Mark learned
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title={`Numbers 0–${max}`}>
        <div className="flex flex-wrap gap-2 text-sm">
          {(Object.keys(STATUS_LABEL) as ItemStatus[]).map((k) => (
            <Pill key={k} className={STATUS_STYLE[k]}>
              {STATUS_LABEL[k]}
            </Pill>
          ))}
          <span className="text-ink-soft">“s” = times she skipped that number in a sequence.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="text-center" data-testid="number-mastery">
            <thead>
              <tr>
                <th className="p-1 text-left text-sm text-ink-soft">Skill</th>
                {Array.from({ length: max + 1 }, (_, n) => (
                  <th key={n} className={`p-1 font-display ${n >= 11 && n <= 20 ? 'text-royal' : 'text-ink-soft'}`}>
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NUMBER_SKILLS.map((sk) => (
                <tr key={sk}>
                  <td className="whitespace-nowrap p-1 pr-3 text-left text-sm">{SKILL_LABEL[sk]}</td>
                  {Array.from({ length: max + 1 }, (_, n) => {
                    const rec = s.skills[numKey(sk, n)];
                    const st = itemStatus(rec);
                    return (
                      <td key={n} className="p-0.5">
                        <div className={`flex h-9 w-9 flex-col items-center justify-center rounded-lg text-[11px] leading-tight ${STATUS_STYLE[st]}`} data-testid={`num-${sk}-${n}`} data-status={st} title={rec ? `${rec.firstTryCorrect}/${rec.attempts} first-try` : 'Not tried'}>
                          {rec?.attempts ? `${rec.firstTryCorrect}/${rec.attempts}` : ''}
                          {rec?.skips ? <b>s{rec.skips}</b> : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <MarkNumber />
      </Section>
    </div>
  );
}

function MarkNumber() {
  const s = useAppState();
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(new FormData(e.currentTarget).get('n'));
        if (Number.isInteger(n) && n >= 0 && n <= s.settings.countingMax) act((d, t) => parentMarkNumberLearned(d, n, NUMBER_SKILLS, t));
      }}
    >
      <label htmlFor="mark-n" className="text-sm text-ink-soft">
        Mark a number learned (all three skills):
      </label>
      <input id="mark-n" name="n" type="number" min={0} max={s.settings.countingMax} className="w-24 rounded-xl border-2 border-ink/10 px-3 py-2" />
      <Button size="sm" variant="secondary" type="submit">
        Mark learned
      </Button>
    </form>
  );
}

export function HistoryPanel() {
  const s = useAppState();
  const list = s.sessions.slice().reverse();
  return (
    <Section title="Adventure history">
      {!list.length && <p className="text-ink-soft">No adventures yet.</p>}
      <ul className="flex flex-col gap-2" data-testid="session-history">
        {list.map((h) => (
          <li key={h.id} className="rounded-2xl bg-blush p-3" data-testid="session-row">
            <div className="flex flex-wrap items-center gap-2">
              <b>{fmtDateTime(h.startedAt)}</b>
              {h.placement && <Pill className="bg-royal-light text-royal">Warm-up check</Pill>}
              {h.endedAt == null && <Pill className="bg-[#eee9f5] text-ink-soft">Not finished</Pill>}
              <span className="text-ink-soft">
                {h.games.join(', ')} · {h.firstTryCorrect}/{h.answers} first try
                {h.endedAt ? ` · ${Math.max(1, Math.round((h.endedAt - h.startedAt) / 60000))} min` : ''}
              </span>
            </div>
            {(h.newlyLearned.length > 0 || h.rewards.length > 0 || h.stars > 0) && (
              <div className="mt-1 text-sm">
                {h.newlyLearned.length > 0 && <span>Learned: {h.newlyLearned.map((k) => describeKey(s, k)).join(', ')}. </span>}
                {h.rewards.length > 0 && <span>Rewards: {h.rewards.map((id) => REWARD_BY_ID.get(id)?.name ?? id).join(', ')}.</span>}
                {h.stars > 0 && <span> Bonus stars: {h.stars}.</span>}
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink-soft">Weeks fully learned: {s.curriculum.weeks.filter((w) => weekLearned(s, w)).length}.</p>
    </Section>
  );
}
