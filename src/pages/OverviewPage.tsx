import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  CalendarDays,
  Gauge,
  Target,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Wallet2,
} from 'lucide-react';
import { useAppStore } from '../store/AppStore';
import { CAMPAIGN } from '../lib/constants';
import { buildLeaderboard, channelPerformance, computeStats, dailySeries } from '../lib/logic';
import { formatDateTime, formatINR, formatINRPrecise } from '../lib/utils';
import { Badge, EmptyState, PageHeader, ProgressBar, Section } from '../components/ui';
import { StatCard } from '../components/StatCard';

type Scope = 'all' | 'sample' | 'actual';

const INDIGO = '#4f46e5';
const NAVY = '#1f2850';
const MUTED = '#94a3b8';
const AXIS = { fontSize: 12, fill: '#64748b' };
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 14px rgba(16,24,64,0.08)',
  fontSize: 12,
};

export default function OverviewPage() {
  const { state } = useAppStore();
  const [scope, setScope] = useState<Scope>('all');

  const regs = useMemo(
    () => (scope === 'all' ? state.registrations : state.registrations.filter((r) => r.origin === scope)),
    [state.registrations, scope],
  );
  const stats = useMemo(() => computeStats(regs, state.spend), [regs, state.spend]);
  const series = useMemo(() => dailySeries(regs, state.campaignStart), [regs, state.campaignStart]);
  const channels = useMemo(() => channelPerformance(regs, state.ambassadors), [regs, state.ambassadors]);
  const board = useMemo(() => buildLeaderboard(state.ambassadors, regs), [state.ambassadors, regs]);
  const recent = useMemo(
    () => [...regs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [regs],
  );

  // Spend is not tracked per record. Don't pair synthetic spend with actual-only entries.
  const costUndefined = stats.costPerRegistration === null || (scope === 'actual' && state.spendIsSample);
  const costValue = costUndefined ? 'N/A' : formatINRPrecise(stats.costPerRegistration as number);
  const costHint =
    stats.total === 0
      ? 'Undefined until there is at least one registration'
      : scope === 'actual' && state.spendIsSample
        ? 'Recorded spend is sample data'
        : `${formatINR(stats.actualSpend)} ÷ ${stats.total} valid registrations`;

  const sourceData = channels.map((c) => ({ channel: c.channel, registrations: c.registrations }));
  const hasData = stats.total > 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live campaign metrics, calculated from the records stored in this browser."
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="scope" className="text-sm text-slate-500">
              Showing
            </label>
            <select
              id="scope"
              className="input w-auto py-2"
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
            >
              <option value="all">All records</option>
              <option value="sample">Sample (synthetic) only</option>
              <option value="actual">Actual (this browser) only</option>
            </select>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registration target" value={String(CAMPAIGN.target)} hint="Final-year engineering students" icon={Target} />
        <StatCard label="Campaign duration" value={`${CAMPAIGN.days} days`} hint="Fixed assignment window" icon={CalendarDays} />
        <StatCard label="Planned budget" value={formatINR(CAMPAIGN.budget)} hint="A plan, not money spent" icon={Wallet} />
        <StatCard label="Actual recorded spend" value={formatINR(stats.actualSpend)} hint={state.spendIsSample ? 'Sample value (demo)' : 'Entered by admin in Settings'} icon={Wallet2} />
        <StatCard label="Total unique registrations" value={String(stats.total)} hint={`${stats.sampleCount} sample • ${stats.actualCount} actual`} icon={Users} />
        <StatCard label="Remaining to target" value={String(stats.remaining)} hint={`of ${CAMPAIGN.target} registrations`} icon={UserPlus} />
        <StatCard label="Progress" value={`${stats.progress.toFixed(1)}%`} hint="Registrations ÷ target" icon={Gauge} />
        <StatCard label="Cost per valid registration" value={costValue} hint={costHint} icon={UserCheck} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-navy-900">Progress to {CAMPAIGN.target} registrations</span>
          <span className="text-slate-500">
            {stats.total} / {CAMPAIGN.target}
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar value={stats.progress} label="Registration progress" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Section title="Daily registration trend" description="Daily and cumulative registrations against the pace needed for the target.">
            {hasData ? (
              <div className="h-72 w-full" role="img" aria-label="Daily and cumulative registrations chart">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={series} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="daily" allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="cum" orientation="right" allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(l, p) => `${l}${p?.[0]?.payload?.date ? ` · ${p[0].payload.date}` : ''}`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="daily" dataKey="registrations" name="Daily registrations" fill={INDIGO} radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Line yAxisId="cum" type="monotone" dataKey="cumulative" name="Cumulative" stroke={NAVY} strokeWidth={2} dot={false} />
                    <Line yAxisId="cum" type="monotone" dataKey="targetPace" name={`Target pace (${CAMPAIGN.target} by day ${CAMPAIGN.days})`} stroke={MUTED} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={TrendingUp} title="No registrations yet" description="The trend appears as soon as the first registration is recorded." action={<Link to="/register" className="btn-primary">Open registration page</Link>} />
            )}
          </Section>
        </div>

        <div className="lg:col-span-2">
          <Section title="Registrations by acquisition source" description="Grouped by ambassador channel, or Direct/Organic.">
            {hasData ? (
              <div className="h-72 w-full" role="img" aria-label="Registrations by source chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="channel" width={96} tick={AXIS} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="registrations" name="Registrations" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {sourceData.map((d) => (
                        <Cell key={d.channel} fill={d.channel === 'Direct/Organic' ? MUTED : INDIGO} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={BarChart3} title="No source data yet" description="Sources are shown once registrations exist." />
            )}
            {hasData && (
              <p className="mt-3 text-xs text-slate-500">
                Referral: {stats.referralCount} • Direct/Organic: {stats.directCount}
              </p>
            )}
          </Section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Referral leaderboard"
          description="Top ambassadors by valid referred registrations."
          actions={<Link to="/admin/referrals" className="btn-secondary btn-sm">Manage</Link>}
          padded={false}
        >
          {board.length === 0 ? (
            <EmptyState icon={Users} title="No ambassadors yet" description="Add an ambassador to generate a referral link." />
          ) : (
            <ol className="divide-y divide-slate-100">
              {board.slice(0, 5).map((row) => (
                <li key={row.ambassador.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${row.rank === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {row.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy-900">{row.ambassador.name}</p>
                    <p className="font-mono text-xs text-slate-500">{row.ambassador.code}</p>
                  </div>
                  {row.ambassador.origin === 'sample' && <Badge tone="amber">Sample</Badge>}
                  <span className="text-sm font-semibold text-navy-900">{row.count}</span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section
          title="Recent registration activity"
          actions={<Link to="/admin/registrations" className="btn-secondary btn-sm">View all</Link>}
          padded={false}
        >
          {recent.length === 0 ? (
            <EmptyState icon={Users} title="No activity yet" description="New registrations will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy-900">{r.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{r.college} · {formatDateTime(r.createdAt)}</p>
                  </div>
                  <Badge tone={r.source === 'Referral' ? 'indigo' : 'slate'}>{r.source}</Badge>
                  <Badge tone={r.origin === 'sample' ? 'amber' : 'green'}>{r.origin === 'sample' ? 'Sample' : 'Actual'}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Channel performance" description="Registrations credited to each acquisition channel." padded={false}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Channel</th>
                <th className="th text-right">Registrations</th>
                <th className="th text-right">Share</th>
                <th className="th text-right">Ambassadors</th>
                <th className="th text-right">Avg per ambassador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {channels.map((c) => (
                <tr key={c.channel}>
                  <td className="td font-medium">{c.channel}</td>
                  <td className="td text-right tabular-nums">{c.registrations}</td>
                  <td className="td text-right tabular-nums">{c.share.toFixed(1)}%</td>
                  <td className="td text-right tabular-nums">{c.ambassadors}</td>
                  <td className="td text-right tabular-nums">{c.perAmbassador === null ? '—' : c.perAmbassador.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
