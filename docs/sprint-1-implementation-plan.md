# Sprint 1 Implementation Plan — State, Routing & Defect Closure

Authority: `docs/handoff.md` §0 and §6. This sprint closes verified defects and does not add product features.

## Outcomes

- One exported route manifest is the source of truth for router registration, role landing routes, and tabs.
- Every role tab resolves to a registered route; invalid configuration fails in development and in unit tests.
- Case selection is URL-owned for case-scoped pages, with deterministic first-case redirects for bare case routes.
- Role filtering is performed by selectors, and denied controls remain visible with an authoritative-role explanation.

## File-level work

### Routing and D-1 through D-4

- **Add `src/routes.ts`**
  - Export the serialisable `ROUTES` manifest for every canonical path in handoff §1.4.
  - Export route-pattern helpers used by the router and by reachability validation.
  - Export a pure assertion that rejects a landing route or tab route not represented by the manifest.
- **Update `src/App.tsx`**
  - Register routes using `ROUTES`, including `/audit`, `/audit/:caseId`, `/approvals`, `/approvals/:approvalId`, and `/brief`, `/brief/new`, `/brief/:briefId`.
  - Add bare-case redirects for `/audit`, `/evidence`, `/gaps`, and `/reports/asset-impact` through one reusable redirect component.
  - Remove the legacy `/queue`, `/contradictions`, and `/case` registrations. Contradictions remain part of Evidence; analyst attention remains Alerts; Lead Case Timeline targets Audit.
- **Update `src/store/useRoleStore.ts`**
  - Build every landing route and tab route from `ROUTES`.
  - Point Lead “Case Timeline” at `/audit` and retain the canonical Analyst tabs.
  - Validate every role landing route and every role/more tab against the route manifest in DEV.
  - Retain and test migration of persisted `oncall` → `lead_manager` and `analyst` → `risk_analyst`.
- **Update `src/pages/index.tsx` and add only minimal route shells where needed**
  - Export reachable approval and board-brief route shells without implementing later-sprint workflows.
  - Remove legacy route-only exports when no canonical route consumes them.
- **Add `src/routes.test.ts` and role-route tests**
  - Assert every configured tab and landing route is reachable.
  - Assert a fabricated unreachable route throws, proving the invariant fails for the defect class represented by D-2.
  - Assert all required bare and parameterised route patterns exist and legacy D-4 routes do not.

### URL-owned case state

- **Update `src/hooks/useCaseParam.ts`**
  - Preserve URL `:caseId` as authoritative, with first indexed case only as the bare-route fallback.
  - Keep all case-route loading in this hook.
- **Update `src/features/analyst/RecommendationComposer.tsx` and audit all case-scoped pages**
  - Replace direct `useParams` + store `load` logic with `useCaseParam`.
  - Verify Audit, Evidence, Gaps, Recommendation, and Asset Impact use the shared hook.
- **Update `src/store/useBlackboardStore.ts` and `src/mock/blackboardApi.ts`**
  - Make `load(caseId: string)` required at the type boundary.
  - Ensure refresh re-fetches the current case ID rather than falling back to the reference fixture.
  - Remove optional/default case loading paths.

### Selector-based RBAC and visible denial

- **Add `src/selectors/rbac.ts` with tests**
  - Centralise portfolio, Lead active queue, Analyst assigned escalation, and Engineer own-ticket filtering from handoff §3.4.
  - Keep functions pure and accept role/identity inputs explicitly.
- **Update queue/task consumers**
  - Replace component-local role/entity filtering in `TriagePage`, `QueuePage`/canonical replacement, `EngineerTasksPage`, and command/search consumers where present with RBAC selectors.
- **Update `src/components/shared/LockedControl.tsx` and `src/components/primitives/StatePrimitives.tsx`**
  - Type capabilities instead of using `any`.
  - Keep denied controls rendered and locked.
  - Open an explanation naming the authoritative role and offer the existing role-switch shortcut.
  - Ensure `RoleGate` uses the same capability/authority model and does not silently hide denied content.
- **Update existing call sites**
  - Use `LockedControl` for denied action controls and `RoleGate` for disclosure depth, without adding component-local role filters.

## Verification after each change set

Run exactly:

```text
node node_modules/typescript/bin/tsc -b --force
npm test
npm run build
```

Also verify:

```text
rg -n "\\bload\\s*\\(\\s*\\)" src
rg -n "(/queue|/contradictions|/case)" src
```

The first command must find no bare `load()` call. Any legacy-route matches must be non-routing historical text only; no tab or router registration may remain.

## Exit criteria

- D-1: Analyst `/audit` landing and case route resolve.
- D-2: router and role store consume the same manifest; the negative invariant test throws.
- D-3: bare `/evidence` and `/gaps` redirect to the first case.
- D-4: `/queue`, `/contradictions`, and `/case` are no longer routed dead surfaces.
- Every tab for Executive, Lead Manager, Risk Analyst, and Engineer resolves to a registered route.
- Persisted legacy roles hydrate to the canonical role names.
- Case-scoped pages load their URL case; refresh preserves that case.
- RBAC filtering is selector-owned; denied controls remain visible and explain the authoritative role.
- TypeScript, tests, and production build all pass.
