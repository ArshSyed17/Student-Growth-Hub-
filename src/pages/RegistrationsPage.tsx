import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, SearchX, Search, Users } from 'lucide-react';
import { useAppStore } from '../store/AppStore';
import { Badge, EmptyState, PageHeader } from '../components/ui';
import { downloadTextFile, formatDateTime, registrationsToCsv, toDateKey } from '../lib/utils';
import { useToast } from '../components/Toast';
import type { AcquisitionSource, RecordOrigin } from '../types';

const PAGE_SIZE = 25;

export default function RegistrationsPage() {
  const { state } = useAppStore();
  const notify = useToast();
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'all' | AcquisitionSource>('all');
  const [origin, setOrigin] = useState<'all' | RecordOrigin>('all');
  const [dir, setDir] = useState<'desc' | 'asc'>('desc');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = state.registrations.filter((r) => {
      if (source !== 'all' && r.source !== source) return false;
      if (origin !== 'all' && r.origin !== origin) return false;
      if (!q) return true;
      return [r.id, r.fullName, r.email, r.college, r.referralCode ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    return filtered.sort((a, b) =>
      dir === 'desc' ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt),
    );
  }, [state.registrations, query, source, origin, dir]);

  const hasFilters = query.trim() !== '' || source !== 'all' || origin !== 'all';
  const clearFilters = () => {
    setQuery('');
    setSource('all');
    setOrigin('all');
    setVisible(PAGE_SIZE);
  };

  const exportCsv = () => {
    if (rows.length === 0) return;
    downloadTextFile(`registrations-${toDateKey(new Date())}.csv`, registrationsToCsv(rows));
    notify('success', `Exported ${rows.length} record${rows.length === 1 ? '' : 's'} to CSV.`);
  };

  return (
    <>
      <PageHeader
        title="Registrations"
        description="Every unique registration stored in this browser. This table contains personal data and is never shown on the public page."
        actions={
          <button type="button" className="btn-primary" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="h-4 w-4" aria-hidden /> Export CSV{rows.length > 0 ? ` (${rows.length})` : ''}
          </button>
        }
      />

      <div className="card">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              aria-label="Search registrations"
              placeholder="Search name, email, college, ID or code"
              className="input pl-9"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(PAGE_SIZE);
              }}
            />
          </div>
          <select
            aria-label="Filter by acquisition source"
            className="input"
            value={source}
            onChange={(e) => {
              setSource(e.target.value as 'all' | AcquisitionSource);
              setVisible(PAGE_SIZE);
            }}
          >
            <option value="all">All sources</option>
            <option value="Referral">Referral</option>
            <option value="Direct/Organic">Direct/Organic</option>
          </select>
          <select
            aria-label="Filter by record type"
            className="input"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value as 'all' | RecordOrigin);
              setVisible(PAGE_SIZE);
            }}
          >
            <option value="all">Sample + actual</option>
            <option value="sample">Sample only</option>
            <option value="actual">Actual only</option>
          </select>
        </div>

        {state.registrations.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No registrations yet"
            description="Submit the public registration form, or restore the demo data from Settings."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No registrations match your filters"
            description="Try a different search term or clear the filters."
            action={
              hasFilters ? (
                <button type="button" className="btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">ID</th>
                    <th className="th">Student</th>
                    <th className="th">Email</th>
                    <th className="th">College</th>
                    <th className="th">Source</th>
                    <th className="th">Referral code</th>
                    <th className="th" aria-sort={dir === 'desc' ? 'descending' : 'ascending'}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-navy-900"
                        onClick={() => setDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                        aria-label={`Sort by registration date, currently ${dir === 'desc' ? 'newest first' : 'oldest first'}`}
                      >
                        Registered
                        {dir === 'desc' ? <ArrowDown className="h-3.5 w-3.5" aria-hidden /> : <ArrowUp className="h-3.5 w-3.5" aria-hidden />}
                      </button>
                    </th>
                    <th className="th">Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, visible).map((r) => (
                    <tr key={r.id} className={r.origin === 'sample' ? 'bg-amber-50/30' : undefined}>
                      <td className="td whitespace-nowrap font-mono text-xs">{r.id}</td>
                      <td className="td whitespace-nowrap font-medium">{r.fullName}</td>
                      <td className="td whitespace-nowrap">{r.email}</td>
                      <td className="td min-w-[12rem]">{r.college}</td>
                      <td className="td">
                        <Badge tone={r.source === 'Referral' ? 'indigo' : 'slate'}>{r.source}</Badge>
                      </td>
                      <td className="td font-mono text-xs">{r.referralCode ?? '—'}</td>
                      <td className="td whitespace-nowrap text-slate-600">{formatDateTime(r.createdAt)}</td>
                      <td className="td">
                        <Badge tone={r.origin === 'sample' ? 'amber' : 'green'}>
                          {r.origin === 'sample' ? 'Sample' : 'Actual'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
              <p>
                Showing {Math.min(visible, rows.length)} of {rows.length}
                {hasFilters ? ` (filtered from ${state.registrations.length})` : ''}
              </p>
              {visible < rows.length && (
                <button type="button" className="btn-secondary btn-sm" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Show more
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
