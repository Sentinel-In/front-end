import { create } from 'zustand';
import type { CaseSummary } from '../types';

interface CaseIndexState {
  cases: CaseSummary[];
  filterPriority: string | null;
  filterPhase: string | null;
  sortField: 'age_days' | 'priority' | 'open_blockers';
  sortDirection: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
}

interface CaseIndexActions {
  setCases: (cases: CaseSummary[]) => void;
  setFilterPriority: (prio: string | null) => void;
  setFilterPhase: (phase: string | null) => void;
  setSort: (field: CaseIndexState['sortField'], direction: 'asc' | 'desc') => void;
  fetchCases: () => Promise<void>;
}

export const useCaseIndexStore = create<CaseIndexState & CaseIndexActions>()((set) => ({
  cases: [],
  filterPriority: null,
  filterPhase: null,
  sortField: 'priority',
  sortDirection: 'desc',
  isLoading: false,
  error: null,

  setCases: (cases) => set({ cases }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setFilterPhase: (filterPhase) => set({ filterPhase }),
  setSort: (sortField, sortDirection) => set({ sortField, sortDirection }),
  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const { blackboardApi } = await import('../mock/blackboardApi');
      const cases = await blackboardApi.listCases();
      set({ cases, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  }
}));
