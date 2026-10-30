import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppState,
  BudgetCategory,
  ExperimentId,
  ExperimentRecord,
} from '../types';
import { STORAGE_KEY } from '../lib/constants';
import {
  addAmbassadorToState,
  processRegistration,
  type AmbassadorInput,
  type AmbassadorResult,
  type RegistrationInput,
  type RegistrationResult,
} from '../lib/logic';
import { createEmptyState, createSeedState } from '../lib/seed';
import { loadState, parseState, saveState } from '../lib/storage';

export type StoreRegistrationResult =
  | (Extract<RegistrationResult, { ok: true }> & { persisted: boolean })
  | Extract<RegistrationResult, { ok: false }>;

interface AppStore {
  state: AppState;
  storageError: string | null;
  addRegistration: (input: RegistrationInput) => StoreRegistrationResult;
  addAmbassador: (input: AmbassadorInput) => AmbassadorResult & { persisted?: boolean };
  updateSpend: (spend: Record<BudgetCategory, number>) => void;
  updateExperiment: (id: ExperimentId, patch: Partial<Pick<ExperimentRecord, 'status' | 'notes'>>) => void;
  resetDemo: () => void;
  clearAll: () => void;
  removeSampleData: () => void;
}

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadState());
  const [state, setState] = useState<AppState>(initial.state);
  const [storageError, setStorageError] = useState<string | null>(initial.warning);
  const stateRef = useRef<AppState>(initial.state);

  const commit = useCallback((next: AppState): boolean => {
    stateRef.current = next;
    setState(next);
    const ok = saveState(next);
    setStorageError(
      ok ? null : 'Browser storage is unavailable or full, so changes will not persist after refresh.',
    );
    return ok;
  }, []);

  // Keep several tabs of the same browser in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      const parsed = parseState(e.newValue);
      if (parsed) {
        stateRef.current = parsed;
        setState(parsed);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addRegistration = useCallback<AppStore['addRegistration']>(
    (input) => {
      const result = processRegistration(stateRef.current, input);
      if (!result.ok) return result;
      const persisted = commit(result.state);
      return { ...result, persisted };
    },
    [commit],
  );

  const addAmbassador = useCallback<AppStore['addAmbassador']>(
    (input) => {
      const result = addAmbassadorToState(stateRef.current, input);
      if (!result.ok) return result;
      const persisted = commit(result.state);
      return { ...result, persisted };
    },
    [commit],
  );

  const updateSpend = useCallback<AppStore['updateSpend']>(
    (spend) => {
      commit({ ...stateRef.current, spend, spendIsSample: false });
    },
    [commit],
  );

  const updateExperiment = useCallback<AppStore['updateExperiment']>(
    (id, patch) => {
      const cur = stateRef.current;
      const prev = cur.experiments[id];
      commit({
        ...cur,
        experiments: {
          ...cur.experiments,
          [id]: { ...prev, ...patch, updatedAt: new Date().toISOString() },
        },
      });
    },
    [commit],
  );

  // Experiments are not sample data, so their statuses and notes are kept on reset/clear.
  const resetDemo = useCallback(() => {
    commit(createSeedState(new Date(), stateRef.current.experiments));
  }, [commit]);

  const clearAll = useCallback(() => {
    commit(createEmptyState(new Date(), stateRef.current.experiments));
  }, [commit]);

  const removeSampleData = useCallback(() => {
    const cur = stateRef.current;
    const registrations = cur.registrations.filter((r) => r.origin === 'actual');
    const usedCodes = new Set(
      registrations.filter((r) => r.referralCode).map((r) => r.referralCode!.toUpperCase()),
    );
    // Keep a sample ambassador only if a real entry was credited to their code.
    const ambassadors = cur.ambassadors.filter(
      (a) => a.origin === 'actual' || usedCodes.has(a.code.toUpperCase()),
    );
    commit({
      ...cur,
      registrations,
      ambassadors,
      spend: cur.spendIsSample ? { referralRewards: 0, promoMaterials: 0, contingency: 0 } : cur.spend,
      spendIsSample: false,
    });
  }, [commit]);

  const value = useMemo<AppStore>(
    () => ({
      state,
      storageError,
      addRegistration,
      addAmbassador,
      updateSpend,
      updateExperiment,
      resetDemo,
      clearAll,
      removeSampleData,
    }),
    [
      state,
      storageError,
      addRegistration,
      addAmbassador,
      updateSpend,
      updateExperiment,
      resetDemo,
      clearAll,
      removeSampleData,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}
