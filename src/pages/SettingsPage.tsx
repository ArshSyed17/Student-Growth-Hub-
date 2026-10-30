import { useEffect, useState, type FormEvent } from 'react';
import { Eraser, RotateCcw, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/AppStore';
import { BUDGET_PLAN, CAMPAIGN } from '../lib/constants';
import { computeStats, totalSpend } from '../lib/logic';
import { formatINR, formatINRPrecise } from '../lib/utils';
import type { BudgetCategory } from '../types';
import { Alert, Badge, Field, PageHeader, Section } from '../components/ui';
import { useToast } from '../components/Toast';

const MAX_SPEND = 1_000_000;

export default function SettingsPage() {
  const { state, updateSpend, resetDemo, clearAll, removeSampleData } = useAppStore();
  const notify = useToast();

  const toDraft = () =>
    Object.fromEntries(BUDGET_PLAN.map((b) => [b.key, String(state.spend[b.key])])) as Record<BudgetCategory, string>;
  const [draft, setDraft] = useState(toDraft);
  const [errors, setErrors] = useState<Partial<Record<BudgetCategory, string>>>({});

  useEffect(() => setDraft(toDraft()), [state.spend]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = computeStats(state.registrations, state.spend);
  const plannedTotal = BUDGET_PLAN.reduce((s, b) => s + b.planned, 0);
  const actualTotal = totalSpend(state.spend);
  const sampleRegs = state.registrations.filter((r) => r.origin === 'sample').length;

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    const next = {} as Record<BudgetCategory, number>;
    const errs: Partial<Record<BudgetCategory, string>> = {};
    for (const b of BUDGET_PLAN) {
      const raw = draft[b.key].trim();
      const n = Number(raw);
      if (raw === '' || !Number.isFinite(n)) errs[b.key] = 'Enter a number.';
      else if (n < 0) errs[b.key] = 'Cannot be negative.';
      else if (n > MAX_SPEND) errs[b.key] = 'That looks too large.';
      else next[b.key] = Math.round(n * 100) / 100;
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      notify('error', 'Please fix the highlighted spend values.');
      return;
    }
    updateSpend(next);
    notify('success', 'Actual spend updated.');
  };

  const confirmThen = (message: string, action: () => void, done: string) => {
    if (window.confirm(message)) {
      action();
      notify('success', done);
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Budget tracking, demo data controls, and notes on how this prototype stores data." />

      <Section
        title="Campaign budget"
        description={`Planned versus actual. The ${formatINR(CAMPAIGN.budget)} figure is a plan, not money that has been spent.`}
        actions={state.spendIsSample ? <Badge tone="amber">Actual spend = sample values</Badge> : undefined}
        padded={false}
      >
        <form onSubmit={onSave} noValidate>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Category</th>
                  <th className="th text-right">Planned (budget)</th>
                  <th className="th">Actual spend (₹)</th>
                  <th className="th text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {BUDGET_PLAN.map((b) => {
                  const actual = Number(draft[b.key]);
                  const diff = Number.isFinite(actual) ? b.planned - actual : null;
                  return (
                    <tr key={b.key}>
                      <td className="td">
                        <p className="font-medium">{b.label}</p>
                        <p className="text-xs text-slate-500">{b.note}</p>
                      </td>
                      <td className="td text-right tabular-nums">{formatINR(b.planned)}</td>
                      <td className="td min-w-[9rem]">
                        <Field id={`spend-${b.key}`} label={`${b.label} actual spend`} error={errors[b.key]}>
                          <input
                            id={`spend-${b.key}`}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            className={`input ${errors[b.key] ? 'input-error' : ''}`}
                            value={draft[b.key]}
                            onChange={(e) => setDraft((d) => ({ ...d, [b.key]: e.target.value }))}
                          />
                        </Field>
                      </td>
                      <td className={`td text-right tabular-nums ${diff !== null && diff < 0 ? 'font-medium text-rose-600' : ''}`}>
                        {diff === null ? '—' : diff < 0 ? `${formatINR(Math.abs(diff))} over` : `${formatINR(diff)} left`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td className="td font-semibold">Total</td>
                  <td className="td text-right font-semibold tabular-nums">{formatINR(plannedTotal)}</td>
                  <td className="td font-semibold tabular-nums">{formatINR(actualTotal)}</td>
                  <td className="td" />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5">
            <p className="text-sm text-slate-600">
              Cost per valid registration:{' '}
              <strong className="text-navy-900">
                {stats.costPerRegistration === null ? 'N/A (no registrations yet)' : formatINRPrecise(stats.costPerRegistration)}
              </strong>{' '}
              <span className="text-slate-500">
                (actual spend {formatINR(actualTotal)} ÷ {stats.total} registrations)
              </span>
            </p>
            <button type="submit" className="btn-primary">
              Save actual spend
            </button>
          </div>
          {actualTotal > plannedTotal && (
            <div className="px-5 pb-5">
              <Alert tone="warning">Actual spend is above the planned {formatINR(plannedTotal)} budget.</Alert>
            </div>
          )}
        </form>
      </Section>

      <Section
        title="Data controls"
        description={`This browser currently holds ${state.registrations.length} registrations (${sampleRegs} sample) and ${state.ambassadors.length} ambassadors.`}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-navy-900">Reset demo data</p>
            <p className="mt-1 text-xs text-slate-500">Replaces everything with a fresh synthetic dataset. Entries you made are removed.</p>
            <button
              type="button"
              className="btn-secondary mt-3 w-full"
              onClick={() =>
                confirmThen(
                  'Reset to the sample dataset? All current registrations, ambassadors and spend are replaced. Experiment notes are kept.',
                  resetDemo,
                  'Demo data restored.',
                )
              }
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Reset Demo Data
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-navy-900">Remove sample data only</p>
            <p className="mt-1 text-xs text-slate-500">Deletes synthetic records but keeps entries you made in this browser.</p>
            <button
              type="button"
              className="btn-secondary mt-3 w-full"
              onClick={() =>
                confirmThen('Remove all sample (synthetic) records and keep your own entries?', removeSampleData, 'Sample data removed.')
              }
            >
              <Eraser className="h-4 w-4" aria-hidden /> Remove sample data
            </button>
          </div>
          <div className="rounded-xl border border-rose-200 p-4">
            <p className="text-sm font-semibold text-navy-900">Switch to empty dataset</p>
            <p className="mt-1 text-xs text-slate-500">Deletes every registration, ambassador and spend value in this browser.</p>
            <button
              type="button"
              className="btn-danger mt-3 w-full"
              onClick={() =>
                confirmThen(
                  'Delete ALL registrations, ambassadors and spend values? Experiment notes are kept. This cannot be undone.',
                  clearAll,
                  'Dataset emptied.',
                )
              }
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Use empty dataset
            </button>
          </div>
        </div>
      </Section>

      <Section title="About this prototype: storage, security and privacy">
        <div className="grid gap-6 text-sm leading-relaxed text-slate-700 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-semibold text-navy-900">What this is</h3>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>An independent internship assignment demo. It is not an official NxtWave product.</li>
              <li>Data lives in <strong>this browser's localStorage only</strong>. It is not shared across visitors or devices and clearing site data erases it.</li>
              <li>It is <strong>not suitable for collecting real public registrations</strong> at scale, and it is not a multi-user production system.</li>
              <li>Sample data is synthetic (example.com emails, fictional colleges) and always labelled.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-navy-900">Security notes</h3>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>The admin area has <strong>no real access control</strong>. Anyone with the URL can open it, because all logic runs in the browser.</li>
              <li>No secrets or credentials are stored in the frontend.</li>
              <li>Validation here is for usability only; a visitor can bypass it.</li>
            </ul>
            <h3 className="pt-2 font-semibold text-navy-900">Path to production</h3>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Store registrations in a hosted database (for example Supabase/Postgres) with a unique index on the normalised email.</li>
              <li>Validate and attribute referrals server-side (edge function or API), with rate limiting and bot protection.</li>
              <li>Protect the dashboard with real authentication and row-level security; keep service keys on the server only.</li>
              <li>Send confirmation emails and handle consent records and deletion requests on the backend.</li>
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
