import { useRef, useState } from 'react';
import { reloadRecordings } from '../../audio/player';
import { Button, ConfirmDialog } from '../../components/ui';
import { estimateBackupBytes, exportFull, importFull, LARGE_BACKUP_BYTES, parseBackup } from '../../engine/backup';
import { now } from '../../lib/clock';
import { allClips, replaceAllClips, requestPersistentStorage } from '../../persistence/db';
import { useAppState, useGame } from '../../store/game';
import { resetAdventure } from '../Adventure';
import { Section } from './ParentDashboard';

const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(1)} MB`;

export function BackupPanel() {
  const s = useAppState();
  const replaceState = useGame((g) => g.replaceState);
  const resetAll = useGame((g) => g.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [bigWarn, setBigWarn] = useState<number | null>(null);
  const [pending, setPending] = useState<ReturnType<typeof importFull> | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [wipeVoices, setWipeVoices] = useState(false);

  const download = async () => {
    const clips = await allClips();
    const json = await exportFull(s, clips, now());
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = `sparkle-kingdom-backup-${new Date(now()).toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setMsg(`Backup saved (${clips.length} voice clips, ${mb(json.length)}).`);
  };

  const startExport = async () => {
    const clips = await allClips();
    const size = estimateBackupBytes(s, clips);
    if (size > LARGE_BACKUP_BYTES) setBigWarn(size);
    else void download();
  };

  return (
    <div className="flex flex-col gap-5">
      <Section title="Backup">
        <p>
          Progress and recordings live <b>only on this device, in this browser</b>. Nothing syncs between tablets. Export a backup now and then (it includes your voice recordings), and import it on another device to move everything over.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void startExport()} data-testid="export">
            Export backup
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} data-testid="import">
            Import backup…
          </Button>
          <Button variant="secondary" onClick={async () => setMsg((await requestPersistentStorage()) ? 'This browser will keep the data (persistent storage granted).' : 'The browser didn’t grant persistent storage. Installing to the home screen helps on iPad.')}>
            Ask the browser to keep data
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            data-testid="import-file"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                setPending(importFull(parseBackup(await f.text()), now()));
              } catch (err) {
                setMsg(err instanceof Error ? err.message : 'That file could not be read.');
              }
            }}
          />
        </div>
        {msg && (
          <p className="font-semibold" data-testid="backup-msg" aria-live="polite">
            {msg}
          </p>
        )}
      </Section>
      <Section title="Start over">
        <p className="text-ink-soft">Erases all progress, rewards, looks, and decorated scenes on this device. Export a backup first if you might want it back.</p>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-5 w-5" checked={wipeVoices} onChange={(e) => setWipeVoices(e.target.checked)} />
          Also delete my voice recordings
        </label>
        <Button variant="danger" className="self-start" onClick={() => setResetStep(1)} data-testid="reset-all">
          Reset everything…
        </Button>
      </Section>

      <ConfirmDialog
        open={bigWarn != null}
        title="This backup is large"
        body={`It will be about ${mb(bigWarn ?? 0)} because it includes your voice recordings. That's fine for saving to Files or a computer, but may be too big to email.`}
        confirmLabel="Export anyway"
        onCancel={() => setBigWarn(null)}
        onConfirm={() => {
          setBigWarn(null);
          void download();
        }}
      />
      <ConfirmDialog
        open={pending != null}
        title="Replace everything with this backup?"
        body={pending ? `All progress on this device will be replaced. The backup has ${pending.clips.length} voice recordings, which will replace the ones on this device.` : ''}
        confirmLabel="Import"
        danger
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          const p = pending!;
          setPending(null);
          await replaceAllClips(p.clips);
          await reloadRecordings();
          resetAdventure();
          replaceState(p.state);
          setMsg('Backup imported.');
        }}
      />
      <ConfirmDialog
        open={resetStep === 1}
        title="Reset everything?"
        body="All progress, rewards, and scenes on this device will be erased."
        confirmLabel="Yes, continue"
        danger
        onCancel={() => setResetStep(0)}
        onConfirm={() => setResetStep(2)}
      />
      <ConfirmDialog
        open={resetStep === 2}
        title="Are you completely sure?"
        body={`This can’t be undone.${wipeVoices ? ' Your voice recordings will also be deleted.' : ' Voice recordings will be kept.'}`}
        confirmLabel="Erase everything"
        danger
        onCancel={() => setResetStep(0)}
        onConfirm={async () => {
          setResetStep(0);
          resetAdventure();
          await resetAll({ recordings: wipeVoices });
          setMsg('Everything was reset.');
        }}
      />
    </div>
  );
}
