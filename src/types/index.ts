/* ============================================================
   Sentinel-In Type Definitions
   SPEC-002 Blackboard Pivot
   ============================================================ */

// === Roles (SPEC §3) ===

export type Role = 'executive' | 'lead_manager' | 'risk_analyst' | 'engineer';

export type Density = 'comfortable' | 'compact' | 'dense';

export interface RoleIdentity {
  id: string;
  name: string;
  title: string;
  shortTitle: string;
  avatar: string;
}

export interface RoleCapabilities {
  canViewPortfolio: boolean;
  canViewRawEvidence: boolean;
  canViewEvidenceGraph: boolean;
  canApproveP0: boolean;
  canApproveRoutine: boolean;
  canAuthorizeContainment: boolean;
  canEscalate: boolean;
  canAuthorRecommendation: boolean;
  canResolveContradiction: boolean;
  canAssignTicket: boolean;
  canExecuteRunbook: boolean;
  canRecordVerification: boolean;
  canRequestReinvocation: boolean;
  canExportBrief: boolean;
  exportFormats: string[];
}

export type RoleCapability = Exclude<keyof RoleCapabilities, 'exportFormats'>;

export interface TabConfig {
  id: string;
  label: string;
  route: string;
  icon: string;
}

export interface RoleConfig {
  identity: RoleIdentity;
  landingRoute: string;
  density: Density;
  tabs: TabConfig[];
  capabilities: RoleCapabilities;
  assistantFraming: string;
  auditDefault: {
    esqlExpanded: boolean;
    hashesShown: boolean;
  };
}

// === Theme ===

export type ThemeMode = 'dark' | 'light' | 'system';

// === Overlays ===

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}

export interface ModalDescriptor {
  id: string;
  title: string;
  component: string;
  props?: Record<string, unknown>;
}

export interface DrawerDescriptor {
  id: string;
  type: string;
  entityId?: string;
  contextId?: string;
  initialAnalysisPrompt?: string;
  props?: Record<string, unknown>;
}

// === Blackboard Schema (SPEC-002 §2) ===

export type ApplicabilityState =
  | 'affected' | 'not_affected' | 'fixed' | 'under_investigation' | 'unknown';

export type ItemStatus = 'open' | 'resolved' | 'mitigated' | 'superseded' | 'accepted';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type WorkflowState =
  | 'unassigned' | 'triage' | 'escalated_to_analyst' | 'analyst_returned'
  | 'awaiting_approval' | 'approved' | 'assigned_to_engineer'
  | 'phase1_in_execution' | 'awaiting_containment_auth'
  | 'phase2_in_execution' | 'awaiting_verification' | 'awaiting_final_signoff'
  | 'verified' | 'rejected' | 'dormant' | 'rolled_back' | 'returned_to_lead';

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
  audit: { head_version: number; last_event_seq: number; event_log_path: string };
}

export interface Case {
  case_id: string;                 // 'CIAD-2026-0037'
  status: 'open' | 'closed' | 'blocked' | 'dormant' | 'reopened';
  derived_phase:
    | 'dormant' | 'discovery' | 'expansion' | 'reconciliation' | 'applicability'
    | 'actionability' | 'verification' | 'complete' | 'blocked' | 'reopened';
  created_at: string;
  updated_at: string;
  input_url: string;
  asset_context_supplied: boolean;
}

export interface Advisory {
  cert_in_id: string;
  title: string;
  published_at: string;
  revised_at: string | null;
  identifiers: string[];
  publisher_claims: string[];
}

export interface CoverageVector {
  identity: number; sources: number; affected_assets: number;
  applicability: number; exploitability: number; impact: number;
  remediation: number; operational_change: number;
  verification: number; provenance_freshness: number;
}

/** ADR Table 15 — asset_matches: identity, version/configuration evidence, state, match explanation */
export interface AssetMatch {
  asset_id: string;
  name: string;
  canonical_product: string;
  type: 'product_context' | 'inventory_asset' | 'component';
  deployment_mode: string | null;
  version: string | null;
  configuration: string | null;
  vendor_scope_established: boolean;
  environmental_match: string | null;
  applicability: ApplicabilityState;
  confidence: number;              // 0..1
  rationale: string;               // the match explanation — ALWAYS rendered
  partitions?: { product: string; state: ApplicabilityState }[];
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
  authority_class: string;
  source_url: string;
  artifact_sha256: string;
  retrieved_at: string;
  published_at: string;
  revised_at: string | null;
  locator: string;                 // e.g. "document.querySelectorAll('table')[21]"
  extraction_method: string;
  raw_excerpt: string;
}

export interface Gap { gap_id: string; description: string; status: ItemStatus; resolution: string; }

export interface Blocker {
  blocker_id: string; target?: string; class: string;
  status: ItemStatus; details: string; public_sibling?: string; effect?: string;
}

export interface Contradiction {
  contradiction_id: string; subject: string;
  claim_a: { source_id: string; value: string; locator?: string };
  claim_b: { source_id: string; value: string; locator?: string };
  materiality: string; status: ItemStatus; resolution: string; resolved_at?: string;
}

export type RemediationEntry = AtomicRemediation | CompositeTicket;

export interface AtomicRemediation {
  remediation_id: string; type: string; target: string; fixed_target: string | null;
  action: string; prerequisites: string[]; restart_or_outage: string;
  rollback: string; evidence_claim_ids: string[];
}

export interface CompositeTicket {
  remediation_id: string;
  type: 'investigation_and_configuration_ticket';
  title: string;
  target: string;
  fixed_target: null;
  fixed_build: null;
  patch_action_authorized: boolean;
  ticket_path: string;
  owners: {
    ticket: string; identity: string; data: string;
    incident: string; business: string; due_date: string;
  };
  ordered_phases: string[];
  restart_or_outage: string;
  rollback: string;
  evidence_claim_ids: string[];
}

export const isCompositeTicket = (r: RemediationEntry): r is CompositeTicket =>
  'ordered_phases' in r;

export interface Verification {
  verification_id: string; scope: string; acceptance_test: string; expected_result: string;
}

export interface Source {
  source_id: string; publisher: string; authority_class: string;
  url: string; canonical_url: string; retrieved_at: string;
  http_status: number; availability: string; freshness: string; artifact_id: string;
}

export interface Artifact {
  artifact_id: string; path: string; media_type: string;
  sha256: string; bytes: number; immutable: boolean;
}

export interface TeamMission {
  mission_id: string;
  team: string;
  status: string;
  started_at: string;
}

export interface Budgets {
  max_parallel_specialist_runs: number; max_reference_depth: number;
  max_team_waves: number; zero_delta_limit_per_shard: number;
  team_waves_used: number; specialist_runs_used: number;
}

export interface Decision { decision_id: string; decision: string; rationale: string; at: string; }
export interface FrontierNode { frontier_id: string; url: string; depth: number; priority: string; status: string; reason: string; }
export interface ReferenceEdge { edge_id: string; from_source_id: string; to_source_id: string; relation: string; depth: number; original_edge_status: string; repair_rationale: string; }

// === Workflows, Notifications, Board Brief ===

export interface CaseSummary {
  case_id: string;
  priority: Priority;
  title: string;
  workflow_state: WorkflowState;
  phase: string;
  assets: { total: number; affected: number; under_investigation: number; };
  coverage: { identity: number; sources: number; composite: number; };
  applicability: { score: number; };
  open_blockers: number;
  analyst_verdict: string | null;
  assigned_to: string | null;
  age_days: number;
}

export interface Ticket {
  ticket_id: string;
  case_id: string;
  title: string;
  priority: Priority;
  workflow_state: WorkflowState;
  assigned_to: string | null;
  assigned_by: string | null;
  change_window: string | null;
  phase_progress: { current: number; total: number; };
}

export interface Approval {
  approval_id: string;
  case_id: string;
  type: 'gate1_ticket' | 'gate2_containment' | 'final_signoff' | 'risk_acceptance';
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  requested_at: string;
}

export interface ExecutionStep {
  remediation_id: string;
  status: 'pending' | 'done' | 'blocked' | 'skipped';
  note: string | null;
  executed_at: string | null;
  executed_by: string | null;
}

export interface VerificationResult {
  verification_id: string;
  status: 'pending' | 'pass' | 'fail';
  observed_value: string | null;
  executed_at: string | null;
  executed_by: string | null;
}

export interface AnalystRecommendation {
  case_id: string;
  verdict: 'proceed' | 'need_more_evidence' | 'not_applicable' | 'risk_accept';
  confidence: number;
  summary: string;
  cited_claim_ids: string[];
  contradictions_addressed: string[];
  residual_gaps: string[];
  remediation_ids: string[];
  escalate_to_executive: boolean;
}

export interface CaseEventIntent {
  event_type: string;
  payload: Record<string, unknown>;
  actor: string;
  timestamp: string;
}

export type NotificationTrigger =
  | 'ticket_assigned' | 'gate1_requested' | 'gate2_requested' | 'final_signoff_requested'
  | 'approval_granted' | 'approval_rejected' | 'analyst_escalated' | 'analyst_returned'
  | 'verification_failed' | 'ticket_blocked' | 'reinvocation_requested' | 'reinvocation_complete'
  | 'dormant_recheck';

export interface Notification {
  notification_id: string;
  trigger: NotificationTrigger | string;
  actor: string;
  target_role: Role | 'all';
  case_id: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
  route: string;
}

export interface BriefSection {
  title: string;
  content: string;
  edited_by: string | null;
}

export interface BoardBrief {
  brief_id: string;
  period: string;
  status: 'draft' | 'frozen';
  sections: {
    posture: BriefSection;
    duty_of_care: BriefSection;
    unknowns: BriefSection;
    decisions: BriefSection;
    ask: BriefSection;
  };
  frozen_at: string | null;
  ledger_head_version: number | null;
  attested_by: string | null;
}
