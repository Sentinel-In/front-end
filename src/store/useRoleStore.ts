/* ============================================================
   Role Store — SPEC §3, §7
   Manages current role, derived capabilities, identity, and config.
   Persisted to localStorage under 'sentinel.role'.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, RoleConfig, TabConfig } from '../types';

// === Tab Definitions ===

const SHARED_TABS: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'impact', label: 'Asset Impact', route: '/reports/asset-impact', icon: 'FileText' },
];

const EXTENDED_TABS: TabConfig[] = [
  ...SHARED_TABS,
  { id: 'evidence', label: 'Evidence', route: '/evidence', icon: 'Search' },
  { id: 'case', label: 'Case Timeline', route: '/case', icon: 'Clock' },
  { id: 'gaps', label: 'Gaps & Blockers', route: '/gaps', icon: 'AlertTriangle' },
];

const MORE_TABS: TabConfig[] = [
  { id: 'settings', label: 'Settings', route: '/settings', icon: 'Settings' },
];

// === Role Configurations (SPEC §3) ===

const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  executive: {
    identity: {
      name: 's.iyer',
      title: 'CISO',
      shortTitle: 'Executive',
      avatar: 'SI',
    },
    landingRoute: '/dashboard',
    density: 'comfortable',
    tabs: [
      ...SHARED_TABS,
      { id: 'case', label: 'Case', route: '/case', icon: 'Clock' },
    ],
    capabilities: {
      canApprove: false,
      canSeeRawEvidence: false,
      canRunEsql: false,
      canExport: true,
      exportFormats: ['pdf'],
    },
    assistantFraming: 'posture-framed',
    auditDefault: {
      esqlExpanded: false,
      hashesShown: false,
    },
  },
  oncall: {
    identity: {
      name: 'm.rao',
      title: 'On-Call Lead',
      shortTitle: 'On-Call Lead',
      avatar: 'MR',
    },
    landingRoute: '/reports/asset-impact',
    density: 'compact',
    tabs: EXTENDED_TABS,
    capabilities: {
      canApprove: true,
      canSeeRawEvidence: true,
      canRunEsql: true,
      canExport: true,
      exportFormats: ['pdf', 'csv', 'json'],
    },
    assistantFraming: 'triage-framed',
    auditDefault: {
      esqlExpanded: false,
      hashesShown: false,
    },
  },
  analyst: {
    identity: {
      name: 'k.sharma',
      title: 'Sec. Analyst',
      shortTitle: 'Analyst',
      avatar: 'KS',
    },
    landingRoute: '/evidence',
    density: 'dense',
    tabs: EXTENDED_TABS,
    capabilities: {
      canApprove: false,
      canSeeRawEvidence: true,
      canRunEsql: true,
      canExport: true,
      exportFormats: ['pdf', 'csv', 'json'],
    },
    assistantFraming: 'evidence-framed',
    auditDefault: {
      esqlExpanded: true,
      hashesShown: true,
    },
  },
};

// === Store ===

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
    }
  )
);

export { ROLE_CONFIGS, MORE_TABS };
