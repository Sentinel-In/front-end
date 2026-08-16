/* ============================================================
   Role Store — SPEC-004 §0, §3
   Manages current role, derived capabilities, identity, and config.
   Persisted to localStorage under 'sentinel.role'.
   
   MIGRATION: 'oncall' → 'lead_manager', 'analyst' → 'risk_analyst'
   Any browser holding a stale value is silently corrected on hydration.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, RoleConfig, TabConfig } from '../types';
import { assertRegisteredRoute, ROUTES } from '../routes';

// === Migration ===

const ROLE_MIGRATION: Record<string, Role> = {
  oncall: 'lead_manager',
  analyst: 'risk_analyst',
};

export function migrateStoredRole(raw: string | null): Role {
  if (!raw) return 'executive';
  if (raw in ROLE_MIGRATION) return ROLE_MIGRATION[raw];
  if (['executive', 'lead_manager', 'risk_analyst', 'engineer'].includes(raw)) return raw as Role;
  return 'executive';
}

// === Tab Definitions ===

const EXECUTIVE_TABS: TabConfig[] = [
  { id: 'dashboard', label: 'Portfolio', route: ROUTES.dashboard, icon: 'LayoutDashboard' },
  { id: 'approvals', label: 'Approvals', route: ROUTES.approvals, icon: 'ShieldCheck' },
  { id: 'impact', label: 'Asset Impact', route: ROUTES.assetImpact, icon: 'FileText' },
  { id: 'brief', label: 'Board Brief', route: ROUTES.brief, icon: 'FileText' },
];

const LEAD_TABS: TabConfig[] = [
  { id: 'triage', label: 'Triage Hub', route: ROUTES.triage, icon: 'Inbox' },
  { id: 'tickets', label: 'Tickets', route: ROUTES.tickets, icon: 'CheckSquare' },
  { id: 'impact', label: 'Asset Impact', route: ROUTES.assetImpact, icon: 'FileText' },
  { id: 'evidence', label: 'Evidence', route: ROUTES.evidence, icon: 'Search' },
  { id: 'case', label: 'Case Timeline', route: ROUTES.audit, icon: 'ScrollText' },
];

const ANALYST_TABS: TabConfig[] = [
  { id: 'audit', label: 'Audit Trail', route: ROUTES.audit, icon: 'ScrollText' },
  { id: 'alerts', label: 'Alerts', route: ROUTES.alerts, icon: 'Bell' },
  { id: 'evidence', label: 'Evidence', route: ROUTES.evidence, icon: 'Search' },
  { id: 'impact', label: 'Asset Impact', route: ROUTES.assetImpact, icon: 'FileText' },
  { id: 'gaps', label: 'Gaps & Blockers', route: ROUTES.gaps, icon: 'AlertTriangle' },
];

const ENGINEER_TABS: TabConfig[] = [
  { id: 'tasks', label: 'My Tasks', route: ROUTES.tasks, icon: 'ClipboardList' },
  { id: 'history', label: 'History', route: ROUTES.history, icon: 'History' },
];

const MORE_TABS: TabConfig[] = [
  { id: 'settings', label: 'Settings', route: ROUTES.settings, icon: 'Settings' },
];

// === Role Configurations (SPEC-004 §0) ===

const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  executive: {
    identity: {
      id: 'executive-1',
      name: 's.iyer',
      title: 'CISO',
      shortTitle: 'Executive',
      avatar: 'SI',
    },
    landingRoute: ROUTES.dashboard,
    density: 'comfortable',
    tabs: EXECUTIVE_TABS,
    capabilities: {
      canViewPortfolio: true,
      canViewRawEvidence: false,
      canViewEvidenceGraph: false,
      canApproveP0: true,
      canApproveRoutine: false,
      canAuthorizeContainment: false,
      canEscalate: false,
      canAuthorRecommendation: false,
      canResolveContradiction: false,
      canAssignTicket: false,
      canExecuteRunbook: false,
      canRecordVerification: false,
      canRequestReinvocation: false,
      canExportBrief: true,
      exportFormats: ['pdf'],
    },
    assistantFraming: 'posture-framed',
    auditDefault: {
      esqlExpanded: false,
      hashesShown: false,
    },
  },
  lead_manager: {
    identity: {
      id: 'lead-1',
      name: 'm.rao',
      title: 'Lead Manager',
      shortTitle: 'Lead',
      avatar: 'MR',
    },
    landingRoute: ROUTES.triage,
    density: 'compact',
    tabs: LEAD_TABS,
    capabilities: {
      canViewPortfolio: true,
      canViewRawEvidence: false,
      canViewEvidenceGraph: false,
      canApproveP0: false,
      canApproveRoutine: true,
      canAuthorizeContainment: true,
      canEscalate: true,
      canAuthorRecommendation: false,
      canResolveContradiction: false,
      canAssignTicket: true,
      canExecuteRunbook: false,
      canRecordVerification: false,
      canRequestReinvocation: false,
      canExportBrief: false,
      exportFormats: ['pdf', 'csv', 'json'],
    },
    assistantFraming: 'triage-framed',
    auditDefault: {
      esqlExpanded: false,
      hashesShown: false,
    },
  },
  risk_analyst: {
    identity: {
      id: 'risk-analyst-1',
      name: 'k.sharma',
      title: 'Risk Analyst',
      shortTitle: 'Analyst',
      avatar: 'KS',
    },
    landingRoute: ROUTES.audit,
    density: 'dense',
    tabs: ANALYST_TABS,
    capabilities: {
      canViewPortfolio: false,
      canViewRawEvidence: true,
      canViewEvidenceGraph: true,
      canApproveP0: false,
      canApproveRoutine: false,
      canAuthorizeContainment: false,
      canEscalate: false,
      canAuthorRecommendation: true,
      canResolveContradiction: true,
      canAssignTicket: false,
      canExecuteRunbook: false,
      canRecordVerification: false,
      canRequestReinvocation: true,
      canExportBrief: false,
      exportFormats: ['pdf', 'csv', 'json'],
    },
    assistantFraming: 'evidence-framed',
    auditDefault: {
      esqlExpanded: true,
      hashesShown: true,
    },
  },
  engineer: {
    identity: {
      id: 'engineer-1',
      name: 'a.patel',
      title: 'Engineer',
      shortTitle: 'Engineer',
      avatar: 'AP',
    },
    landingRoute: ROUTES.tasks,
    density: 'compact',
    tabs: ENGINEER_TABS,
    capabilities: {
      canViewPortfolio: false,
      canViewRawEvidence: false,
      canViewEvidenceGraph: false,
      canApproveP0: false,
      canApproveRoutine: false,
      canAuthorizeContainment: false,
      canEscalate: false,
      canAuthorRecommendation: false,
      canResolveContradiction: false,
      canAssignTicket: false,
      canExecuteRunbook: true,
      canRecordVerification: true,
      canRequestReinvocation: false,
      canExportBrief: false,
      exportFormats: [],
    },
    assistantFraming: 'engineer-framed',
    auditDefault: {
      esqlExpanded: false,
      hashesShown: false,
    },
  },
};

if (import.meta.env.DEV) {
  Object.entries(ROLE_CONFIGS).forEach(([role, cfg]) => {
    assertRegisteredRoute(`${role} landingRoute`, cfg.landingRoute);
    [...cfg.tabs, ...MORE_TABS].forEach((tab) => {
      assertRegisteredRoute(`${role} tab ${tab.id}`, tab.route);
    });
  });
}

// === Store Implementation ===

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
  getConfig: () => RoleConfig;
  getCapabilities: () => RoleConfig['capabilities'];
  getIdentity: () => RoleConfig['identity'];
  getTabs: () => TabConfig[];
  getMoreTabs: () => TabConfig[];
  isRouteVisible: (route: string) => boolean;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      role: 'executive' as Role,

      setRole: (role: Role) => set({ role }),

      getConfig: () => ROLE_CONFIGS[get().role],

      getCapabilities: () => ROLE_CONFIGS[get().role].capabilities,

      getIdentity: () => ROLE_CONFIGS[get().role].identity,

      getTabs: () => ROLE_CONFIGS[get().role].tabs,

      getMoreTabs: () => MORE_TABS,

      isRouteVisible: (route: string) => {
        const config = ROLE_CONFIGS[get().role];
        const allTabs = [...config.tabs, ...MORE_TABS];
        return allTabs.some((tab) => route.startsWith(tab.route));
      },
    }),
    {
      name: 'sentinel.role',
      partialize: (state) => ({ role: state.role }),
      // Migration: rewrite stale 'oncall' / 'analyst' values on hydration
      merge: (persisted, current) => {
        const stored = persisted as { role?: string } | null;
        const migratedRole = migrateStoredRole(stored?.role ?? null);
        
        // If the stored value was stale, rewrite it immediately
        if (stored?.role && stored.role !== migratedRole) {
          // localStorage rewrite happens automatically on next set()
          // but we also write immediately to prevent flicker on next page load
          try {
            localStorage.setItem('sentinel.role', JSON.stringify({ state: { role: migratedRole }, version: 0 }));
          } catch { /* localStorage may be unavailable */ }
        }
        
        return { ...current, role: migratedRole };
      },
    }
  )
);

export { ROLE_CONFIGS, MORE_TABS };
