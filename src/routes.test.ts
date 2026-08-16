import { describe, expect, it } from 'vitest';
import { assertRegisteredRoute, isRegisteredRoute, ROUTES, withCaseId } from './routes';
import { migrateStoredRole, MORE_TABS, ROLE_CONFIGS } from './store/useRoleStore';

describe('route manifest invariants', () => {
  it('contains every role landing route and tab route', () => {
    Object.entries(ROLE_CONFIGS).forEach(([role, config]) => {
      expect(isRegisteredRoute(config.landingRoute), `${role} landing route`).toBe(true);
      [...config.tabs, ...MORE_TABS].forEach((tab) => {
        expect(isRegisteredRoute(tab.route), `${role} tab ${tab.id}`).toBe(true);
      });
    });
  });

  it('throws for an unreachable route instead of validating against tabs', () => {
    expect(() => assertRegisteredRoute('fabricated landing route', '/not-in-router')).toThrow(
      'is not registered in the route manifest',
    );
  });

  it('contains the bare redirects and their case-scoped targets', () => {
    [ROUTES.audit, ROUTES.evidence, ROUTES.gaps, ROUTES.assetImpact].forEach((route) => {
      expect(isRegisteredRoute(route)).toBe(true);
    });
    expect(withCaseId(ROUTES.auditCase, 'CIAD-2026-0037')).toBe('/audit/CIAD-2026-0037');
    expect(withCaseId(ROUTES.evidenceCase, 'CIAD-2026-0037')).toBe('/evidence/CIAD-2026-0037');
    expect(withCaseId(ROUTES.gapsCase, 'CIAD-2026-0037')).toBe('/gaps/CIAD-2026-0037');
  });

  it('does not retain the legacy dead routes', () => {
    ['/queue', '/contradictions', '/case'].forEach((route) => {
      expect(isRegisteredRoute(route)).toBe(false);
    });
  });
});

describe('persisted role migration', () => {
  it('migrates legacy names and rejects unknown roles', () => {
    expect(migrateStoredRole('oncall')).toBe('lead_manager');
    expect(migrateStoredRole('analyst')).toBe('risk_analyst');
    expect(migrateStoredRole('engineer')).toBe('engineer');
    expect(migrateStoredRole('unknown')).toBe('executive');
  });
});
