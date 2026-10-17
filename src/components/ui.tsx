/** Parent-facing UI primitives (adapted from Word Quest). Child-facing controls live in kid.tsx. */
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { play } from '../lib/sound';

type Variant = 'primary' | 'secondary' | 'good' | 'gold' | 'rose' | 'lagoon' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, { cls: string; shadow: string }> = {
  primary: { cls: 'bg-royal text-white', shadow: '#5a32ab' },
  secondary: { cls: 'bg-white text-ink border-2 border-ink/10', shadow: 'rgba(59,34,87,0.18)' },
  good: { cls: 'bg-good text-white', shadow: '#146b3a' },
  gold: { cls: 'bg-gold text-ink', shadow: '#c99400' },
  rose: { cls: 'bg-rose text-white', shadow: '#d63c86' },
  lagoon: { cls: 'bg-lagoon text-white', shadow: '#0f8a85' },
  ghost: { cls: 'bg-transparent text-ink', shadow: 'transparent' },
  danger: { cls: 'bg-[#c0392b] text-white', shadow: '#8e2a20' },
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  sfx?: boolean;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, onClick, sfx = true, style, ...rest }: ButtonProps) {
  const v = VARIANTS[variant];
  const sz = size === 'lg' ? 'min-h-14 px-6 text-xl rounded-2xl' : size === 'sm' ? 'min-h-10 px-3 text-base rounded-xl' : 'min-h-12 px-5 text-lg rounded-2xl';
  return (
    <button
      type="button"
      className={`btn-3d inline-flex items-center justify-center gap-2 font-semibold disabled:opacity-50 ${sz} ${v.cls} ${className}`}
      style={{ ['--btn-shadow' as string]: v.shadow, ...style }}
      onClick={(e) => {
        if (sfx) play('tap');
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ className = '', children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-3xl bg-white p-5 shadow-[0_6px_0_rgba(59,34,87,0.07),0_2px_12px_rgba(59,34,87,0.06)] ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Modal({ open, onClose, children, labelledBy, wide }: { open: boolean; onClose?: () => void; children: ReactNode; labelledBy?: string; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, [href], input, textarea, select')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  // Enter-only animation: closing is instant so a stalled exit can never leave an overlay behind (WebKit lesson from Word Quest).
  if (!open) return null;
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy="confirm-title">
      <h2 id="confirm-title" className="text-2xl font-semibold">
        {title}
      </h2>
      {body && <div className="mt-2 text-ink-soft">{body}</div>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} data-testid="confirm-cancel">
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} data-testid="confirm-ok">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Pill({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${className}`} {...rest}>
      {children}
    </span>
  );
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 ${className}`}>{children}</main>;
}
