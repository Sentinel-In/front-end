/* ============================================================
   useRoleCapability — SPEC §3
   Reads capabilities from useRoleStore for the current role.
   ============================================================ */

import { useRoleStore } from '../store/useRoleStore';
import type { RoleCapability } from '../types';

export function useRoleCapability(capability: RoleCapability) {
  const capabilities = useRoleStore((s) => s.getCapabilities());
  return capabilities[capability];
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
