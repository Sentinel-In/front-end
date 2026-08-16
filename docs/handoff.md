# Sentinel-In — Developer Handoff Specification

**Version:** 1.0 · **Status:** Source of truth · **Stack:** React 19 · Vite · TypeScript · Zustand · React Router 7 · Recharts 3 · Lucide-React · Framer Motion

This document supersedes all prior specs (SPEC-002/003/004, implementation plans v1–v3). Where this document and the existing codebase disagree, **this document is correct and the codebase is a defect**.

---

## 0. Known defects in the current codebase

Fix these before feature work. Each is verified against the uploaded source.

| # | Defect | Evidence | Fix |
|---|---|---|---|
| **D-1** | `ANALYST_TABS` links to `/audit`, and `landingRoute: '/audit'` — but **no `/audit` route is registered in `App.tsx`**. `AuditTrailPage.tsx` exists and is unreachable. The Analyst lands on `NotFoundPage`. | `useRoleStore.ts:46,116` vs `App.tsx:48-71` | Register `/audit` and `/audit/:caseId` |
| **D-2** | The DEV invariant at `useRoleStore.ts:157-161` validates `landingRoute` against the **tab list**, not against the **router**. It passes while D-1 is live. | `useRoleStore.ts:160` | Validate against an exported route manifest, not `TabConfig[]` |
| **D-3** | `/evidence` and `/gaps` exist only as `:caseId` variants, but `LEAD_TABS` and `ANALYST_TABS` link to the bare paths. | `App.tsx:51,53` vs `useRoleStore.ts:40,49` | Add bare-path redirects mirroring `AssetImpactRedirect` |
| **D-4** | `/queue`, `/contradictions`, `/case` are routed but appear in no tab set. Dead surfaces. | `App.tsx:52,65,67` | Either surface or delete |

**D-1 and D-2 together are the important lesson:** an invariant that checks the wrong thing is worse than no invariant, because it manufactures confidence. Route manifests must be the single source of truth.

---

## 1. Product Vision & Architecture

### 1.1 The core loop

Sentinel-In converts a public security advisory into a defensible internal decision, preserving every piece of evidence used along the way.

```
CERT-In advisory ──┐
                   ├─▶ Elastic evidence plane ─▶ Applicability gate
Enterprise CMDB ───┘    (asset projection,           │
                         inventory, telemetry)  ┌────┴────┐
                                       no candidate    candidate
                                            │              │
                                     Dormant watch   LangGraph harness
                                     (re-check on     acquire · resolve
                                      asset/SBOM/       · compose
                                      advisory change)      │
                                                            ▼
                                          PostgreSQL append-only event ledger
                                             + immutable object-store artifacts
                                                            │
                                                     (reducers project)
                                                            ▼
                                              Materialized Blackboard
                                                            │
                     ┌──────────────┬──────────────┬────────┴───────┐
                     ▼              ▼              ▼                ▼
                Executive         Lead          Analyst          Engineer
                authorise        route        investigate        execute
                     │              │              │                │
                     └──────────────┴──────────────┴────────────────┘
                                        │
                                 CaseEventIntent
                                        │
                                        ▼
                              back into the ledger
```

### 1.2 The founding constraint

Every architectural decision below descends from one value in `blackboard.json`:

```json
"coverage": { "applicability": 40, "identity": 100, "exploitability": 98, ... }
```

The harness investigated CIAD-2026-0037 across 24 sources in 4 waves. It established the threat completely. It **could not establish whether the organisation is affected**, because no tenant telemetry was supplied. It closed at composite coverage 92 and said so explicitly.

The backend does not emit answers. It emits **calibrated uncertainty**. The frontend's job is to render that uncertainty legibly to four people whose decisions absorb different amounts of it.

Consequence: there is no risk score, no CVSS, no CVE, and no severity field anywhere in this data model. Any UI asserting one is fabricating.

### 1.3 Separation from the agentic backend

**The frontend is a read-only consumer of the Materialized Blackboard.** It never invokes an agent node, never mutates the blackboard, and never writes a claim.

Per ADR-001, agents propose and deterministic reducers commit. If the UI could write to the blackboard, the ledger would stop being authoritative and the traceability guarantee would collapse.

Human actions therefore emit a **`CaseEventIntent`**, rendered in full to the user before commit, POSTed to `/workflow/events`, reduced server-side, and reflected in the next blackboard version.

```
UI ──emit──▶ CaseEventIntent ──POST──▶ ledger ──reduce──▶ blackboard vN+1 ──▶ UI re-reads
```

The intent-preview modal is not a debug affordance. It is the product demonstrating that human decisions enter the same audited ledger as machine ones.

**Elastic sits upstream of the applicability gate, not inside the case.** It answers *"is there a credible asset/component/telemetry candidate?"*. ES|QL therefore appears in exactly two UI surfaces — the gate decision record and asset-projection provenance — and nowhere in case evidence.

### 1.4 Routing strategy

**The URL owns case selection.** There is no global "current case" — that pattern was the root cause of a class of navigation defects. Every case-scoped view takes `:caseId`.

```
/                              → redirect to role landing route
/dashboard                     Executive portfolio
/approvals                     Executive P0 queue
/approvals/:approvalId
/brief                         Board brief list
/brief/new                     Composer (Executive only)
/brief/:briefId                Frozen brief
/triage                        Lead triage hub
/tickets                       Lead ticket oversight
/tickets/:ticketId
/tasks                         Engineer task queue
/tasks/:ticketId               Runbook
/history                       Engineer history
/audit                         Analyst landing — redirect to first case
/audit/:caseId                 Ledger
/alerts                        Analyst attention feed
/evidence                      redirect to first case
/evidence/:caseId              Evidence explorer
/gaps                          redirect to first case
/gaps/:caseId                  Gaps & blockers
/recommend/:caseId             Recommendation composer
/reports/asset-impact          redirect to first case
/reports/asset-impact/:caseId  Asset Impact Report (depth by role)
/settings
*                              NotFound
```

**Route manifest requirement.** Export a single `ROUTES` const consumed by both `App.tsx` and `useRoleStore.ts`. The DEV invariant validates every `landingRoute` and every `TabConfig.route` against that manifest. This closes D-1 and D-2 permanently.

**Case resolution hook** — every case-scoped page uses this, never a bare `load()`:

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

`useBlackboardStore.load(caseId: string)` — `caseId` is **required**. An optional parameter with a hardcoded default is what caused every view to render the same case regardless of navigation.

### 1.5 Folder structure

```
src/
  main.tsx
  App.tsx                       router; consumes ROUTES manifest
  routes.ts                     ROUTES manifest — single source of truth
  styles/
    tokens.css                  §5.1 — the ONLY place hex values appear
    globals.css
  types/
    index.ts                    §2.1 — mirrors blackboard.json exactly
  data/
    blackboard.json             verbatim backend output
    verificationMap.ts          FRONTEND ASSUMPTION — labelled
  mock/
    blackboardApi.ts            getBlackboard(caseId), listCases()
    caseFactory.ts              structuredClone + overlay; SEEDED DEMO DATA
    workflowFixtures.ts         tickets, approvals, recommendations, brief
    latency.ts                  200–500ms artificial latency
  selectors/                    ALL filtering and derivation lives here
    coverage.ts  assets.ts  evidence.ts  publishers.ts
    priority.ts  phase.ts  alerts.ts  rbac.ts
  store/
    useRoleStore.ts             role, capabilities, tabs, density
    useThemeStore.ts            dark | light | system
    useBlackboardStore.ts       read-only materialized view + version awareness
    useCaseIndexStore.ts        CaseSummary[]
    useWorkflowStore.ts         the ONLY mutable surface — emits intents
    useNotificationStore.ts     delivery only
    useAppStore.ts              modals, drawers, toasts, command palette
  hooks/
    useCaseParam.ts  useRoleCapability.ts  useCountdown.ts
    useCopyToClipboard.ts  useKeyboardShortcuts.ts  useNotImplemented.ts
  components/
    primitives/                 SeverityBadge, LifecyclePill, DataTable,
                                ProvenanceChip, StatePrimitives, UiPrimitives
    charts/                     CoverageByDimension, EvidenceByPublisher,
                                PortfolioCharts, ConfidenceDistribution
    layout/                     AppShell, TopBar, TabBar, RoleSwitcher,
                                StatusBar, VersionBanner, BoardBriefPanel
    overlays/                   ModalRoot, ProvenanceDrawer, CommandPalette,
                                CaseEventIntentModal, TicketApprovalModal,
                                ContainmentAuthModal, FinalSignoffModal,
                                NotificationDropdown, ToastRoot
    shared/                     LockedControl, PriorityBadge, RoleGate,
                                AssetImpactReport (depth-prop)
  features/
    executive/  lead/  analyst/  engineer/
```

**Rules.** `features/*` never imports from another `features/*` — shared code moves to `components/shared/`. Shared components take a `depth` prop; they never read `useRoleStore`. Filtering lives in `selectors/`, never in a component.

---

## 2. Data Layer & Zustand State

### 2.1 TypeScript interfaces

Derived from `blackboard.json` (`schema_version: "case-blackboard-v1"`). Counts from the reference case: 24 sources · 22 artifacts · 17 reference_edges · 42 claims · 4 contradictions · 2 assets · 9 remediation · 12 verification · 8 frontier · 13 gaps · 5 blockers · 9 decisions · 0 active_missions.

```ts
export type ApplicabilityState =
  | 'affected' | 'not_affected' | 'fixed' | 'under_investigation' | 'unknown';

export type ItemStatus = 'open' | 'resolved' | 'mitigated' | 'superseded' | 'accepted';

export type DerivedPhase =
  | 'dormant' | 'discovery' | 'expansion' | 'reconciliation' | 'applicability'
  | 'actionability' | 'verification' | 'complete' | 'blocked' | 'reopened';

export interface Blackboard {
  schema_version: string;
  case: Case;
  advisory: Advisory;
  coverage: CoverageVector;
  sources: Source[];
  artifacts: Artifact[];
  reference_edges: ReferenceEdge[];
  claims: Claim[];
  contradictions: Contradiction[];
  assets: AssetMatch[];
  remediation: RemediationEntry[];
  verification: Verification[];
  frontier: FrontierNode[];
  gaps: Gap[];
  blockers: Blocker[];
  decisions: Decision[];
  active_missions: TeamMission[];
  budgets: Budgets;
  audit: AuditPointer;
}

export interface Case {
  case_id: string;                    // 'CIAD-2026-0037'
  status: 'open' | 'closed' | 'blocked' | 'dormant' | 'reopened';
  derived_phase: DerivedPhase;
  created_at: string;
  updated_at: string;
  input_url: string;
  asset_context_supplied: boolean;    // see §2.4 — NOT the same as environment evidence
}

export interface Advisory {
  cert_in_id: string;
  title: string;
  published_at: string;
  publisher_claims: string[];         // e.g. "CERT-In severity: Critical"
}

/** Ten dimensions, 0–100. This replaces every notion of a risk score. */
export interface CoverageVector {
  identity: number; sources: number; affected_assets: number;
  applicability: number; exploitability: number; impact: number;
  remediation: number; operational_change: number;
  verification: number; provenance_freshness: number;
}

/** ADR asset_matches: identity · version/config evidence · state · match explanation */
export interface AssetMatch {
  asset_id: string;
  name: string;
  canonical_product: string;
  type: 'product_context' | 'inventory_asset' | 'component';
  deployment_mode: string | null;
  version: string | null;             // null in reference data — render "not established"
  configuration: string | null;       // null in reference data
  vendor_scope_established: boolean;
  environmental_match: string | null; // null — "no tenant evidence supplied"
  applicability: ApplicabilityState;
  confidence: number;                 // 0..1
  rationale: string;                  // ALWAYS rendered, never truncated
  partitions?: { product: string; state: ApplicabilityState }[];  // SharePoint only
}

export interface Claim {
  claim_id: string;
  subject: string;
  predicate: string;
  object: Record<string, unknown>;
  scope: { cve: string | null; product: string; component: string | null; platform: string };
  source_scope: SourceScope;
  confidence: number;
  freshness: 'current' | 'possibly_stale' | 'stale';
  status: 'accepted' | 'superseded' | 'proposed';
}

export interface SourceScope {
  publisher: string;
  authority_class: string;            // government_advisory | first_party_vendor | researcher | secondary_reporting
  source_url: string;
  artifact_sha256: string;
  retrieved_at: string;
  published_at: string;
  revised_at: string | null;
  locator: string;                    // e.g. "document.querySelectorAll('table')[21]"
  extraction_method: string;
  raw_excerpt: string;
}

export interface Contradiction {
  contradiction_id: string;
  subject: string;
  claim_a: { source_id: string; value: string; locator?: string };
  claim_b: { source_id: string; value: string; locator?: string };
  materiality: string;                // 'high' | 'medium' | 'low'
  status: ItemStatus;
  resolution: string;
  resolved_at?: string;
}

/** POLYMORPHIC. 8 atomic actions + 1 composite ticket that wraps them. */
export type RemediationEntry = AtomicRemediation | CompositeTicket;

export interface AtomicRemediation {
  remediation_id: string;
  type: string;
  target: string;
  fixed_target: string | null;
  action: string;
  prerequisites: string[];
  restart_or_outage: string;
  rollback: string;
  evidence_claim_ids: string[];
}

export interface CompositeTicket {
  remediation_id: string;
  type: 'investigation_and_configuration_ticket';
  title: string;
  target: string;
  fixed_target: null;
  fixed_build: null;
  patch_action_authorized: boolean;   // READ DIRECTLY — never infer from fixed_target
  ticket_path: string;
  owners: {
    ticket: string; identity: string; data: string;
    incident: string; business: string; due_date: string;
  };
  ordered_phases: string[];           // 3 phases; phase 2 is "separately authorized"
  restart_or_outage: string;
  rollback: string;
  evidence_claim_ids: string[];
}

export const isCompositeTicket = (r: RemediationEntry): r is CompositeTicket =>
  'ordered_phases' in r;

export interface Verification {
  verification_id: string; scope: string;
  acceptance_test: string; expected_result: string;
}

export interface Source {
  source_id: string; publisher: string; authority_class: string;
  url: string; canonical_url: string; retrieved_at: string;
  http_status: number; availability: string; freshness: string;
  artifact_id: string;
}

export interface Artifact {
  artifact_id: string; path: string; media_type: string;
  sha256: string; bytes: number; immutable: boolean;
}

export interface ReferenceEdge {
  edge_id: string; from_source_id: string; to_source_id: string;
  relation: string; depth: number;            // 0–3 → natural graph columns
  original_edge_status: string;               // acquired | leased | verified_same_sha256
  repair_rationale: string;
}

export interface Gap { gap_id: string; description: string; status: ItemStatus; resolution: string; }

export interface Blocker {
  blocker_id: string; target: string; class: string;
  status: ItemStatus; details: string; public_sibling?: string; effect?: string;
}

export interface FrontierNode {
  frontier_id: string; url: string; depth: number;
  priority: string; status: string; reason: string;
}

export interface Decision { decision_id: string; decision: string; rationale: string; at: string; }

export interface Budgets {
  max_parallel_specialist_runs: number;   // 3
  max_reference_depth: number;            // 3
  max_team_waves: number;                 // 4
  zero_delta_limit_per_shard: number;     // 2
  team_waves_used: number;                // 4 — EXHAUSTED
  specialist_runs_used: number;           // 7
}

export interface AuditPointer {
  head_version: number;                   // 6
  last_event_seq: number;                 // 6
  event_log_path: string;                 // 'run_audit.jsonl'
}
```

### 2.2 Frontend-only types

Not emitted by the backend. Listed in §7 as outstanding requests.

```ts
export type Role = 'executive' | 'lead_manager' | 'risk_analyst' | 'engineer';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type WorkflowState =
  | 'unassigned' | 'triage' | 'escalated_to_analyst' | 'analyst_returned'
  | 'awaiting_approval' | 'approved' | 'assigned_to_engineer'
  | 'phase1_in_execution' | 'awaiting_containment_auth' | 'phase2_in_execution'
  | 'awaiting_verification' | 'awaiting_final_signoff' | 'verified'
  | 'rejected' | 'dormant' | 'rolled_back' | 'returned_to_lead';

export interface CaseSummary {
  case_id: string; title: string;
  status: Case['status']; derived_phase: DerivedPhase;
  publisher_severity: 'Critical' | 'High' | 'Medium' | 'Low' | null;
  priority: Priority; priority_rule: 1|2|3|4|5|6;
  coverage_composite: number; coverage_applicability: number;
  asset_states: Record<ApplicabilityState, number>;
  open_gaps: number; open_blockers: number; open_contradictions: number;
  created_at: string; updated_at: string;
  assigned_to: string | null;
  workflow_state: WorkflowState;
  dormant_reason: string | null;
  recheck_triggers: string[];
}

export interface CaseEventIntent {
  event_type: string;
  case_id: string;
  actor: { id: string; role: Role };
  at: string;
  payload: Record<string, unknown>;
  causal_parent: string | null;
  evidence_refs: string[];              // claim_ids cited
}

export interface AnalystRecommendation {
  recommendation_id: string; case_id: string;
  author: string; created_at: string;
  verdict: 'act_now' | 'act_scheduled' | 'monitor' | 'no_action' | 'need_more_evidence';
  confidence: number;
  summary: string;                      // ≤ 3 sentences
  supporting_claim_ids: string[];       // MIN 1 — submit disabled otherwise
  contradictions_addressed: string[];
  residual_gaps: string[];
  recommended_remediation_ids: string[];
  escalate_to_executive: boolean;
}
```

### 2.3 Store structure

```ts
// ── useBlackboardStore — READ-ONLY, version-aware ──────────────────────
interface BlackboardState {
  blackboard: Blackboard | null;
  caseId: string | null;
  isLoading: boolean;
  error: Error | null;
  readVersion: number;        // audit.head_version at load
  latestVersion: number;      // polled
  isStale: boolean;           // latestVersion > readVersion
  load: (caseId: string) => Promise<void>;   // REQUIRED param
  refresh: () => Promise<void>;
  acceptNewVersion: () => Promise<void>;
  pinCurrentVersion: () => void;
}
```

`blackboard` is a frozen immutable object. Never mutate in place. There is no `approveActions`, no `runEsql`, no `generateReport` — nothing that fabricates evidence.

**Version awareness is a correctness requirement.** The Analyst can re-invoke the harness, so the blackboard can advance mid-read. When `isStale`, render a non-blocking banner: *"Blackboard advanced to v7 while you were reading. [Review changes] [Keep v6]"*. **Never swap data underneath a user.**

```ts
// ── useRoleStore ──────────────────────────────────────────────────────
interface RoleState {
  currentUserRole: Role;                  // persisted: 'sentinel.role'
  identity: { id: string; name: string; title: string; avatar: string };
  capabilities: RoleCapabilities;         // derived, never stored
  density: 'comfortable' | 'compact' | 'dense';
  landingRoute: string;
  tabs: TabConfig[];
  setRole: (r: Role) => void;
}

interface RoleCapabilities {
  canViewPortfolio: boolean;      canViewRawEvidence: boolean;
  canViewEvidenceGraph: boolean;  canApproveP0: boolean;
  canApproveRoutine: boolean;     canAuthorizeContainment: boolean;
  canEscalate: boolean;           canAuthorRecommendation: boolean;
  canResolveContradiction: boolean; canAssignTicket: boolean;
  canExecuteRunbook: boolean;     canRecordVerification: boolean;
  canRequestReinvocation: boolean; canExportBrief: boolean;
}
```

Persistence migration is required — earlier builds stored `'oncall'` and `'analyst'`:

```ts
const ROLE_MIGRATION: Record<string, Role> = {
  oncall: 'lead_manager',
  analyst: 'risk_analyst',
};
function migrateStoredRole(raw: string | null): Role {
  if (!raw) return 'executive';
  if (raw in ROLE_MIGRATION) return ROLE_MIGRATION[raw];
  const valid: Role[] = ['executive','lead_manager','risk_analyst','engineer'];
  return valid.includes(raw as Role) ? (raw as Role) : 'executive';
}
```

```ts
// ── useWorkflowStore — the ONLY mutable surface ────────────────────────
interface WorkflowStore {
  tickets: Ticket[];
  approvals: Approval[];
  recommendations: AnalystRecommendation[];
  riskAcceptances: RiskAcceptance[];
  pendingEvents: CaseEventIntent[];

  escalateToAnalyst(caseId, question, analystId): CaseEventIntent;
  submitRecommendation(rec): CaseEventIntent;
  requestApproval(caseId, remediationIds, requiredRole): CaseEventIntent;
  grantApproval(approvalId, rationale): CaseEventIntent;      // GATE 1
  rejectApproval(approvalId, rationale): CaseEventIntent;
  assignTicket(caseId, remediationId, engineerId, changeWindow): CaseEventIntent;
  updateExecutionStep(ticketId, stepId, status, note?): CaseEventIntent;
  requestContainmentAuth(ticketId, findings): CaseEventIntent;
  grantContainmentAuth(ticketId, rationale): CaseEventIntent; // GATE 2
  recordVerification(ticketId, verificationId, outcome, observed): CaseEventIntent;
  signFinalAcceptance(ticketId, rationale): CaseEventIntent;
  initiateRollback(ticketId, reason): CaseEventIntent;
  resolveContradiction(caseId, contradictionId, resolution, rationale, claimIds): CaseEventIntent;
  requestReinvocation(caseId, urls, reason, budgetRequested): CaseEventIntent;
}
```

Every action asserts its capability and throws in DEV if invoked by a role lacking it. Every action returns an intent rendered by `CaseEventIntentModal` before commit.

### 2.4 Two data facts that must not be smoothed over

**`asset_context_supplied: true` while every rationale states no tenant evidence was supplied.** Both are true — the *products* were named, the *environment* was not. Until the backend separates `environment_evidence_supplied`, the UI must show these as two distinct flags or the screen reads as self-contradictory.

**`budgets.team_waves_used === max_team_waves` (4/4).** Budget is exhausted. Any re-invocation request in the reference dataset routes through Lead authorisation. This is the interesting demo path.

---

## 3. RBAC & The Data Abstraction Funnel

### 3.1 Why four roles

Uncertainty tolerance is a function of **the decision**, not of seniority.

| Decision | Role | Ambiguity absorbed | Needs |
|---|---|---|---|
| Authorise — spend risk? | Executive | High — decides *under* uncertainty | Uncertainty compressed to yes/no |
| Route — who next? | Lead Manager | Moderate — enough to judge | Conclusion + stated reasoning |
| Investigate — what does evidence support? | Risk Analyst | Total — it is their raw material | Uncertainty fully expanded |
| Execute — what do I change? | Engineer | **Zero** | Ordered, reversible steps |

**Role is a lens, not a wall.** Any role may navigate almost anywhere; what changes is *depth of disclosure*. The one true wall is the Engineer, who cannot reach another engineer's ticket — that is scope, not depth.

**Denied controls are rendered and visibly locked, never hidden.** `<LockedControl capability="canApproveP0">` renders the control disabled; clicking the lock opens a modal naming the authoritative role with a switch shortcut. Hiding conceals the governance model; locking demonstrates it.

### 3.2 Capability matrix

| Capability | Exec | Lead | Analyst | Engineer |
|---|:--:|:--:|:--:|:--:|
| View portfolio / all cases | ● | ● | ○ escalated only | ✕ |
| View raw claims + `source_scope` | ✕ | ○ summary | ● | ✕ |
| View `raw_excerpt`, `locator`, `artifact_sha256` | ✕ | ✕ | ● | ✕ |
| View contradictions | ○ count | ○ summary | ● | ✕ |
| View evidence graph, frontier, budgets | ✕ | ✕ | ● | ✕ |
| Approve P0 (Gate 1) | ● | ✕ | ✕ | ✕ |
| Approve P1–P3 (Gate 1) | ✕ | ● | ✕ | ✕ |
| Authorise containment (Gate 2) | ✕ | ● | ✕ | ✕ |
| Sign final acceptance | ✕ | ● | ✕ | ✕ |
| Escalate to analyst | ✕ | ● | ✕ | ✕ |
| Author recommendation | ✕ | ✕ | ● | ✕ |
| Resolve contradiction | ✕ | ✕ | ● | ✕ |
| Request re-invocation | ✕ | ○ authorises | ● | ✕ |
| Assign ticket | ✕ | ● | ✕ | ✕ |
| Execute runbook step | ✕ | ✕ | ✕ | ● |
| Record verification | ✕ | ✕ | ✕ | ● |
| Export board brief | ● | ○ view | ✕ | ✕ |

`●` full · `○` restricted · `✕` denied

### 3.3 Blackboard abstraction per role

| `blackboard.*` path | Exec | Lead | Analyst | Engineer |
|---|:--:|:--:|:--:|:--:|
| `coverage` composite (mean of 10) | ● | ● | ● | ✕ |
| `coverage` weakest dimension | ● | ● | ● | ✕ |
| `coverage` per-dimension bars | ○ | ● | ● | ✕ |
| `assets[]` grouped by `applicability` | ● | ● | ● | ✕ |
| `assets[].confidence` | ○ aggregate | ● | ● | ✕ |
| `assets[].rationale` | **✕** | ● | ● | ✕ |
| `assets[].version` / `.configuration` | **✕** | ● | ● | ✕ |
| `assets[].partitions[]` | **✕** | ● | ● | ✕ |
| `claims[]` counts | ● | ● | ● | ✕ |
| `claims[]` table | ✕ | ○ summary | ● | ✕ |
| `claims[].source_scope` | ✕ | ✕ | ● | ✕ |
| `sources[]` by publisher | ● | ● | ● | ✕ |
| `contradictions[]` | ○ count | ○ summary | ● | ✕ |
| `gaps[]` / `blockers[]` | ○ count | ● | ● | ✕ |
| `remediation[].action` | ○ | ● | ● | ● own ticket |
| `remediation[].prerequisites` | ✕ | ○ | ○ | ● |
| `remediation[].restart_or_outage` | ✕ | ● | ○ | ● |
| `remediation[].rollback` | ✕ | ○ | ○ | ● |
| `remediation[].patch_action_authorized` | ● | ● | ● | ● |
| `verification[]` | ○ | ● | ● | ● |
| `frontier[]`, `reference_edges[]`, `budgets` | ✕ | ✕ | ● | ✕ |
| `decisions[]` | ○ | ● | ● | ✕ |
| `audit.head_version` | ○ | ● | ● | ✕ |

**Executive drill-down stops at *which assets*, never at *why*.** Their asset-related decisions are P0 approval and risk acceptance — those need *how many, which, how bad*, never the match reasoning they delegated.

**The Lead/Analyst boundary is load-bearing.** The Lead reads the harness's conclusion and its stated reasoning. The Analyst reads the evidence it was derived from. If a Lead is reading `raw_excerpt`, the escalation path has become decorative.

### 3.4 Filtering rules

**Filtering lives in `selectors/rbac.ts`. Never in a component.** A component that receives unfiltered data and hides rows is a security defect waiting to ship.

```ts
// Executive isolates P0 approvals
cases.filter(c => c.priority === 'P0'
  && c.workflow_state === 'awaiting_approval'
  && approvalFor(c).required_role === 'executive');

// Lead: active queue
cases.filter(c => !['dormant','verified'].includes(c.workflow_state));

// Analyst: escalations to me
cases.filter(c => c.workflow_state === 'escalated_to_analyst' && c.assigned_to === me);

// Engineer: my tickets only
tickets.filter(t => t.assigned_to === me
  && ['assigned_to_engineer','phase1_in_execution','awaiting_containment_auth',
      'phase2_in_execution','awaiting_verification'].includes(t.workflow_state));
```

Search (`⌘K`) is scoped identically. A role reaching a forbidden entity by direct URL is **redirected to their landing route with a toast naming the required role** — never a silent 404.

### 3.5 Priority derivation

`blackboard.json` contains no priority. Derive deterministically; **every badge exposes its rule**. First match wins.

| # | Condition | Priority |
|---|---|---|
| 1 | any asset `affected` AND publisher severity Critical/High | **P0** |
| 2 | any asset `affected` | **P1** |
| 3 | publisher severity Critical AND `coverage.applicability < 60` | **P1** |
| 4 | any open blocker, or open contradiction with `materiality: 'high'` | **P2** |
| 5 | `derived_phase` in discovery / expansion / reconciliation | **P2** |
| 6 | otherwise | **P3** |

Reference case → `{ priority: 'P1', rule: 3 }`. Tooltip: `P1 · rule 3 — Critical severity, applicability 40 < 60`. A Lead override replaces the rule text with `P0 · overridden by m.rao — [reason]`.

---

## 4. Screen-by-Screen Blueprints

### 4.1 Executive Dashboard — `/dashboard`

Tabs: **Portfolio · Approvals · Asset Impact · Board Brief**

**Row 1 — `<BoardBriefPanel/>`.** The frozen, attested board brief is the executive page head. It precedes live alerts because it is the governing snapshot for board communication. The dashboard does **not** repeat a single-case advisory header; case identity, advisory metadata, phase and status remain available through the Case Index and Asset Impact report so the executive landing page stays portfolio-first.

**Row 2 — Executive signal strip.** Active derived alerts · critical derived alerts · assets not established · open blockers. Signals must expose that they are derived; asset uncertainty must never be relabelled as non-compliance.

**Row 3 — Needs attention.** One-line actionable rows from open `blockers[]` and `contradictions[]` with `materiality: 'high'`, action button right-aligned.

**Row 4 — Alert snapshot and coverage distribution.** Alert history is not present in the materialized blackboard, so `<AlertTrendCard/>` renders the current snapshot and explicitly says that no trend is fabricated. Coverage distribution bands the ten evidence dimensions; it is never called risk distribution.

**Row 5 — Evidence state strip**, five cells, each navigating to its filtered view:
`gaps` open/total (9/13) · `blockers` (2/5) · `contradictions` (1/4) · `claims` accepted (40/42) · `sources` (24)

**Row 6 — two Recharts, side by side.**

*`<CoverageByDimension/>`* — `BarChart layout="vertical"`, ten bars from `coverage`, **sorted ascending** so the weakest sits at top. `<Cell>` per bar: ≥90 `--color-safe`, 60–89 `--color-medium`, <60 `--color-critical`. `applicability` at 40 lands first and red. `dataLabel` at bar end. Dashed `CartesianGrid` on the value axis only. No legend. Bar click → `/gaps/:caseId?dimension=applicability`.

*`<EvidenceByPublisher/>`* — `BarChart layout="vertical"` over `sources[]` grouped by `publisher`, descending: Microsoft 14 · Huntress 3 · CERT-In 2 · Huntress Labs 1 · BleepingComputer 1 · FBI IC3 1 · CISA/NSA/FBI/MS-ISAC 1 · MS Defender Research 1. `<Cell>` coloured by `authority_class`, external legend. Bar click → `/evidence/:caseId?publisher=Microsoft`.

**Row 7 — `<PortfolioCharts/>`**, from `useCaseIndexStore`.

*Priority distribution* — stacked `BarChart`, P0–P3 by `derived_phase`.
*Coverage posture* — `ScatterChart`, x = `coverage_composite`, y = `coverage_applicability`, one dot per case, `ZAxis` = affected asset count. The low-applicability quadrant is the portfolio's blind spot. Dot click → that case.

**Row 8 — `<CaseIndexList/>`.** The case index is the drill-down entry point. Composite coverage must always appear beside applicability; for the reference case the pair is 92 / 40.

Executive **never** renders `artifact_sha256`, `locator`, `raw_excerpt`, `event_seq`, or ES|QL. Enforce with `<RoleGate capability="canViewRawEvidence">` whose fallback offers a role switch — a feature, not an error state.

### 4.2 Asset Impact Report — `/reports/asset-impact/:caseId`

Replaces external regulatory reporting entirely. **Internal only. No submission action of any kind.**

One component, three depths. The route passes `depth`; the component **never** reads `useRoleStore`.

```tsx
<AssetImpactReport depth="portfolio" />    // executive
<AssetImpactReport depth="operational" />  // lead_manager
<AssetImpactReport depth="forensic" />     // risk_analyst
```

| Depth | Includes | Excludes |
|---|---|---|
| `portfolio` | State roll-up, affected-asset names, aggregate confidence | `rationale`, per-asset `confidence`, `version`, `configuration`, `partitions`, all claims |
| `operational` | Full matrix, `rationale`, `partitions`, remediation with `restart_or_outage` + `rollback` | claims table, `raw_excerpt`, `locator`, `artifact_sha256` |
| `forensic` | Everything above + claims per asset, provenance drawer, analyst assessment panel | nothing |

**Header.** Title, `case_id` chip, `advisory.title`, generated-at, composite coverage, JSON and PDF export.

**Honesty banner** — rendered whenever `coverage.applicability < 60`:

> **This is an investigation report, not a remediation plan.** Applicability coverage is 40. Vendor scope is established for both products, but no tenant, identity, licensing, configuration, token, or telemetry evidence was supplied. No asset is confirmed affected.

**Asset summary strip.** Counts by `applicability`: Affected 0 · Not affected 0 · Fixed 0 · **Under investigation 2** · Unknown 0. Zeroes render as zeroes, never hidden.

**Asset matrix** — one expandable card per `assets[]` entry:

| Field | Rendering |
|---|---|
| `name` / `canonical_product` | Title + mono subtitle |
| `type` | Chip; `product_context` tooltip: *"named in advisory scope; not an inventory match"* |
| `applicability` | State pill with shape glyph |
| `confidence` | Percentage + fill bar |
| `version` | `null` → **"not established"**, muted italic. Never a dash, never blank |
| `configuration` | same |
| `vendor_scope_established` | check/cross with tooltip |
| `environmental_match` | `null` → *"no tenant evidence supplied"* |
| `partitions[]` | Nested sub-table. SharePoint Online `under_investigation` / SharePoint Server `unknown`. **Load-bearing — do not flatten** |
| `rationale` | **Always visible, never truncated, never behind a toggle.** This is the point of the report |

**Remediation section** — `remediation[]` grouped by `type`. Per entry: `action`, `prerequisites[]` as a checklist, `restart_or_outage`, `rollback`, `evidence_claim_ids[]` as `<ProvenanceChip/>`s.

Where `fixed_target` is `null` → **"no fixed build established"**, and suppress every patch-like affordance. Where `patch_action_authorized === false` → header reads **INVESTIGATION & CONFIGURATION — NOT A PATCH**. The UI must never contradict its own data.

**Verification section** — `verification[]` as a table: `scope`, `acceptance_test`, `expected_result`.

**Open questions** — all open `gaps[]` (`description` + `resolution`) and open `blockers[]`. Header: *"What would change this report."* A feature, not an apology.

**Export.** JSON must include `schema_version`, `case_id`, `audit.head_version`, `audit.last_event_seq` so the export is reproducible against the ledger.

### 4.3 Lead Manager — Triage & Delegation

Tabs: **Triage Hub · Tickets · Asset Impact · Evidence · Case Timeline**

**`/triage`** — compact 40px rows, the densest queue in the product.

Columns: Priority (`<PriorityBadge/>` + rule tooltip) · Case ID · Title · Phase · Asset states (micro stacked bar) · Coverage / applicability · Open blockers · Analyst verdict · Workflow state · Age · Actions.

**Row click navigates to `/reports/asset-impact/:caseId`.** `ActionButtons` must `e.stopPropagation()`.

Filter pills with live counts: P0 · P1 · P2 · P3 · Awaiting my approval · Escalated · Returned · Unassigned.

Row actions: **Approve & assign** · **Escalate to analyst** · **Request exec approval**.

*Escalate* requires a **named question** — free-text-only escalation is forbidden, since an analyst needs a specific ask. Suggestions pre-generated from open `gaps[]`.
*Approve & assign* — select `remediation[]` entries, select engineer, set change window. `restart_or_outage` shown prominently.

**Right rail — Returned from analyst.** `AnalystRecommendation` cards: verdict chip, confidence, three-sentence `summary`, residual gap count, [Act on Recommendation].

**`/tickets`** — board by `workflow_state`, or table. Drag emits a workflow event. Overdue and blocked surface first.

### 4.4 Engineer — Runbook Execution

Tabs: **My Tasks · History**. Two tabs, deliberately. Every additional surface is an opportunity to hesitate at 2am.

**`/tasks`** — one card per ticket: `<PriorityBadge/>`, `CompositeTicket.title`, current phase (1 of 3), phase progress bar, change window, assigned-by, lock indicator.

**`/tasks/:ticketId`** — phase-gated stepper.

Header, always visible: ticket title · **one line of case context only** (`CIAD-2026-0037 · {advisory.title} · assigned by m.rao`) · `patch_action_authorized: false` banner · persistent rollback footer with confirmed *Initiate rollback*.

Three collapsible phase panels from `CompositeTicket.ordered_phases`, one active at a time:

| Phase | Label | Disruptive |
|---|---|---|
| 1 | authorized read-only investigation | No |
| 2 | separately authorized control and containment | **Yes — Gate 2** |
| 3 | acceptance testing and applicability transition | No |

Per remediation in phase: **Pre-flight** (`prerequisites[]` checklist, all ticked before action unlocks) → **Impact** (`restart_or_outage` warning band, critical treatment in Phase 2) → **Action** (`action` verbatim, large, copyable, never paraphrased or truncated) → **Outcome** (done/blocked/skipped, note required unless done) → **Rollback** (collapsed detail).

Phase 2 is locked until Phase 1 completes **and** Gate 2 is granted. The lock is visible: *"Awaiting containment authorisation from Lead Manager"* with requested-at timestamp.

Phase 3 maps each remediation to its `verification[]` entries via `verificationMap.ts`. **Fail is first-class** — returns the ticket to the Lead automatically and does not block recording remaining results.

**Phase-to-remediation mapping is a frontend assumption** (§7). Label it on screen.

### 4.5 Board Brief — `/brief`, `/brief/new`, `/brief/:briefId`

The Executive is the **author**; the audience is a board. It is also a **defensive document** — the record that the board was informed. Therefore: generated, dated, attested, **frozen**, versioned. The Portfolio dashboard is live; the brief is a signed snapshot with a comparison to the previous one.

Five sections, each with a figure above its prose:

| Section | Figure |
|---|---|
| **Posture** | Cases opened / closed / closed-pending-evidence, this period vs prior. Small `BarChart`. Plain English first, figure second: *"Evidence quality: strong (92/100)"* |
| **Duty of care** | Four stat tiles — cases handled, % completing full evidence cycle, human decisions recorded, `audit.head_version` |
| **What we don't know** | **The reason this artifact exists — most space.** Table: case · what could not be established · named blocker in plain language · what would close it. *"Microsoft 365 exposure — we could not establish whether our tenant is affected. Cause: we hold no tenant telemetry access. Closing this requires Purview audit licensing and a read-only Entra sign-in export."* |
| **Decisions taken** | Executive authorisation count + compact list: what, who, when, rationale |
| **The ask** | Each ask with the case IDs it would resolve |

**Forbidden in the brief:** CVE identifiers · threat actor names · coverage dimension names · ES|QL · hashes · locators · raw excerpts · claim IDs · phase names. Enforce with a DEV-mode content lint that fails the render.

Footer: prepared by · period · generated at · `ledger_head_version` · brief version. Print-ready. **Freeze & attest** requires a typed name, sets `frozen_at`, captures `audit.head_version`, and makes the brief immutable.

### 4.6 Forensic View — Risk Analyst

Tabs: **Audit Trail · Alerts · Evidence · Asset Impact · Gaps & Blockers**. Dense mode throughout. Landing: `/audit`.

**`/audit/:caseId` — Audit Trail.** Strictly read-only, 36px rows, monospace-dominant.

Filter bar: actor · correlation · event type · date range · free-text mono query.
Ledger from `decisions[]` joined with committed `CaseEventIntent`s, columns: `SEQ · TIMESTAMP (IST) · EVENT TYPE · ACTOR (agent|human) · SUMMARY · HASH · VERIFIED`.
Row expansion: executed query if present, the **declarative agent record** (never raw chain-of-thought), approval status and approver, `previous_event_hash` and `event_hash` in full, evidence chips.

Right rail — **Chain Integrity**: `audit.head_version` and `audit.last_event_seq` (v6 · seq 6). Last six blocks each linking to its predecessor. `[Re-verify chain]` walking blocks at ~60ms. **Plus a required tamper-detected inset variant** — one block red, chain broken at the exact sequence. *Designing the failure state is what proves the mechanism is real.*

**`/alerts` — attention feed.** No `alerts` key exists; this is derived and labelled as derived.

| Signal | Derivation | Severity |
|---|---|---|
| Open contradiction, `materiality: 'high'` | `contradictions[]` | Critical |
| Case closed with open high-materiality contradiction | governance exception | Critical |
| Open blocker | `blockers[].status === 'open'` | High |
| Coverage dimension < 60 | any `coverage[k] < 60` | High |
| Stale source | `sources[].freshness !== 'current'` | Medium |
| Low-confidence accepted claim | `confidence < 0.7 && status === 'accepted'` | Medium |
| Blocked frontier node | `frontier[].status === 'blocked'` | Low |

Every row exposes its rule in a tooltip. Row click routes to the relevant surface.

**`/evidence/:caseId` — Evidence Explorer.** Tabs: Claims (42) · Sources (24) · Artifacts (22) · Contradictions (4) · Provenance graph.

*Claims table* — subject, predicate, `scope.product`, confidence, freshness, status, publisher, `authority_class`. Row expands to full `source_scope` including `locator`, `extraction_method`, and `raw_excerpt` in mono.

*Contradictions* — side-by-side `claim_a` / `claim_b` with source, value, locator; `materiality`, `status`, `resolution`. The open `contradiction-kali365-cidr` gets a character-level diff on `43.173.64.0/20` vs `/18` with the address-space delta computed and shown. Resolution actions: *Accept A* · *Accept B* · *Both valid, scope differs* · *Unresolvable — record and escalate*. Every resolution requires a rationale and at least one cited `claim_id`.

*Provenance graph* — **no new dependency.** `reference_edges[].depth` is 0–3, giving natural columns; 24 nodes across 4 depth bands is layoutable in plain SVG. Nodes = `sources[]`, showing publisher, `authority_class` badge, `freshness` dot, `http_status`, and the truncated `artifact_sha256` as a mono chip — these are the preserved proof-of-collection artifacts. Edges = `reference_edges[]`, styled by `original_edge_status`: `acquired` solid · `leased` dashed · `verified_same_sha256` doubled. Node click → `<ProvenanceDrawer/>`. Hover highlights that node's edges and dims the rest.

**`/recommend/:caseId` — Recommendation composer.** A full page, not a modal. Verdict selector, confidence, character-budgeted three-sentence summary, searchable claim citation picker (**min 1 — submit disabled otherwise**), contradictions addressed, residual gaps pre-populated from open `gaps[]`, remediation multi-select, escalate-to-executive toggle, and a preview showing exactly what the Lead will see.

**Re-invocation panel.** Target URLs or source class, reason, expected coverage gain, waves requested. Pre-populated from `frontier[]` entries with `status: 'blocked'` and open gaps. `budgets.team_waves_used < max_team_waves` → auto-approve; exhausted → Lead authorisation. Reference data is 4/4, so the Lead path is the live one.

---

## 5. Component Library & Theming

### 5.1 Tokens

Defined once in `src/styles/tokens.css`. **No hex value appears anywhere else in the codebase.**

```css
:root {
  /* surfaces */
  --color-page:        #0B0E14;
  --color-surface:     #12161F;
  --color-surface-2:   #171C26;
  --color-surface-3:   #1C2230;
  --color-surface-4:   #232A38;
  --color-border:      #1E242E;
  --color-border-2:    #2A303C;

  /* text */
  --color-text:        #E9ECF2;
  --color-text-2:      #D2D8E2;
  --color-text-muted:  #A2ABBA;
  --color-text-dim:    #6F7A8B;

  /* accent */
  --color-accent:      #7C6BF5;
  --color-accent-soft: #9A8CFF;
  --color-accent-bg:   #1B1E33;

  /* severity — reserved for severity, never decorative */
  --color-critical:    #FF6B70;
  --color-high:        #FF9F52;
  --color-medium:      #F0CB4D;
  --color-low:         #6F7A8B;
  --color-safe:        #4ADE80;

  /* radii */
  --radius-card:  16px;
  --radius-panel: 10px;
  --radius-ctl:   8px;
  --radius-chip:  6px;
  --radius-pill:  999px;

  /* type */
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}
```

Light theme via `.light` on `<html>`. **Every token must be defined in both.** Severity hues differ per theme — `#FF6B70` is ~2.8:1 on white and unreadable; light uses `#D92D33` / `#B45309` / `#A16207` / `#15803D`, and accent darkens to `#5B47E0`. Anti-FOUC script runs synchronously in `<head>` before any stylesheet.

Theme-specific: dark = 1px border, no shadow; light = border **plus** `0 1px 2px rgb(16 22 31 / 0.06)`. Dark carries two 4%-opacity indigo radial glows; light has none.

### 5.2 Styling rules

- **Borders mark card boundaries only.** Inside a card, separate with spacing and background tone. Never border every element.
- **Severity is colour *and* shape** — Critical triangle · High circle · Medium square · Low dash · Safe shield-check. Never colour alone.
- Severity pills: `color-mix(in srgb, var(--color-critical) 12%, transparent)` background, full-strength text, 6px shape glyph.
- **Monospace is mandatory** for every `case_id`, `claim_id`, `artifact_sha256`, `source_url`, `locator`, version string, IP, and timestamp in a ledger.
- **Minimum font size 12px.** Body 13. Labels 12 muted `+0.04em`. Section headers 15 medium. One dominant number per screen.
- Density by role: comfortable 48px rows / compact 40px / dense 36px.
- Tables: borderless, sticky header, numerics right-aligned, 2% hover tint, no vertical rules.
- Charts read colours from CSS variables via `useThemeTokens()`. Never hardcode a hex in a Recharts prop.

### 5.3 Iconography — lucide-react

Stored as string names in `TabConfig.icon`, resolved through one map so tab config stays serialisable.

| Concept | Icon |
|---|---|
| Portfolio / Dashboard | `LayoutDashboard` |
| Triage | `Inbox` |
| Tickets | `CheckSquare` |
| Tasks | `ClipboardList` |
| History | `History` |
| Audit trail | `ScrollText` |
| Alerts | `Bell` |
| Evidence | `Search` |
| Asset impact | `FileText` |
| Gaps & blockers | `AlertTriangle` |
| Provenance / source | `Link2` |
| Locked capability | `Lock` |
| Ledger write intent | `Database` |
| Verified chain | `ShieldCheck` |
| Contradiction | `GitCompareArrows` |

Sizes: 16px inline, 18px tabs, 20px section headers. Stroke 1.75. Colour inherits `currentColor` — never hardcoded.

### 5.4 Motion — framer-motion

Motion signals state change; it never decorates.

| Pattern | Implementation |
|---|---|
| Role switch | `AnimatePresence` on `<Outlet/>`, 180ms crossfade. Long enough to signal, short enough not to slow a demo |
| Phase panel expand | `layout` + `height: auto`, 220ms `easeOut` |
| Modal | `opacity` 0→1 + `scale` 0.98→1, 150ms |
| Drawer | `x: '100%' → 0`, 240ms `easeOut` |
| Toast | slide + fade, 200ms; auto-dismiss 4s |
| Chain verification walk | staggered `<motion.div>` per block, 60ms delay each |
| Priority / phase reorder | shared `layoutId` |
| Streaming thought chain | per-line `initial={{opacity:0,y:4}}`, 300–600ms apart |

**All motion respects `prefers-reduced-motion`** — disable the trace animation, chain walk, and streaming; content appears whole.

---

## 6. Implementation Milestones

### Sprint 1 — State, Routing & Defect Closure

- `src/routes.ts` route manifest; `App.tsx` and `useRoleStore.ts` both consume it
- Register `/audit`, `/audit/:caseId`, `/approvals`, `/brief/*` (**closes D-1**)
- Rewrite the DEV invariant to validate against the manifest (**closes D-2**)
- Bare-path redirects for `/evidence`, `/gaps` (**closes D-3**); resolve `/queue`, `/contradictions`, `/case` (**D-4**)
- `useCaseParam()` adopted by every case-scoped page; zero bare `load()` calls
- Role migration for persisted `'oncall'` / `'analyst'`
- `selectors/rbac.ts` — all role filtering centralised
- `<LockedControl/>` and `<RoleGate/>` shipped and used

**Exit:** every tab in every role resolves to a real route; DEV invariant throws on any unreachable route; `npm test` and `tsc -b` green.

### Sprint 2 — Core Dashboards & Reporting

- Executive dashboard rows 1–8 (§4.1)
- `<CoverageByDimension/>`, `<EvidenceByPublisher/>`, `<PortfolioCharts/>`
- `<AssetImpactReport depth/>` refactor — three depths, no `useRoleStore` import
- `<BoardBriefPanel/>` with a figure in all five sections + forbidden-content lint
- `StatusBar` reads `ledger head v{head_version} · seq {last_event_seq}` — remove any fabricated chain number

**Exit:** composite coverage 92 and weakest applicability 40 are the dominant pairing; every `null` renders "not established"; SharePoint `partitions[]` render distinctly.

### Sprint 3 — RBAC Abstraction & Forensic Surfaces

- Audit Trail with chain integrity **and the tamper-detected variant**
- Alerts feed, every row exposing its derivation rule
- Evidence Explorer: claims with full `source_scope`, contradictions with CIDR diff
- Provenance graph — 24 nodes, 17 edges, plain SVG, no new dependency
- Recommendation composer with mandatory claim citation
- `VersionBanner` — never swap data silently
- Search scoping and forbidden-URL redirect with explanatory toast

**Exit:** every dashboard number reaches its `raw_excerpt` in ≤ 2 clicks; a recommendation cannot be submitted without a real cited `claim_id`.

### Sprint 4 — Runbooks, Approvals & the Loop

- Composite ticket model and `verificationMap.ts`
- Engineer three-phase runbook with phase gating
- **Gate 1** `TicketApprovalModal` · **Gate 2** `ContainmentAuthModal` · `FinalSignoffModal`
- `CaseEventIntentModal` on every mutating action
- Notifications wired to all 13 triggers, actor-scoped for Engineer
- Board Brief composer with freeze & attest
- Both-theme sweep across every surface

**Exit — the demo:** Exec authorises → Engineer investigates → Gate 2 requested → Lead authorises → Engineer executes → verification recorded → Lead signs off. Six role switches, one case, an intent modal at every gate.

---

## 7. Non-Negotiables & Open Assumptions

### Never
1. Never mutate the blackboard from the UI. Human actions emit `CaseEventIntent`.
2. Never render `null` as a blank or a dash. `null` is a finding: **"not established"**.
3. Never display a number without a reachable provenance path.
4. Never show composite coverage without its weakest dimension.
5. Never offer a patch affordance when `patch_action_authorized === false`.
6. Never render raw model chain-of-thought. Declarative records only.
7. Never hide a denied control. Render it locked.
8. Never swap blackboard data silently on version change.
9. Never filter by role inside a component. Selectors only.
10. Never hardcode a hex outside `tokens.css`.
11. Never build external regulatory submission of any kind.
12. Never flatten `assets[].partitions[]`.

### Open assumptions — labelled in the UI, pending backend

| Assumption | Surface | Resolution |
|---|---|---|
| Phase-to-remediation mapping | Engineer runbook | `remediation[].phase` |
| Verification-to-remediation mapping | Engineer Phase 3 | `remediation[].verification_ids[]` |
| Budget authorisation → Lead | Re-invocation | Backend policy |
| Priority derivation rules | Every badge | Priority belongs server-side |
| Seeded case index | Triage, Portfolio | `GET /cases` |
| Claim-to-asset linkage (inferred from `scope.product`) | Asset matrix | `claims[].asset_ids[]` |
| `rem-block-legacy-auth` has no acceptance test | Engineer Phase 3 | Backend to define |
| Coverage has no history | Trend charts | `coverage_history[]` keyed by `event_seq` |
| `active_missions[]` always empty | Harness-running panel | Backend to populate |
| `asset_context_supplied` conflated with environment evidence | Asset matrix | Separate `environment_evidence_supplied` |

**A labelled assumption reads as rigour. An unlabelled one reads as fabrication.**

### Definition of done
- [ ] `tsc -b` and `npm test` green; zero console warnings in a production build
- [ ] Every route in the manifest is registered and reachable from its role's tabs
- [ ] `grep -rn "load()" src/` → no bare calls
- [ ] `grep -rni "cvss\|esql\|annexure\|riskScore\|reachability\|8,441" src/` → no matches
- [ ] `grep -rni "TODO\|pending phase\|mocked visualization" src/` → nothing rendered to users
- [ ] Engineer cannot reach another engineer's ticket by URL
- [ ] Executive has no reachable path to `raw_excerpt`, `artifact_sha256`, or `locator`
- [ ] Frozen Board Brief is immutable and carries `ledger_head_version`
- [ ] Both themes verified on every surface
- [ ] **Swapping a different `blackboard.json` at the same `schema_version` renders correctly for all four roles with zero code changes**
