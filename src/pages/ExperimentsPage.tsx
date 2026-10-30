import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAppStore } from '../store/AppStore';
import { EXPERIMENTS } from '../lib/constants';
import type { ExperimentDef, ExperimentStatus } from '../types';
import { Alert, Badge, PageHeader } from '../components/ui';
import { useToast } from '../components/Toast';
import { formatDateTime } from '../lib/utils';

const STATUSES: ExperimentStatus[] = ['Planned', 'Running', 'Completed'];
const statusTone = { Planned: 'slate', Running: 'indigo', Completed: 'green' } as const;

function ExperimentCard({ def }: { def: ExperimentDef }) {
  const { state, updateExperiment } = useAppStore();
  const notify = useToast();
  const rec = state.experiments[def.id];
  const [draft, setDraft] = useState(rec.notes);

  // Keep the draft in sync if notes change elsewhere (e.g. another tab).
  useEffect(() => setDraft(rec.notes), [rec.notes]);

  const dirty = draft !== rec.notes;

  const setStatus = (status: ExperimentStatus) => {
    if (status === rec.status) return;
    updateExperiment(def.id, { status });
    notify('success', `${def.title.split(':')[0]} marked as ${status}.`);
  };

  const saveNotes = () => {
    updateExperiment(def.id, { notes: draft.trim() });
    notify('success', 'Notes saved.');
  };

  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-navy-900">{def.title}</h2>
        <Badge tone={statusTone[rec.status]}>{rec.status}</Badge>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hypothesis</p>
          <p className="mt-1 text-sm text-navy-800">{def.hypothesis}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {def.variants.map((v) => (
            <div key={v.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Variant {v.label}</p>
              <p className="mt-1 text-sm text-navy-800">“{v.text}”</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Primary metric</p>
          <p className="mt-1 text-sm text-navy-800">{def.metric}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <div className="mt-2 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label={`${def.title} status`}>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={rec.status === s}
                onClick={() => setStatus(s)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  rec.status === s ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor={`notes-${def.id}`} className="label">
            Notes & observations
          </label>
          <textarea
            id={`notes-${def.id}`}
            rows={4}
            className="input resize-y"
            placeholder={
              rec.status === 'Planned'
                ? 'No results recorded yet. Add planning notes, sample sizes or how you will measure this.'
                : 'Record genuine observations and results here.'
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              {rec.updatedAt ? `Last updated ${formatDateTime(rec.updatedAt)}` : 'Not edited yet'}
            </p>
            <button type="button" className="btn-primary btn-sm" onClick={saveNotes} disabled={!dirty}>
              <Save className="h-3.5 w-3.5" aria-hidden /> Save notes
            </button>
          </div>
          {rec.status === 'Completed' && rec.notes.trim() === '' && (
            <div className="mt-3">
              <Alert tone="warning">
                Completed experiments should include the genuine results in the notes. No outcome is recorded.
              </Alert>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ExperimentsPage() {
  return (
    <>
      <PageHeader
        title="Campaign Experiments"
        description="Three planned tests for the campaign. Only change a status when it reflects what actually happened."
      />
      <Alert tone="info" title="No results are pre-filled">
        All experiments start as Planned. This prototype never generates or estimates outcomes: record real
        numbers in the notes after you run a test.
      </Alert>
      <div className="grid gap-4 xl:grid-cols-1">
        {EXPERIMENTS.map((def) => (
          <ExperimentCard key={def.id} def={def} />
        ))}
      </div>
    </>
  );
}
