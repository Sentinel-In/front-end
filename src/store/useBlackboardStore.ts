/* ============================================================
   Blackboard Store
   Read-heavy materialized view.
   ============================================================ */

import { create } from 'zustand';
import type { Blackboard } from '../types';
import { blackboardApi } from '../mock/blackboardApi';

interface BlackboardState {
  blackboard: Blackboard | null;
  caseId: string | null;
  isLoading: boolean;
  error: Error | null;
  lastFetchedAt: string | null;

  // read
  load: (caseId?: string) => Promise<void>;
  refresh: () => Promise<void>;

  // local-only UI state — NEVER mutates evidence
  acknowledgedGapIds: string[];
  acknowledgeGap: (gapId: string) => void;
  selectedAssetId: string | null;
  selectAsset: (id: string | null) => void;
}

export const useBlackboardStore = create<BlackboardState>((set, get) => ({
  blackboard: null,
  caseId: null,
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  acknowledgedGapIds: [],
  selectedAssetId: null,

  load: async (caseId?: string) => {
    // If already loading, or already loaded this case, skip
    if (get().isLoading) return;
    if (get().blackboard && get().caseId === (caseId || 'CIAD-2026-0037')) return;

    set({ isLoading: true, error: null });
    try {
      const blackboard = await blackboardApi.getBlackboard();
      set({
        blackboard,
        caseId: blackboard.case.case_id,
        isLoading: false,
        lastFetchedAt: new Date().toISOString()
      });
    } catch (err) {
      set({ error: err as Error, isLoading: false });
    }
  },

  refresh: async () => {
    const currentCaseId = get().caseId;
    if (!currentCaseId) return;

    set({ isLoading: true, error: null });
    try {
      const blackboard = await blackboardApi.getBlackboard();
      set({
        blackboard,
        isLoading: false,
        lastFetchedAt: new Date().toISOString()
      });
    } catch (err) {
      set({ error: err as Error, isLoading: false });
    }
  },

  acknowledgeGap: (gapId: string) => {
    set((state) => ({
      acknowledgedGapIds: [...state.acknowledgedGapIds, gapId]
    }));
  },

  selectAsset: (id: string | null) => {
    set({ selectedAssetId: id });
  }
}));
