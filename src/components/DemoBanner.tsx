import { Database, FlaskRound } from 'lucide-react';
import { useAppStore } from '../store/AppStore';

/** True when any synthetic sample data is present in the current dataset. */
export function useHasSampleData(): boolean {
  const { state } = useAppStore();
  return (
    state.spendIsSample ||
    state.registrations.some((r) => r.origin === 'sample') ||
    state.ambassadors.some((a) => a.origin === 'sample')
  );
}

export function DemoBanner() {
  const hasSample = useHasSampleData();

  if (hasSample) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <FlaskRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <span className="font-bold tracking-wide">DEMO MODE — SAMPLE DATA</span>
          <span className="ml-2">
            Records labelled <strong>Sample</strong> are synthetic and are not real campaign performance.
            Entries you submit in this browser are labelled <strong>Actual</strong>.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
      <Database className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <p>
        <span className="font-semibold">Empty dataset.</span> No sample data is loaded; only entries made in
        this browser appear here. Use Settings to restore the demo data.
      </p>
    </div>
  );
}
