import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Inbox } from 'lucide-react';

/* Pequeño helper para unir clases condicionales. */
export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/* ===== Botones ===== */
export function PrimaryButton({
  children, className, ...props
}: { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-cta px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ink shadow-glow-gold transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children, className, ...props
}: { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/80 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ===== Campos de formulario ===== */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-white/75">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-white/40">{hint}</span>}
    </label>
  );
}

const inputBase =
  'w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[15px] text-white placeholder-white/30 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/15 disabled:opacity-50';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputBase, props.className)} />;
}

export function SelectInput({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx(inputBase, 'cursor-pointer', props.className)}>
      {children}
    </select>
  );
}

/* ===== Píldora de estado ===== */
export type Tone = 'green' | 'yellow' | 'red' | 'gray' | 'gold';
const TONES: Record<Tone, string> = {
  green: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  yellow: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  red: 'border-red-400/40 bg-red-500/10 text-red-300',
  gray: 'border-white/15 bg-white/[0.05] text-white/60',
  gold: 'border-gold/40 bg-gold/10 text-gold-light',
};
export function Pill({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide', TONES[tone], className)}>
      {children}
    </span>
  );
}

/* ===== Modal ===== */
export function Modal({
  open, onClose, title, children, footer, wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-start justify-center overflow-y-auto px-2 py-3 sm:items-center sm:px-4 sm:py-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cx('relative z-[10000] w-full max-h-[95dvh] overflow-hidden rounded-[28px] border border-white/10 glass-strong shadow-card animate-pop-in', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-4 sm:px-6">
          <h3 className="font-display text-lg font-extrabold text-white">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scrollable-touch max-h-[calc(100dvh-12rem)] px-4 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-white/8 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ===== Estados auxiliares ===== */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Loader2 className="h-7 w-7 animate-spin text-gold" />
      {label && <p className="text-sm text-white/50">{label}</p>}
    </div>
  );
}

export function EmptyState({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/40">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <p className="font-display text-base font-bold text-white">{title}</p>
      {subtitle && <p className="max-w-xs text-[13px] text-white/45">{subtitle}</p>}
    </div>
  );
}

/* Mensaje inline (ok / error / info). */
export function Banner({ tone, children }: { tone: 'ok' | 'err' | 'info'; children: ReactNode }) {
  const map = {
    ok: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
    err: 'border-brand-light/40 bg-brand/15 text-red-200',
    info: 'border-gold/40 bg-gold/10 text-gold-light',
  } as const;
  return <div className={cx('rounded-2xl border px-4 py-3 text-sm font-semibold', map[tone])}>{children}</div>;
}

/* Tarjeta KPI reutilizable (dashboard / encabezados de sección). */
export function StatCard({ label, value, icon, tone = 'gold', sub }: { label: string; value: ReactNode; icon?: ReactNode; tone?: Tone; sub?: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">{label}</span>
        {icon && <Pill tone={tone} className="!px-2 !py-1">{icon}</Pill>}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold text-white">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-white/45">{sub}</div>}
    </div>
  );
}
