# Implementation Plan v3 — Surgical

Supersedes `implementation-plan-v2.md`. v2 was audited under WHIP and **caught**: four of four user complaints trace to architectural decisions in that plan, not to execution sloppiness.

v3 is root-cause indexed. Every change cites the line it fixes. No adjacent refactors.

All paths relative to `sentinel-in/`. Verified against the uploaded zip, `tsc -b --force` exit 0.

---

## Root cause register

| ID | Root cause | Evidence | Fixes feedback |
|---|---|---|---|
| **RC-1** | Case selection is store-global, not URL-scoped | `useBlackboardStore.ts:51` defaults to `'CIAD-2026-0037'`; one call site passes an ID; `/reports/asset-impact` has no `:caseId` | 2a |
| **RC-2** | `landingRoute` and `tabs` are unlinked sources of truth | `useRoleStore.ts:51` vs `:139` — `/tasks` is Engineer's landing but absent from `ENGINEER_TABS` | 4 |
| **RC-3** | Dashboard body deleted along with both charts | `DashboardPage.tsx` = 11 LOC; `grep recharts src/` = 0 matches; dep installed | 1 |
| **RC-4** | Provenance graph stubbed, shipped as done | `EvidenceExplorerPage.tsx:142` renders a TODO string | 2c |
| **RC-5** | `/audit` deleted from routes in SPEC-003 §7 | No audit page exists anywhere in `src/` | 3a |
| **RC-6** | Analyst has no attention feed | No alerts surface; gaps/blockers/contradictions only reachable by tab | 3c |

Removals requested: Dormant tab (2b), Case Timeline from Analyst (3b).

---

## Phase 1 — RC-1: URL-scoped case selection

**Surface budget: ~45 lines across 6 files. Grade B — justified, it is the load-bearing bug.**

### [MODIFY] `src/store/useBlackboardStore.ts`
```ts
// BEFORE  (line 50-51)
load: async (caseId?: string) => {
  const targetCaseId = caseId || 'CIAD-2026-0037';

// AFTER — caseId becomes REQUIRED. The default was the bug.
load: async (caseId: string) => {
  if (!caseId) throw new Error('load() requires a caseId — see plan v3 RC-1');
```
Removing the default surfaces every call site as a type error. That is intentional — `tsc` becomes the checklist.

### [MODIFY] `src/App.tsx`
```
/reports/asset-impact          → /reports/asset-impact/:caseId
/evidence                      → /evidence/:caseId
/gaps                          → /gaps/:caseId
/audit/:caseId                 (new, Phase 5)
/alerts                        (new, Phase 6 — index, not case-scoped)
```
Add a bare `/reports/asset-impact` redirect to the first case in the index so tab clicks still work.

### [NEW] `src/hooks/useCaseParam.ts`
```ts
export function useCaseParam(): string {
  const { caseId } = useParams<{ caseId: string }>();
  const fallback = useCaseIndexStore(s => s.cases[0]?.case_id);
  const resolved = caseId ?? fallback;
  const load = useBlackboardStore(s => s.load);
  useEffect(() => { if (resolved) load(resolved); }, [resolved, load]);
  return resolved;
}
```
Every case-scoped page calls this instead of `load()` bare. **One hook, one contract.**

### [MODIFY] `src/features/lead/TriagePage.tsx`
Rows currently have no click handler — only `ActionButtons` at `:56`. Add row navigation:
```tsx
onClick={() => navigate(`/reports/asset-impact/${c.case_id}`)}
```
`ActionButtons` must `e.stopPropagation()` so Approve/Escalate do not also navigate.

### [MODIFY] `src/pages/AssetImpactReportPage.tsx` · `EvidenceExplorerPage.tsx` · `pages/index.tsx` (`GapsPage`)
Replace bare `load()` with `useCaseParam()`.

### [MODIFY] `src/components/layout/CaseIndexList.tsx`
`:39` calls `load(c.case_id)` imperatively. Replace with `navigate()` — the URL becomes the single source of truth for which case is open.

**Accept:** clicking any triage row opens that case's Asset Impact Report. Deep-linking `/reports/asset-impact/CIAD-2026-0041` works on refresh. `tsc -b` exits 0 with zero bare `load()` calls remaining.

---

## Phase 2 — RC-2: tab/route invariant

**Surface budget: ~20 lines, 1 file. Grade B.**

### [MODIFY] `src/store/useRoleStore.ts`

```ts
const ENGINEER_TABS: TabConfig[] = [
  { id: 'tasks',   label: 'My Tasks', route: '/tasks',   icon: 'ClipboardList' },
  { id: 'history', label: 'History',  route: '/history', icon: 'History' },
];
```
Engineer loses Dashboard and Asset Impact entirely. Per SPEC-003 §2.4 the Engineer's surface is deliberately the smallest in the product — they see their assigned work, nothing else.

```ts
const LEAD_TABS: TabConfig[] = [
  { id: 'triage',   label: 'Triage Hub',    route: '/triage',   icon: 'Inbox' },
  { id: 'tickets',  label: 'Tickets',       route: '/tickets',  icon: 'CheckSquare' },
  { id: 'impact',   label: 'Asset Impact',  route: '/reports/asset-impact', icon: 'FileText' },
  { id: 'evidence', label: 'Evidence',      route: '/evidence', icon: 'Search' },
  { id: 'case',     label: 'Case Timeline', route: '/case',     icon: 'Clock' },
];  // Dormant removed — feedback 2b
```

```ts
const ANALYST_TABS: TabConfig[] = [
  { id: 'audit',    label: 'Audit Trail',     route: '/audit',    icon: 'ScrollText' },  // landing
  { id: 'alerts',   label: 'Alerts',          route: '/alerts',   icon: 'Bell' },
  { id: 'evidence', label: 'Evidence',        route: '/evidence', icon: 'Search' },
  { id: 'impact',   label: 'Asset Impact',    route: '/reports/asset-impact', icon: 'FileText' },
  { id: 'gaps',     label: 'Gaps & Blockers', route: '/gaps',     icon: 'AlertTriangle' },
];  // Case Timeline removed — feedback 3b
```
Analyst `landingRoute` changes `/queue` → `/audit`.

### Add the invariant that prevents this class of bug recurring
```ts
if (import.meta.env.DEV) {
  Object.entries(ROLE_CONFIGS).forEach(([role, cfg]) => {
    const routes = [...cfg.tabs, ...MORE_TABS].map(t => t.route);
    const ok = routes.some(r => cfg.landingRoute === r || cfg.landingRoute.startsWith(r + '/'));
    if (!ok) throw new Error(`${role}: landingRoute ${cfg.landingRoute} is not reachable from any tab`);
  });
}
```
This is the actual fix. Adding the missing tab is the symptom; the assertion is the cause.

### [DELETE] `src/features/lead/DormantPage.tsx`, `/dormant` route

**Accept:** every role's landing route is a tab they can see; the DEV assertion throws if that is ever violated again.

---

## Phase 3 — RC-3: restore dashboard visuals, add Board Brief figures

**Surface budget: ~230 lines across 3 new files + 2 modified. Grade: reconsider — but this is net-new UI, not a refactor. Justified.**

`recharts@3.10.1` is installed and imported nowhere. All charts below use it.

### [NEW] `src/components/charts/CoverageByDimension.tsx`
Horizontal `BarChart`, 10 bars from `blackboard.coverage`, **sorted ascending** so the weakest dimension sits at the top. `<Cell>` per bar: ≥90 `--color-safe`, 60–89 `--color-medium`, <60 `--color-critical`. `applicability` at 40 lands first and red. Per SPEC-002 §5.

### [NEW] `src/components/charts/EvidenceByPublisher.tsx`
Horizontal `BarChart` over `blackboard.sources` grouped by `publisher`, descending. `<Cell>` coloured by `authority_class`, external legend. Microsoft 14 · Huntress 3 · CERT-In 2 · five singletons.

### [NEW] `src/components/charts/PortfolioCharts.tsx`
Two portfolio-level charts from `useCaseIndexStore`:
- **Priority distribution** — stacked `BarChart`, P0–P3 by `derived_phase`
- **Coverage posture** — `ScatterChart`, x = composite coverage, y = applicability coverage, one dot per case, dot size = affected asset count. Low-applicability quadrant = the portfolio's blind spots. Dot click navigates to that case.

### [MODIFY] `src/pages/DashboardPage.tsx` — 11 LOC → ~90 LOC
```
Row 1  Case header band          case id, phase, status, Evidence Coverage + weakest dimension
Row 2  Evidence state strip      open gaps 9/13 · blockers 2/5 · contradictions 1/4 · claims 40/42 · sources 24
Row 3  <CoverageByDimension/>  |  <EvidenceByPublisher/>
Row 4  <PortfolioCharts/>
Row 5  <BoardBriefPanel/>
Row 6  <CaseIndexList/>
```
Rows 1–3 are the SPEC-002 §6.1 dashboard that was deleted. Rows 5–6 are what currently exists.

### [MODIFY] `src/components/layout/BoardBriefPanel.tsx` — 37 LOC → ~140 LOC
Each of the five sections gains a figure block above its prose, per SPEC-004 §6.2:

| Section | Figure |
|---|---|
| Posture | Cases opened / closed / closed-pending-evidence, this period vs prior. Small `BarChart` |
| Duty of care | Four stat tiles — cases handled, % completing full evidence cycle, human decisions recorded, ledger head version |
| **Unknowns** | Table: case · what could not be established · named blocker in plain language · what would close it. **The reason this artifact exists** — give it the most space |
| Decisions | Count of executive authorisations + a compact list: what, who, when |
| The ask | Each ask with the case IDs it would resolve |

Header keeps `FROZEN` chip, attestation, ledger version.

**Forbidden-content guard** — a DEV-mode check failing on CVE patterns, threat-actor names, coverage dimension names, hashes, or claim IDs appearing in rendered brief prose. Per SPEC-004 §6.3.

**Accept:** `grep -rn "recharts" src/` returns ≥4 matches. Dashboard shows Coverage by Dimension with applicability red at the top. Board Brief has a figure in every section.

---

## Phase 4 — RC-4: provenance graph

**Surface budget: ~180 lines, 1 new file + 1 modified. Grade: reconsider — net-new, replaces a TODO string.**

### [NEW] `src/features/analyst/ProvenanceGraph.tsx`

**No new dependency.** `reference_edges[].depth` is 0–3, which gives natural columns — 24 nodes across 4 depth bands is layoutable in plain SVG. React Flow and d3 are both unjustified here.

- **Nodes** = `blackboard.sources` (24). Node body: publisher, `authority_class` badge, `freshness` dot, `http_status`.
- **Node colour** by `authority_class` — government / first-party vendor / researcher / secondary reporting.
- **Edges** = `blackboard.reference_edges` (17), routed by `depth`, styled by `original_edge_status`: `acquired` solid · `leased` dashed · `verified_same_sha256` doubled.
- **Artifact badge** per node — each source carries `artifact_id`; render the truncated `sha256` as a mono chip. These are the proof-of-collection artifacts the harness preserved.
- **Node click** → existing `<ProvenanceDrawer/>` (already mounted at `AppShell.tsx:66`). Shows `source_url`, `locator`, `extraction_method`, `retrieved_at`, `raw_excerpt`, full hash.
- **Hover** highlights the node's edges and dims the rest.
- Legend for authority class and edge status.

### [MODIFY] `src/pages/EvidenceExplorerPage.tsx`
Delete line 142's TODO string. Mount `<ProvenanceGraph/>` in the graph tab. Move `<ReinvocationPanel/>` below the tabs so it stops being the first thing on the page.

**Accept:** `grep -n "pending phase" src/` returns nothing. All 24 sources render as nodes; clicking one opens the provenance drawer with its raw excerpt.

---

## Phase 5 — RC-5: Audit Trail (Analyst landing view)

**Surface budget: ~200 lines, 1 new file. Grade: reconsider — net-new, restores a view SPEC-003 wrongly deleted.**

### [NEW] `src/features/analyst/AuditTrailPage.tsx` → `/audit`, `/audit/:caseId`

Dense, 36px rows, monospace-dominant, **strictly read-only**. Per SPEC-002 §6.4.

**Filter bar** — actor, correlation ID, event type, date range, free-text mono query.

**Ledger** — built from `blackboard.decisions` (9 entries) joined with `useWorkflowStore` committed intents, ordered by `at`.
Columns: `SEQ · TIMESTAMP (IST) · EVENT TYPE · ACTOR (agent|human) · CORRELATION · SUMMARY · HASH · VERIFIED`

**Row expansion** reveals: the executed ES|QL if present, the declarative agent record (**never raw chain-of-thought**), human approval status and approver, `previous_event_hash` and `event_hash` in full, evidence record IDs as clickable chips.

**Right rail — Chain Integrity.** `audit.head_version` and `last_event_seq` from the blackboard (v6, seq 6 — **not** the fabricated `#8,441` still in `StatusBar.tsx`). Vertical sequence of the last 6 blocks each linking to its predecessor. `[Re-verify chain]` walking blocks at ~60ms each. Plus the **tamper-detected inset variant** — one block red, chain broken, "Discrepancy at block #N". Designing the failure state is what proves the mechanism is real.

### [MODIFY] `src/components/layout/StatusBar.tsx`
`audit chain #8,441 verified` → `ledger head v{audit.head_version} · seq {audit.last_event_seq}`. The current figure is fabricated and visible in every screenshot.

**Accept:** Analyst lands on `/audit`. Chain integrity reads v6 · seq 6. The tamper variant renders.

---

## Phase 6 — RC-6: Analyst Alerts

**Surface budget: ~120 lines, 1 new file. Grade: reconsider — net-new.**

### [NEW] `src/features/analyst/AlertsPage.tsx` → `/alerts`

There is no `alerts` key in the blackboard, so this is **derived and labelled as derived**. An analyst alert is anything demanding their attention, ranked by materiality:

| Signal | Derivation | Severity |
|---|---|---|
| Open contradiction, `materiality: high` | `contradictions[].status === 'open' && materiality === 'high'` | Critical |
| Open blocker | `blockers[].status === 'open'` | High |
| Coverage dimension < 60 | any `coverage[k] < 60` | High |
| Stale source | `sources[].freshness !== 'current'` | Medium |
| Low-confidence accepted claim | `claims[].confidence < 0.7 && status === 'accepted'` | Medium |
| Blocked frontier node | `frontier[].status === 'blocked'` | Low |
| Case closed with open high-materiality contradiction | governance exception, per SPEC-004 decision 8 | Critical |

Each row: severity shape+pill, signal type, one-line description, source case, and a **derivation tooltip naming the rule** — same discipline as `PriorityBadge`. Row click routes to the relevant surface (contradiction → `/evidence/:caseId` contradictions tab; blocker → `/gaps/:caseId`; stale source → provenance graph node).

Filter pills with counts by severity. For `CIAD-2026-0037` this yields 1 critical, 3 high, 3 medium — a populated feed on load.

**Accept:** every alert row explains the rule that produced it; no alert is hardcoded.

---

## Phase 7 — Orphan sweep

**Surface budget: 3 deletions. Grade A+.**

Zero-reference files confirmed by `grep -rl ... | grep -v self`:
- `src/components/layout/StickyContextHeader.tsx`
- `src/components/overlays/AssistantDrawer.tsx`
- `src/components/overlays/ActionApprovalModal.tsx`

Pre-pivot SOC leftovers. Delete. Do **not** touch `SeverityBadge` or `LifecyclePill` — each has one live reference.

---

## Phase 8 — Make the test suite real

**Surface budget: ~10 lines. Grade A.**

`src/selectors/priority.test.ts:1-2` imports `vitest` behind `// @ts-ignore`. vitest is not a dependency and there is no `test` script. The file has never executed; `tsc` passes because the error is suppressed.

```
npm i -D vitest
package.json → "test": "vitest run"
priority.test.ts → delete the @ts-ignore
```
Then run it. If `derivePriority(CIAD-2026-0037)` does not return `{ priority: 'P1', rule: 3 }`, that is a real bug the green build was hiding.

**Accept:** `npm test` runs and passes. RED/GREEN is now possible for every future fix.

---

## Verification

Run after **every** phase, not at the end:
```
node node_modules/typescript/bin/tsc -b --force     # currently exit 0 — keep it there
npm test                                            # available from Phase 8
npm run build
```

### Regression guards for the five anti-patterns
- [ ] `grep -rn "load()" src/` → no bare calls; every case page uses `useCaseParam()`
- [ ] DEV assertion throws if any `landingRoute` is unreachable from that role's tabs
- [ ] `grep -rn "recharts" src/` → ≥ 4 matches
- [ ] `grep -rni "pending phase\|TODO\|mocked visualization" src/` → no matches rendered to users
- [ ] `grep -rn "8,441" src/` → no matches
- [ ] `npm test` exists and passes

### Manual
- [ ] Triage row click → that case's Asset Impact Report; refresh preserves it
- [ ] Engineer tab bar reads **My Tasks | History** — nothing else
- [ ] Lead has no Dormant tab; Analyst has no Case Timeline tab
- [ ] Analyst lands on Audit Trail; Alerts tab is populated
- [ ] Provenance graph renders 24 nodes / 17 edges; node click opens the drawer
- [ ] Board Brief has a figure in every one of the five sections
- [ ] Both themes swept on every new surface

---

## Deferred — not in v3

Named so they are not silently dropped: analyst write-back decision events beyond contradiction resolution, re-invocation running state, notification trigger wiring, Board Brief composer and freeze-and-attest flow (the panel renders a seeded frozen brief; the composer is not built).

---

## Sequencing

Phases 1 → 2 → 8 first. They are small, they are pure root-cause fixes, and Phase 8 makes every later phase verifiable. Then 3 → 5 → 4 → 6 by demo value. Phase 7 last — it is cosmetic.
