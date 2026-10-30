import type { AppState, Registration } from '../types';
import { STORAGE_KEY } from './constants';
import { createSeedState, defaultExperiments } from './seed';

function isRegistrationLike(r: unknown): r is Registration {
  if (!r || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.fullName === 'string' &&
    typeof o.email === 'string' &&
    typeof o.normalizedEmail === 'string' &&
    typeof o.createdAt === 'string' &&
    (o.source === 'Referral' || o.source === 'Direct/Organic') &&
    (o.origin === 'sample' || o.origin === 'actual')
  );
}

/** Parses and sanity-checks a stored state string. Returns null when invalid. */
export function parseState(raw: string): AppState | null {
  try {
    const v = JSON.parse(raw) as Partial<AppState> | null;
    if (!v || v.schemaVersion !== 1) return null;
    if (!Array.isArray(v.registrations) || !Array.isArray(v.ambassadors)) return null;
    if (!v.spend || typeof v.spend !== 'object') return null;
    if (typeof v.campaignStart !== 'string') return null;
    const spend = {
      referralRewards: Math.max(0, Number(v.spend.referralRewards) || 0),
      promoMaterials: Math.max(0, Number(v.spend.promoMaterials) || 0),
      contingency: Math.max(0, Number(v.spend.contingency) || 0),
    };
    return {
      schemaVersion: 1,
      campaignStart: v.campaignStart,
      registrations: v.registrations.filter(isRegistrationLike),
      ambassadors: v.ambassadors,
      spend,
      spendIsSample: Boolean(v.spendIsSample),
      experiments: { ...defaultExperiments(), ...(v.experiments ?? {}) },
    };
  } catch {
    return null;
  }
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export interface LoadResult {
  state: AppState;
  warning: string | null;
}

/**
 * Loads persisted state. Seeds demo data ONLY when nothing is stored yet
 * (first visit) or the stored value is unreadable. Existing data is never overwritten.
 */
export function loadState(): LoadResult {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      state: createSeedState(),
      warning: 'Browser storage is unavailable, so changes will not persist after refresh.',
    };
  }

  if (raw) {
    const parsed = parseState(raw);
    if (parsed) return { state: parsed, warning: null };
    const seeded = createSeedState();
    saveState(seeded);
    return {
      state: seeded,
      warning: 'Stored data could not be read, so the demo dataset was restored.',
    };
  }

  const seeded = createSeedState();
  const ok = saveState(seeded);
  return {
    state: seeded,
    warning: ok ? null : 'Browser storage is unavailable, so changes will not persist after refresh.',
  };
}
