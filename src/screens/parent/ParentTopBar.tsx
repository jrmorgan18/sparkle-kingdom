import type { ReactNode } from 'react';
import { Icon } from '../../art/icons';

export function ParentTopBar({ title, onBack, right }: { title: ReactNode; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-[#f6f3fb]/90 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur-sm sm:px-6">
      <button type="button" aria-label="Go back" onClick={onBack} className="btn-3d h-12 w-12 rounded-2xl bg-white p-1.5">
        <Icon name="back" className="h-full w-full" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold sm:text-3xl">{title}</h1>
      {right}
    </header>
  );
}
