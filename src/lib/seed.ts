import type { Ambassador, AppState, ExperimentRecord, Registration } from '../types';
import { EXPERIMENTS } from './constants';
import { generateAmbassadorCode } from './logic';
import { addDays, normalizeEmail, toDateKey } from './utils';

export function defaultExperiments(): AppState['experiments'] {
  const out = {} as Record<string, ExperimentRecord>;
  for (const e of EXPERIMENTS) out[e.id] = { status: 'Planned', notes: '', updatedAt: null };
  return out as AppState['experiments'];
}

export function createEmptyState(now: Date = new Date(), experiments = defaultExperiments()): AppState {
  return {
    schemaVersion: 1,
    campaignStart: toDateKey(now),
    registrations: [],
    ambassadors: [],
    spend: { referralRewards: 0, promoMaterials: 0, contingency: 0 },
    spendIsSample: false,
    experiments,
  };
}

/** Small deterministic PRNG so the demo data is stable for a given date. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rng: () => number, weights: number[]): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

const FIRST = [
  'Aditya', 'Ananya', 'Bhavya', 'Charan', 'Deepika', 'Esha', 'Farhan', 'Gayatri', 'Harsh',
  'Ishita', 'Jayanth', 'Kavya', 'Lakshmi', 'Manoj', 'Nikhil', 'Oviya', 'Pranav', 'Rahul',
  'Sneha', 'Tarun', 'Uday', 'Vidya', 'Yash', 'Zoya',
];
const LAST = [
  'Reddy', 'Sharma', 'Patel', 'Menon', 'Gupta', 'Singh', 'Kulkarni', 'Joshi', 'Bose', 'Naidu',
  'Chopra', 'Pillai', 'Desai', 'Shetty', 'Mishra',
];
// Fictional institutions so no real college is implied.
const COLLEGES = [
  'Sample Institute of Technology',
  'Demo College of Engineering',
  'Example University - Engineering Wing',
  'Placeholder Institute of Engineering',
  'Test Engineering College',
  'Sandbox Technical University',
];

const AMBASSADOR_SEED: { name: string; channel: Ambassador['channel']; weight: number }[] = [
  { name: 'Arsh Verma', channel: 'WhatsApp', weight: 6 },
  { name: 'Priya Nair', channel: 'Instagram', weight: 4 },
  { name: 'Karthik Rao', channel: 'College Club', weight: 3 },
  { name: 'Neha Iyer', channel: 'LinkedIn', weight: 2 },
  { name: 'Rohan Das', channel: 'Telegram', weight: 1 },
];

export const SAMPLE_REGISTRATION_COUNT = 27;

/** Synthetic demo dataset. Every record is flagged origin: "sample". */
export function createSeedState(now: Date = new Date(), experiments = defaultExperiments()): AppState {
  const rng = mulberry32(20_260_601);
  const start = addDays(now, -6);
  start.setHours(0, 0, 0, 0);

  const codes = new Set<string>();
  const ambassadors: Ambassador[] = AMBASSADOR_SEED.map((a) => {
    const code = generateAmbassadorCode(a.name, codes);
    codes.add(code);
    return {
      id: `AMB-${code}`,
      name: a.name,
      email: `${a.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      code,
      channel: a.channel,
      createdAt: start.toISOString(),
      origin: 'sample',
    };
  });

  const dayWeights = [4, 5, 6, 8, 10, 12, 14];
  const registrations: Registration[] = [];
  for (let i = 0; i < SAMPLE_REGISTRATION_COUNT; i++) {
    const first = FIRST[Math.floor(rng() * FIRST.length)];
    const last = LAST[Math.floor(rng() * LAST.length)];
    const dayIdx = pickWeighted(rng, dayWeights);
    let when = addDays(start, dayIdx);
    when.setHours(9 + Math.floor(rng() * 13), Math.floor(rng() * 60), 0, 0);
    if (when.getTime() > now.getTime()) {
      when = new Date(now.getTime() - Math.floor(rng() * 180 + 5) * 60_000);
    }

    const isReferral = rng() < 0.62;
    const amb = isReferral ? ambassadors[pickWeighted(rng, AMBASSADOR_SEED.map((a) => a.weight))] : null;
    const email = `${first}.${last}${i + 1}@example.com`.toLowerCase();

    registrations.push({
      id: `SGH-DEMO-${String(i + 1).padStart(3, '0')}`,
      fullName: `${first} ${last}`,
      email,
      normalizedEmail: normalizeEmail(email),
      college: COLLEGES[Math.floor(rng() * COLLEGES.length)],
      source: amb ? 'Referral' : 'Direct/Organic',
      referralCode: amb ? amb.code : null,
      createdAt: when.toISOString(),
      origin: 'sample',
      consent: true,
    });
  }
  registrations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    schemaVersion: 1,
    campaignStart: toDateKey(start),
    registrations,
    ambassadors,
    spend: { referralRewards: 350, promoMaterials: 120, contingency: 0 },
    spendIsSample: true,
    experiments,
  };
}
