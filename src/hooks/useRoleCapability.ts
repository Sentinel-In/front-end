/* ============================================================
   useRoleCapability — SPEC §3
   Reads capabilities from useRoleStore for the current role.
   ============================================================ */

import { useRoleStore } from '../store/useRoleStore';

export function useRoleCapability(capability: keyof ReturnType<typeof useRoleStore.getState>['getCapabilities'] extends () => infer R ? R : never) {
  const capabilities = useRoleStore((s) => s.getCapabilities());
  return capabilities[capability as keyof typeof capabilities];
}

export function useRoleCapabilities() {
  return useRoleStore((s) => s.getCapabilities());
}

export function useCurrentRole() {
  return useRoleStore((s) => s.role);
}

export function useRoleIdentity() {
  return useRoleStore((s) => s.getIdentity());
}

export function useRoleConfig() {
  return useRoleStore((s) => s.getConfig());
}
