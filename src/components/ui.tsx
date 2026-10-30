import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';

/* ---------- Badge ---------- */
type BadgeTone = 'indigo' | 'navy' | 'slate' | 'green' | 'amber' | 'rose';
const badgeTones: Record<BadgeTone, string> = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  navy: 'bg-navy-900 text-white ring-navy-900',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export function Badge({ tone = 'slate', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

/* ---------- Alert ---------- */
type AlertTone = 'info' | 'success' | 'warning' | 'error';
const alertStyles: Record<AlertTone, { box: string; Icon: LucideIcon }> = {
  info: { box: 'border-indigo-200 bg-indigo-50 text-indigo-900', Icon: Info },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', Icon: CheckCircle2 },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', Icon: AlertTriangle },
  error: { box: 'border-rose-200 bg-rose-50 text-rose-900', Icon: XCircle },
};

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
}) {
  const { box, Icon } = alertStyles[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${box}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
    </div>
  );
}

/* ---------- Progress bar ---------- */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
    >
      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Spinner ---------- */
export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

/* ---------- Page header ---------- */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Card section ---------- */
export function Section({
  title,
  description,
  actions,
  children,
  padded = true,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-navy-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {actions}
      </div>
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

/* ---------- Form field ---------- */
export function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
