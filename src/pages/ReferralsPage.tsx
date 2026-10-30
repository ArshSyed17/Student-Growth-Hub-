import { useMemo, useState, type FormEvent } from 'react';
import { Link2, MessageCircle, Plus, Users } from 'lucide-react';
import { useAppStore } from '../store/AppStore';
import { buildLeaderboard } from '../lib/logic';
import { buildReferralUrl, buildShareMessage, buildWhatsAppUrl } from '../lib/utils';
import { CHANNELS } from '../lib/constants';
import type { Channel } from '../types';
import { Alert, Badge, EmptyState, Field, PageHeader, Section } from '../components/ui';
import { CopyButton } from '../components/CopyButton';
import { useToast } from '../components/Toast';

export default function ReferralsPage() {
  const { state, addAmbassador } = useAppStore();
  const notify = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState<Channel>('WhatsApp');
  const [error, setError] = useState<string | null>(null);

  const board = useMemo(
    () => buildLeaderboard(state.ambassadors, state.registrations),
    [state.ambassadors, state.registrations],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = addAmbassador({ name, channel, email });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    setName('');
    setEmail('');
    notify('success', `Ambassador added with code ${res.ambassador.code}.`);
  };

  return (
    <>
      <PageHeader
        title="Referral Leaderboard"
        description="Create ambassador codes, share links, and see who is driving valid registrations. Counts are calculated from registrations and cannot be edited."
      />

      <Section title="Add ambassador" description="A unique referral code is generated from the name.">
        <form onSubmit={onSubmit} noValidate className="grid gap-4 md:grid-cols-4">
          <Field id="amb-name" label="Ambassador name" error={error ?? undefined}>
            <input
              id="amb-name"
              className={`input ${error ? 'input-error' : ''}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Arsh Verma"
              maxLength={40}
            />
          </Field>
          <Field id="amb-channel" label="Main channel">
            <select
              id="amb-channel"
              className="input"
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
            >
              {CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field id="amb-email" label="Email" optional hint="Only used to block self-referrals.">
            <input
              id="amb-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@college.edu"
            />
          </Field>
          <div className="flex items-start md:pt-[1.7rem]">
            <button type="submit" className="btn-primary w-full">
              <Plus className="h-4 w-4" aria-hidden /> Add ambassador
            </button>
          </div>
        </form>
      </Section>

      <Section title="Ambassadors" description="Ranked by valid referred registrations." padded={false}>
        {board.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No ambassadors yet"
            description="Add your first ambassador above to generate a trackable referral link."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Rank</th>
                  <th className="th">Ambassador</th>
                  <th className="th">Code</th>
                  <th className="th">Referral URL</th>
                  <th className="th text-right">Valid registrations</th>
                  <th className="th">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {board.map(({ ambassador: a, count, rank }) => {
                  const url = buildReferralUrl(a.code);
                  return (
                    <tr key={a.id}>
                      <td className="td">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            rank === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="td whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{a.name}</span>
                          {a.origin === 'sample' && <Badge tone="amber">Sample</Badge>}
                        </div>
                        <p className="text-xs text-slate-500">{a.channel}</p>
                      </td>
                      <td className="td font-mono text-xs font-semibold">{a.code}</td>
                      <td className="td max-w-[16rem]">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate" title={url}>{url}</span>
                        </span>
                      </td>
                      <td className="td text-right text-base font-semibold tabular-nums">{count}</td>
                      <td className="td">
                        <div className="flex flex-wrap gap-2">
                          <CopyButton text={url} small />
                          <a
                            className="btn-secondary btn-sm"
                            href={buildWhatsAppUrl(buildShareMessage(url))}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Share ${a.name}'s link on WhatsApp`}
                          >
                            <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden /> WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Alert tone="info" title="How attribution works">
        Each registration is credited to at most one code, only when the code exists and is not a self-referral.
        Duplicate emails are rejected, so a person can never be counted twice. URLs use the address this app is
        currently served from.
      </Alert>
    </>
  );
}
