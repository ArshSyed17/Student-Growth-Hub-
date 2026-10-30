import type {
  AcquisitionSource,
  Ambassador,
  AppState,
  BudgetCategory,
  Channel,
  Registration,
} from '../types';
import { CAMPAIGN } from './constants';
import {
  addDays,
  clamp,
  diffDays,
  formatShortDate,
  isValidEmail,
  normalizeEmail,
  parseDateKey,
  toDateKey,
} from './utils';

/* ====================== Registration ====================== */

export interface RegistrationInput {
  fullName: string;
  email: string;
  college: string;
  referralCode?: string;
  consent: boolean;
}

export type FieldName = 'fullName' | 'email' | 'college' | 'referralCode' | 'consent';
export type FieldErrors = Partial<Record<FieldName, string>>;

export const REFERRAL_CODE_RE = /^[A-Za-z0-9_-]{3,20}$/;

export function validateRegistration(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {};

  const name = input.fullName.trim();
  if (!name) errors.fullName = 'Please enter your full name.';
  else if (name.length < 2) errors.fullName = 'Name must be at least 2 characters.';
  else if (name.length > 80) errors.fullName = 'Name must be 80 characters or fewer.';

  const email = input.email.trim();
  if (!email) errors.email = 'Please enter your email address.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address, e.g. name@college.edu.';

  const college = input.college.trim();
  if (!college) errors.college = 'Please enter your college name.';
  else if (college.length < 2) errors.college = 'College name must be at least 2 characters.';
  else if (college.length > 120) errors.college = 'College name must be 120 characters or fewer.';

  const code = (input.referralCode ?? '').trim();
  if (code && !REFERRAL_CODE_RE.test(code)) {
    errors.referralCode = 'Referral codes use 3–20 letters, numbers, hyphens or underscores.';
  }

  if (!input.consent) errors.consent = 'Please accept to continue.';

  return errors;
}

export type RegistrationResult =
  | { ok: true; state: AppState; registration: Registration; referralNote?: string }
  | { ok: false; reason: 'validation' | 'duplicate'; errors: FieldErrors };

export function generateRegistrationId(
  existing: Set<string>,
  now: Date = new Date(),
  rand: () => number = Math.random,
): string {
  for (let i = 0; i < 50; i++) {
    const suffix = Math.floor(rand() * 36 ** 4)
      .toString(36)
      .toUpperCase()
      .padStart(4, '0');
    const id = `SGH-${now.getTime().toString(36).toUpperCase()}-${suffix}`;
    if (!existing.has(id)) return id;
  }
  // Practically unreachable; fall back to a counter-based id.
  return `SGH-${now.getTime().toString(36).toUpperCase()}-${existing.size}`;
}

/** Pure function: validates, de-duplicates, attributes and returns the next state. */
export function processRegistration(
  state: AppState,
  input: RegistrationInput,
  now: Date = new Date(),
  rand: () => number = Math.random,
): RegistrationResult {
  const errors = validateRegistration(input);
  if (Object.keys(errors).length > 0) return { ok: false, reason: 'validation', errors };

  const email = input.email.trim();
  const normalizedEmail = normalizeEmail(email);
  if (state.registrations.some((r) => r.normalizedEmail === normalizedEmail)) {
    return {
      ok: false,
      reason: 'duplicate',
      errors: { email: 'This email address is already registered. Each email can register once.' },
    };
  }

  const fullName = input.fullName.trim();
  const enteredCode = (input.referralCode ?? '').trim().toUpperCase();

  let source: AcquisitionSource = 'Direct/Organic';
  let creditedCode: string | null = null;
  let referralNote: string | undefined;

  if (enteredCode) {
    const ambassador = state.ambassadors.find((a) => a.code.toUpperCase() === enteredCode);
    if (!ambassador) {
      referralNote = `Referral code ${enteredCode} was not recognised, so this registration was recorded as Direct/Organic.`;
    } else if (isSelfReferral(ambassador, fullName, normalizedEmail)) {
      referralNote =
        'Self-referrals are not credited, so this registration was recorded as Direct/Organic.';
    } else {
      source = 'Referral';
      creditedCode = ambassador.code;
    }
  }

  const registration: Registration = {
    id: generateRegistrationId(new Set(state.registrations.map((r) => r.id)), now, rand),
    fullName,
    email,
    normalizedEmail,
    college: input.college.trim(),
    source,
    referralCode: creditedCode,
    createdAt: now.toISOString(),
    origin: 'actual',
    consent: true,
  };

  return {
    ok: true,
    state: { ...state, registrations: [registration, ...state.registrations] },
    registration,
    referralNote,
  };
}

function isSelfReferral(ambassador: Ambassador, fullName: string, normalizedEmail: string): boolean {
  if (ambassador.email && normalizeEmail(ambassador.email) === normalizedEmail) return true;
  return ambassador.name.trim().toLowerCase() === fullName.trim().toLowerCase();
}

/* ====================== Ambassadors ====================== */

export function generateAmbassadorCode(name: string, existingCodes: Set<string>): string {
  const letters = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');
  const upper = new Set([...existingCodes].map((c) => c.toUpperCase()));
  for (let n = 1; n < 1000; n++) {
    const code = `${letters}${String(n).padStart(2, '0')}`;
    if (!upper.has(code)) return code;
  }
  return `${letters}${Date.now().toString(36).toUpperCase()}`;
}

export interface AmbassadorInput {
  name: string;
  channel: Channel;
  email?: string;
}

export type AmbassadorResult =
  | { ok: true; state: AppState; ambassador: Ambassador }
  | { ok: false; error: string };

export function addAmbassadorToState(
  state: AppState,
  input: AmbassadorInput,
  now: Date = new Date(),
): AmbassadorResult {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: 'Ambassador name must be at least 2 characters.' };
  if (name.length > 40) return { ok: false, error: 'Ambassador name must be 40 characters or fewer.' };
  const email = (input.email ?? '').trim();
  if (email && !isValidEmail(email)) return { ok: false, error: 'Enter a valid email or leave it blank.' };

  const code = generateAmbassadorCode(name, new Set(state.ambassadors.map((a) => a.code)));
  const ambassador: Ambassador = {
    id: `AMB-${code}`,
    name,
    email: email || null,
    code,
    channel: input.channel,
    createdAt: now.toISOString(),
    origin: 'actual',
  };
  return { ok: true, state: { ...state, ambassadors: [...state.ambassadors, ambassador] }, ambassador };
}

/* ====================== Derived analytics ====================== */

export interface Stats {
  total: number;
  remaining: number;
  progress: number;
  actualSpend: number;
  costPerRegistration: number | null;
  referralCount: number;
  directCount: number;
  sampleCount: number;
  actualCount: number;
}

export function totalSpend(spend: Record<BudgetCategory, number>): number {
  return Object.values(spend).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

export function computeStats(regs: Registration[], spend: Record<BudgetCategory, number>): Stats {
  const total = regs.length;
  const actualSpend = totalSpend(spend);
  const referralCount = regs.filter((r) => r.source === 'Referral').length;
  const sampleCount = regs.filter((r) => r.origin === 'sample').length;
  return {
    total,
    remaining: Math.max(0, CAMPAIGN.target - total),
    progress: Math.min(100, (total / CAMPAIGN.target) * 100),
    actualSpend,
    costPerRegistration: total > 0 ? actualSpend / total : null,
    referralCount,
    directCount: total - referralCount,
    sampleCount,
    actualCount: total - sampleCount,
  };
}

export interface LeaderboardRow {
  ambassador: Ambassador;
  count: number;
  rank: number;
}

/** Referral counts are always derived from registrations, never stored. */
export function buildLeaderboard(ambassadors: Ambassador[], regs: Registration[]): LeaderboardRow[] {
  const counts = new Map<string, number>();
  for (const r of regs) {
    if (r.source === 'Referral' && r.referralCode) {
      const key = r.referralCode.toUpperCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const rows = ambassadors.map((ambassador) => ({
    ambassador,
    count: counts.get(ambassador.code.toUpperCase()) ?? 0,
  }));
  rows.sort((a, b) => b.count - a.count || a.ambassador.name.localeCompare(b.ambassador.name));
  return rows.map((row) => ({ ...row, rank: 1 + rows.filter((o) => o.count > row.count).length }));
}

export interface ChannelRow {
  channel: string;
  registrations: number;
  share: number;
  ambassadors: number;
  perAmbassador: number | null;
}

export function channelPerformance(regs: Registration[], ambassadors: Ambassador[]): ChannelRow[] {
  const byCode = new Map(ambassadors.map((a) => [a.code.toUpperCase(), a]));
  const map = new Map<string, { registrations: number; ambassadors: number }>();
  const ensure = (c: string) => {
    if (!map.has(c)) map.set(c, { registrations: 0, ambassadors: 0 });
    return map.get(c)!;
  };
  ensure('Direct/Organic');
  for (const a of ambassadors) ensure(a.channel).ambassadors += 1;
  for (const r of regs) {
    if (r.source === 'Referral' && r.referralCode) {
      const amb = byCode.get(r.referralCode.toUpperCase());
      ensure(amb ? amb.channel : 'Other').registrations += 1;
    } else {
      ensure('Direct/Organic').registrations += 1;
    }
  }
  const total = regs.length;
  return [...map.entries()]
    .map(([channel, v]) => ({
      channel,
      registrations: v.registrations,
      share: total > 0 ? (v.registrations / total) * 100 : 0,
      ambassadors: v.ambassadors,
      perAmbassador: v.ambassadors > 0 ? v.registrations / v.ambassadors : null,
    }))
    .sort((a, b) => b.registrations - a.registrations || a.channel.localeCompare(b.channel));
}

export interface DailyPoint {
  label: string;
  date: string;
  registrations: number;
  cumulative: number;
  targetPace: number;
}

export const MAX_CHART_DAYS = 30;

/** Daily series from campaign start. Always covers at least the 7 campaign days. */
export function dailySeries(
  regs: Registration[],
  campaignStart: string,
  now: Date = new Date(),
): DailyPoint[] {
  const todayKey = toDateKey(now);
  const elapsed = diffDays(campaignStart, todayKey) + 1;
  const startKey = elapsed > MAX_CHART_DAYS ? toDateKey(addDays(now, -(MAX_CHART_DAYS - 1))) : campaignStart;
  const n = clamp(diffDays(startKey, todayKey) + 1, CAMPAIGN.days, MAX_CHART_DAYS);

  const counts = new Array<number>(n).fill(0);
  for (const r of regs) {
    const idx = clamp(diffDays(startKey, toDateKey(new Date(r.createdAt))), 0, n - 1);
    counts[idx] += 1;
  }

  const startDate = parseDateKey(startKey);
  let running = 0;
  return counts.map((count, i) => {
    running += count;
    const d = addDays(startDate, i);
    return {
      label: `Day ${i + 1}`,
      date: formatShortDate(d),
      registrations: count,
      cumulative: running,
      targetPace: Math.min(CAMPAIGN.target, Math.round((CAMPAIGN.target * (i + 1)) / CAMPAIGN.days)),
    };
  });
}
