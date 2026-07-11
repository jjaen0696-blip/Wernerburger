import { ReactNode } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

/* ======================== Modal ======================== */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/10 bg-ink-800/95 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl animate-pop-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-ink-800/80 px-6 py-4 backdrop-blur">
          <h3 className="font-display text-lg font-extrabold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/45 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scrollable-touch p-6">{children}</div>
        {footer && (
          <div className="flex gap-3 border-t border-white/8 bg-ink-800/80 px-6 py-4 backdrop-blur">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================== Field ======================== */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-white/80">{label}</label>
      {hint && <p className="text-xs text-white/45">{hint}</p>}
      {children}
    </div>
  );
}

/* ======================== TextInput ======================== */
export function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
  className = '',
  autoComplete,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  className?: string;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      className={`rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/30 transition-colors focus:border-gold/40 focus:bg-white/[0.08] focus:outline-none disabled:opacity-50 ${className}`}
    />
  );
}

/* ======================== SelectInput ======================== */
export function SelectInput({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white transition-colors focus:border-gold/40 focus:bg-white/[0.08] focus:outline-none disabled:opacity-50"
    >
      {children}
    </select>
  );
}

/* ======================== PrimaryButton ======================== */
export function PrimaryButton({
  onClick,
  disabled,
  children,
  className = '',
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-2.5 font-bold text-ink shadow-glow-gold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100 ${className}`}
    >
      {children}
    </button>
  );
}

/* ======================== GhostButton ======================== */
export function GhostButton({
  onClick,
  disabled,
  children,
  className = '',
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-4 py-2.5 font-bold text-white/80 transition-all hover:border-white/40 hover:text-white active:bg-white/[0.06] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/* ======================== Pill ======================== */
export function Pill({
  tone = 'gray',
  children,
}: {
  tone?: 'gold' | 'green' | 'gray' | 'red' | 'cyan';
  children: ReactNode;
}) {
  const styles = {
    gold: 'bg-gold/20 text-gold-light border-gold/30',
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    gray: 'bg-white/10 text-white/60 border-white/20',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

/* ======================== Spinner ======================== */
export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      <p className="text-sm text-white/60">{label}</p>
    </div>
  );
}

/* ======================== EmptyState ======================== */
export function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      {icon && <div className="text-white/60">{icon}</div>}
      <div>
        <p className="font-display text-lg font-extrabold text-white">{title}</p>
        <p className="mt-1 text-sm text-white/60">{subtitle}</p>
      </div>
    </div>
  );
}

/* ======================== Banner ======================== */
export function Banner({
  tone = 'info',
  children,
}: {
  tone?: 'err' | 'ok' | 'info';
  children: ReactNode;
}) {
  const styles = {
    err: 'border-red-500/30 bg-red-500/10 text-red-300',
    ok: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    info: 'border-gold/30 bg-gold/10 text-gold-light',
  };
  const icons = {
    err: AlertTriangle,
    ok: CheckCircle,
    info: AlertCircle,
  };
  const Icon = icons[tone];
  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${styles[tone]}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
