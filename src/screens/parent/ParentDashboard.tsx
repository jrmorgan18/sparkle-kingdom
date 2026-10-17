import { useState, type ReactNode } from 'react';
import { Card, Screen } from '../../components/ui';
import { go, routes } from '../../lib/router';
import { BackupPanel } from './BackupPanel';
import { CurriculumPanel } from './CurriculumPanel';
import { HistoryPanel, MasteryPanel, Overview } from './ProgressPanels';
import { ParentGate, useParentGate } from './ParentGate';
import { ParentTopBar } from './ParentTopBar';
import { SettingsPanel } from './SettingsPanel';
import { VoicesPanel } from './VoicesPanel';

type Tab = 'overview' | 'mastery' | 'history' | 'words' | 'voices' | 'settings' | 'backup';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'mastery', label: 'Mastery' },
  { id: 'history', label: 'Sessions' },
  { id: 'words', label: 'Weeks & words' },
  { id: 'voices', label: 'Record voices' },
  { id: 'settings', label: 'Settings' },
  { id: 'backup', label: 'Backup' },
];

export function ParentArea() {
  const open = useParentGate((g) => g.open);
  return open ? <ParentDashboard /> : <ParentGate />;
}

function ParentDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <div className="parent-bg min-h-screen" data-testid="parent-dashboard">
      <ParentTopBar title="Grown-ups" onBack={() => go(routes.home())} />
      <Screen className="flex flex-col gap-5 font-body">
        <nav className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Dashboard sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`min-h-12 shrink-0 rounded-2xl px-4 font-display text-lg font-semibold ${tab === t.id ? 'bg-royal text-white' : 'bg-white text-ink'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        {tab === 'overview' && <Overview />}
        {tab === 'mastery' && <MasteryPanel />}
        {tab === 'history' && <HistoryPanel />}
        {tab === 'words' && <CurriculumPanel />}
        {tab === 'voices' && <VoicesPanel />}
        {tab === 'settings' && <SettingsPanel />}
        {tab === 'backup' && <BackupPanel />}
      </Screen>
    </div>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex-1 text-2xl font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </Card>
  );
}

export function Stat({ label, value, testid }: { label: string; value: ReactNode; testid?: string }) {
  return (
    <div className="rounded-2xl bg-blush p-3">
      <div className="text-sm text-ink-soft">{label}</div>
      <div className="font-display text-2xl font-semibold" data-testid={testid}>
        {value}
      </div>
    </div>
  );
}

export function fmtDate(t: number | null | undefined): string {
  if (!t) return '—';
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtDateTime(t: number | null | undefined): string {
  if (!t) return '—';
  return new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
