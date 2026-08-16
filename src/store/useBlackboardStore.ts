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

  // version awareness
  readVersion: number;
  latestVersion: number;
  isStale: boolean;
  acceptNewVersion: () => Promise<void>;
  pinCurrentVersion: () => void;

  // read
  load: (caseId: string) => Promise<void>;
  refresh: () => Promise<void>;
  simulateBackendCommit: () => void; // Dev mode simulate

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

  readVersion: 0,
  latestVersion: 0,
  isStale: false,

  acknowledgedGapIds: [],
  selectedAssetId: null,

  load: async (caseId: string) => {
    const targetCaseId = caseId;
    // If already loading, or already loaded this case, skip
    if (get().isLoading) return;
    if (get().blackboard && get().caseId === targetCaseId) return;

    set({ isLoading: true, error: null });
    try {
      const blackboard = await blackboardApi.getBlackboard(targetCaseId);
      const version = blackboard.audit?.head_version || 0;
      set({
        blackboard,
        caseId: blackboard.case.case_id,
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
        readVersion: version,
        latestVersion: version,
        isStale: false,
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
      const blackboard = await blackboardApi.getBlackboard(currentCaseId);
      const version = blackboard.audit.head_version;
      
      // If we are just refreshing the same version we had, or user explicitly refreshes,
      // we might want to auto-accept or not. For now, refresh always accepts the newest.
      set({
        blackboard,
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
        readVersion: version,
        latestVersion: version,
        isStale: false,
      });
    } catch (err) {
      set({ error: err as Error, isLoading: false });
    }
  },

  acceptNewVersion: async () => {
    // A real app would fetch the new version.
    // For now, just sync the versions and clear isStale.
    set({
      readVersion: get().latestVersion,
      isStale: false
    });
  },

  pinCurrentVersion: () => {
    // Reject the update: stop showing the banner, wait for the next version bump
    set({
      isStale: false
    });
  },

  simulateBackendCommit: () => {
    const newVersion = get().latestVersion + 1;
    set({
      latestVersion: newVersion,
      isStale: newVersion > get().readVersion,
    });
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
