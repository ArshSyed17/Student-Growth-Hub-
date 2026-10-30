import { describe, expect, it } from 'vitest';
import {
  addAmbassadorToState,
  buildLeaderboard,
  channelPerformance,
  computeStats,
  dailySeries,
  generateAmbassadorCode,
  processRegistration,
  validateRegistration,
} from '../src/lib/logic';
import { createEmptyState, createSeedState, SAMPLE_REGISTRATION_COUNT } from '../src/lib/seed';
import {
  buildReferralUrl,
  buildWhatsAppUrl,
  isValidEmail,
  normalizeEmail,
  registrationsToCsv,
} from '../src/lib/utils';
import { parseState } from '../src/lib/storage';
import type { AppState } from '../src/types';

const NOW = new Date(2026, 9, 30, 15, 0, 0);

function stateWithAmbassador(): AppState {
  const base = createEmptyState(NOW);
  const res = addAmbassadorToState(base, { name: 'Arsh Verma', channel: 'WhatsApp', email: 'arsh@example.com' }, NOW);
  if (!res.ok) throw new Error('setup failed');
  return res.state;
}

const valid = {
  fullName: 'Asha Rao',
  email: 'asha@college.edu',
  college: 'Demo College',
  referralCode: '',
  consent: true,
};

describe('email helpers', () => {
  it('normalises case, whitespace, plus-tags and gmail dots', () => {
    expect(normalizeEmail('  Asha@College.EDU ')).toBe('asha@college.edu');
    expect(normalizeEmail('asha+workshop@college.edu')).toBe('asha@college.edu');
    expect(normalizeEmail('A.s.h.a@gmail.com')).toBe('asha@gmail.com');
    expect(normalizeEmail('asha@googlemail.com')).toBe('asha@gmail.com');
  });
  it('validates format', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@c.com')).toBe(false);
  });
});

describe('validateRegistration', () => {
  it('flags every missing required field', () => {
    const e = validateRegistration({ fullName: '', email: '', college: '', consent: false });
    expect(Object.keys(e).sort()).toEqual(['college', 'consent', 'email', 'fullName']);
  });
  it('flags a bad email and bad referral code', () => {
    const e = validateRegistration({ ...valid, email: 'nope', referralCode: '!!' });
    expect(e.email).toBeTruthy();
    expect(e.referralCode).toBeTruthy();
  });
  it('accepts a valid form with empty optional code', () => {
    expect(validateRegistration(valid)).toEqual({});
  });
});

describe('processRegistration', () => {
  it('records a direct registration and prepends it', () => {
    const state = createEmptyState(NOW);
    const res = processRegistration(state, valid, NOW);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.registration.source).toBe('Direct/Organic');
    expect(res.registration.referralCode).toBeNull();
    expect(res.registration.origin).toBe('actual');
    expect(res.state.registrations).toHaveLength(1);
  });

  it('rejects duplicates after normalisation', () => {
    const state = createEmptyState(NOW);
    const first = processRegistration(state, valid, NOW);
    if (!first.ok) throw new Error('setup failed');
    const dup = processRegistration(first.state, { ...valid, email: ' ASHA+x@College.edu ' }, NOW);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.reason).toBe('duplicate');
  });

  it('returns validation errors without changing state', () => {
    const state = createEmptyState(NOW);
    const res = processRegistration(state, { ...valid, email: 'bad' }, NOW);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('validation');
  });

  it('attributes a known referral code (case-insensitive)', () => {
    const state = stateWithAmbassador();
    const code = state.ambassadors[0].code;
    const res = processRegistration(state, { ...valid, referralCode: code.toLowerCase() }, NOW);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.registration.source).toBe('Referral');
    expect(res.registration.referralCode).toBe(code);
  });

  it('falls back to Direct/Organic for unknown codes', () => {
    const res = processRegistration(stateWithAmbassador(), { ...valid, referralCode: 'NOPE99' }, NOW);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.registration.source).toBe('Direct/Organic');
    expect(res.referralNote).toMatch(/not recognised/);
  });

  it('blocks self-referral by email and by name', () => {
    const state = stateWithAmbassador();
    const code = state.ambassadors[0].code;
    const byEmail = processRegistration(
      state,
      { ...valid, fullName: 'Someone Else', email: 'Arsh@example.com', referralCode: code },
      NOW,
    );
    const byName = processRegistration(state, { ...valid, fullName: 'arsh verma', referralCode: code }, NOW);
    for (const res of [byEmail, byName]) {
      expect(res.ok).toBe(true);
      if (!res.ok) continue;
      expect(res.registration.source).toBe('Direct/Organic');
      expect(res.referralNote).toMatch(/Self-referrals/);
    }
  });

  it('generates unique registration IDs', () => {
    let state = createEmptyState(NOW);
    for (let i = 0; i < 20; i++) {
      const res = processRegistration(state, { ...valid, email: `s${i}@college.edu` }, NOW, () => 0.5);
      if (!res.ok) throw new Error('unexpected failure');
      state = res.state;
    }
    expect(new Set(state.registrations.map((r) => r.id)).size).toBe(20);
  });
});

describe('ambassadors and leaderboard', () => {
  it('generates unique codes', () => {
    const a = generateAmbassadorCode('Arsh Verma', new Set());
    expect(a).toBe('ARSH01');
    expect(generateAmbassadorCode('Arsh Verma', new Set([a]))).toBe('ARSH02');
    expect(generateAmbassadorCode('Al', new Set())).toBe('ALXX01');
  });

  it('rejects invalid ambassador input', () => {
    const state = createEmptyState(NOW);
    expect(addAmbassadorToState(state, { name: 'A', channel: 'Other' }).ok).toBe(false);
    expect(addAmbassadorToState(state, { name: 'Valid Name', channel: 'Other', email: 'bad' }).ok).toBe(false);
  });

  it('derives counts and ranks from registrations (ties share a rank)', () => {
    let state = stateWithAmbassador();
    const second = addAmbassadorToState(state, { name: 'Priya Nair', channel: 'Instagram' }, NOW);
    if (!second.ok) throw new Error('setup failed');
    state = second.state;
    const [a, b] = state.ambassadors;
    const add = (email: string, code: string) => {
      const r = processRegistration(state, { ...valid, fullName: email, email, referralCode: code }, NOW);
      if (!r.ok) throw new Error('setup failed');
      state = r.state;
    };
    add('x1@college.edu', a.code);
    add('x2@college.edu', a.code);
    add('x3@college.edu', b.code);
    const board = buildLeaderboard(state.ambassadors, state.registrations);
    expect(board[0].ambassador.code).toBe(a.code);
    expect(board[0].count).toBe(2);
    expect(board[0].rank).toBe(1);
    expect(board[1].rank).toBe(2);
    const stats = computeStats(state.registrations, state.spend);
    expect(stats.total).toBe(3);
    expect(stats.referralCount).toBe(3);
    expect(stats.costPerRegistration).toBe(0);
  });
});

describe('analytics', () => {
  it('cost per registration is null when there are no registrations', () => {
    const stats = computeStats([], { referralRewards: 100, promoMaterials: 0, contingency: 0 });
    expect(stats.costPerRegistration).toBeNull();
    expect(stats.remaining).toBe(500);
    expect(stats.progress).toBe(0);
  });

  it('seed data is labelled sample, unique and within 20-30 records', () => {
    const seed = createSeedState(NOW);
    expect(seed.registrations).toHaveLength(SAMPLE_REGISTRATION_COUNT);
    expect(SAMPLE_REGISTRATION_COUNT).toBeGreaterThanOrEqual(20);
    expect(SAMPLE_REGISTRATION_COUNT).toBeLessThanOrEqual(30);
    expect(seed.registrations.every((r) => r.origin === 'sample')).toBe(true);
    expect(seed.ambassadors.every((a) => a.origin === 'sample')).toBe(true);
    expect(new Set(seed.registrations.map((r) => r.normalizedEmail)).size).toBe(seed.registrations.length);
    expect(seed.ambassadors.length).toBeGreaterThanOrEqual(3);
    expect(seed.spendIsSample).toBe(true);
    expect(seed.registrations.every((r) => new Date(r.createdAt).getTime() <= NOW.getTime())).toBe(true);
  });

  it('daily series sums to the total and covers at least 7 days', () => {
    const seed = createSeedState(NOW);
    const series = dailySeries(seed.registrations, seed.campaignStart, NOW);
    expect(series.length).toBeGreaterThanOrEqual(7);
    expect(series.reduce((s, p) => s + p.registrations, 0)).toBe(seed.registrations.length);
    expect(series[series.length - 1].cumulative).toBe(seed.registrations.length);
  });

  it('channel performance sums to the total', () => {
    const seed = createSeedState(NOW);
    const rows = channelPerformance(seed.registrations, seed.ambassadors);
    expect(rows.reduce((s, r) => s + r.registrations, 0)).toBe(seed.registrations.length);
    expect(rows.some((r) => r.channel === 'Direct/Organic')).toBe(true);
  });

  it('a registration made after seeding shows up in the derived stats', () => {
    const seed = createSeedState(NOW);
    const before = computeStats(seed.registrations, seed.spend).total;
    const res = processRegistration(seed, valid, NOW);
    if (!res.ok) throw new Error('unexpected failure');
    const after = computeStats(res.state.registrations, res.state.spend);
    expect(after.total).toBe(before + 1);
    expect(after.actualCount).toBe(1);
  });
});

describe('CSV export, URLs and persistence', () => {
  it('escapes quotes, commas and formula-injection characters', () => {
    const state = createEmptyState(NOW);
    const res = processRegistration(
      state,
      { ...valid, fullName: '=SUM(A1)', college: 'College, "North" Campus' },
      NOW,
    );
    if (!res.ok) throw new Error('unexpected failure');
    const csv = registrationsToCsv(res.state.registrations);
    const [header, row] = csv.split('\n');
    expect(header).toContain('Registration ID');
    expect(row).toContain("'=SUM(A1)");
    expect(row).toContain('"College, ""North"" Campus"');
    expect(row).toContain('Actual (local entry)');
  });

  it('builds referral and WhatsApp URLs', () => {
    expect(buildReferralUrl('ARSH01', 'http://localhost:5173')).toBe('http://localhost:5173/register?ref=ARSH01');
    const wa = buildWhatsAppUrl('Hi there & welcome');
    expect(wa.startsWith('https://wa.me/?text=')).toBe(true);
    expect(wa).toContain(encodeURIComponent('Hi there & welcome'));
  });

  it('round-trips state through JSON and rejects garbage', () => {
    const seed = createSeedState(NOW);
    const parsed = parseState(JSON.stringify(seed));
    expect(parsed?.registrations).toHaveLength(seed.registrations.length);
    expect(parseState('not json')).toBeNull();
    expect(parseState('{"schemaVersion":2}')).toBeNull();
  });
});
