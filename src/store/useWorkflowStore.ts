/* ============================================================
   Workflow Store — SPEC-003 §6 + SPEC-004
   Holds: tickets, approvals, recommendations, riskAcceptances, pendingEvents.
   Every mutating action returns a CaseEventIntent.
   Every mutating action asserts its capability and throws if missing.
   ============================================================ */

import { create } from 'zustand';
import { useRoleStore } from './useRoleStore';
import { useNotificationStore } from './useNotificationStore';
import { useAppStore } from './useAppStore';
import type { Ticket, Approval, AnalystRecommendation, CaseEventIntent, RoleCapability } from '../types';
import { ROUTES } from '../routes';

interface WorkflowState {
  tickets: Ticket[];
  approvals: Approval[];
  recommendations: AnalystRecommendation[];
  riskAcceptances: any[];
  pendingEvents: CaseEventIntent[];
}

interface WorkflowActions {
  // Phase 3 & 4 actions (Lead / Exec)
  requestApproval: (caseId: string) => CaseEventIntent;
  grantApproval: (approvalId: string, rationale: string) => CaseEventIntent;
  escalateToAnalyst: (caseId: string, question: string) => CaseEventIntent;
  parkDormant: (caseId: string, reason: string) => CaseEventIntent;
  assignTicket: (ticketId: string, engineerId: string, changeWindow: string) => CaseEventIntent;
  
  // Phase 4 actions (Engineer / Lead)
  requestContainmentAuth: (ticketId: string) => CaseEventIntent;
  grantContainmentAuth: (ticketId: string, rationale: string) => CaseEventIntent;
  recordExecutionStep: (ticketId: string, remediationId: string, status: string, note: string) => CaseEventIntent;
  recordVerificationResult: (ticketId: string, verificationId: string, status: string, value: string) => CaseEventIntent;
  signFinalAcceptance: (ticketId: string) => CaseEventIntent;
  
  // Phase 6 actions (Analyst)
  submitRecommendation: (rec: AnalystRecommendation) => CaseEventIntent;
  resolveContradiction: (id: string, resolution: string, rationale: string, cited: string[]) => CaseEventIntent;
  escalateContradiction: (id: string, rationale: string) => CaseEventIntent;
  assessAssetApplicability: (id: string, state: string, confidence: number, rationale: string, cited: string[]) => CaseEventIntent;
  recordResidualGap: (id: string, rationale: string) => CaseEventIntent;
  requestReinvocation: (urls: string[], reason: string, gain: string, budget: number) => CaseEventIntent;

  // Generic
  acceptRisk: (caseId: string, rationale: string) => CaseEventIntent;
  commitEvent: (intent: CaseEventIntent) => void;
}

function createIntent(eventType: string, payload: Record<string, unknown>): CaseEventIntent {
  const actor = useRoleStore.getState().getIdentity().name;
  return {
    event_type: eventType,
    payload,
    actor,
    timestamp: new Date().toISOString(),
  };
}

function assertCapability(cap: RoleCapability, errorMessage: string) {
  const caps = useRoleStore.getState().getCapabilities();
  if (!caps[cap]) {
    throw new Error(`Capability Denied: ${errorMessage} requires ${cap}`);
  }
}

function assertAnyCapability(capabilities: RoleCapability[], errorMessage: string) {
  const caps = useRoleStore.getState().getCapabilities();
  if (!capabilities.some((capability) => caps[capability])) {
    throw new Error(`Capability Denied: ${errorMessage} requires ${capabilities.join(' or ')}`);
  }
}

export const useWorkflowStore = create<WorkflowState & WorkflowActions>()((set) => ({
  tickets: [],
  approvals: [],
  recommendations: [],
  riskAcceptances: [],
  pendingEvents: [],

  // --- Lead & Exec ---
  requestApproval: (caseId) => {
    assertCapability('canEscalate', 'Request approval');
    return createIntent('ticket.approval_requested', { caseId });
  },
  grantApproval: (approvalId, rationale) => {
    assertAnyCapability(['canApproveP0', 'canApproveRoutine'], 'Grant approval');
    return createIntent('ticket.approval_granted', { approvalId, rationale });
  },
  escalateToAnalyst: (caseId, question) => {
    assertCapability('canEscalate', 'Escalate to analyst');
    return createIntent('case.escalated_to_analyst', { caseId, question });
  },
  parkDormant: (caseId, reason) => {
    assertCapability('canApproveRoutine', 'Park dormant');
    return createIntent('case.parked_dormant', { caseId, reason });
  },
  assignTicket: (ticketId, engineerId, changeWindow) => {
    assertCapability('canAssignTicket', 'Assign ticket');
    return createIntent('ticket.assigned', { ticketId, engineerId, changeWindow });
  },

  // --- Engineer ---
  requestContainmentAuth: (ticketId) => {
    // Engineer has no special capabilities, so just checking role manually or assuming Engineer can do this
    assertCapability('canExecuteRunbook', 'Request containment auth');
    return createIntent('ticket.containment_auth_requested', { ticketId });
  },
  recordExecutionStep: (ticketId, remediationId, status, note) => {
    assertCapability('canExecuteRunbook', 'Record execution');
    return createIntent('ticket.execution_recorded', { ticketId, remediationId, status, note });
  },
  recordVerificationResult: (ticketId, verificationId, status, value) => {
    assertCapability('canRecordVerification', 'Record verification');
    return createIntent('ticket.verification_recorded', { ticketId, verificationId, status, value });
  },

  // --- Lead ---
  grantContainmentAuth: (ticketId, rationale) => {
    assertCapability('canAuthorizeContainment', 'Grant containment auth');
    return createIntent('ticket.containment_auth_granted', { ticketId, rationale });
  },
  signFinalAcceptance: (ticketId) => {
    assertCapability('canApproveRoutine', 'Sign final acceptance');
    return createIntent('ticket.accept_final_state', { ticketId });
  },

  // --- Analyst ---
  submitRecommendation: (rec) => {
    assertCapability('canAuthorRecommendation', 'Submit recommendation');
    if (!rec.cited_claim_ids || rec.cited_claim_ids.length === 0) {
      throw new Error('Recommendation must cite at least one claim');
    }
    return createIntent('recommendation.submitted', rec as unknown as Record<string, unknown>);
  },
  resolveContradiction: (id, resolution, rationale, cited) => {
    assertCapability('canResolveContradiction', 'Resolve contradiction');
    if (cited.length === 0) throw new Error('Must cite at least one claim');
    return createIntent('contradiction.resolved', { contradiction_id: id, resolution, rationale, cited_claim_ids: cited });
  },
  escalateContradiction: (id, rationale) => {
    assertCapability('canResolveContradiction', 'Escalate contradiction');
    return createIntent('contradiction.escalated', { contradiction_id: id, rationale });
  },
  assessAssetApplicability: (id, state, confidence, rationale, cited) => {
    assertCapability('canAuthorRecommendation', 'Assess asset');
    if (cited.length === 0) throw new Error('Must cite at least one claim');
    return createIntent('asset.applicability_assessed', { asset_id: id, proposed_state: state, confidence, rationale, cited_claim_ids: cited });
  },
  recordResidualGap: (id, rationale) => {
    assertCapability('canAuthorRecommendation', 'Record gap');
    return createIntent('gap.confirmed_open', { gap_id: id, rationale });
  },
  requestReinvocation: (urls, reason, gain, budget) => {
    assertCapability('canRequestReinvocation', 'Request reinvocation');
    return createIntent('frontier.expansion_requested', { urls, reason, expected_gain: gain, budget_requested: budget });
  },

  // --- Exec/Lead ---
  acceptRisk: (caseId, rationale) => {
    assertCapability('canApproveP0', 'Accept risk');
    return createIntent('case.risk_accepted', { caseId, rationale });
  },

  commitEvent: (intent) => {
    set((state) => ({ pendingEvents: [...state.pendingEvents, intent] }));
    
    // Notification logic
    const { addNotification } = useNotificationStore.getState();
    const { pushToast } = useAppStore.getState();
    const currentRole = useRoleStore.getState().role;
    const actor = intent.actor;
    
    let target_role: any = 'all';
    let title = '';
    let message = '';
    let route = '';
    const caseId = (intent.payload as any).caseId || (intent.payload as any).case_id || 'Unknown Case';

    switch (intent.event_type) {
      case 'ticket.approval_requested':
        target_role = 'executive';
        title = 'Executive Approval Required';
        message = 'A case requires Gate 1 approval to proceed to containment.';
        route = '/dashboard';
        break;
      case 'case.escalated_to_analyst':
        target_role = 'risk_analyst';
        title = 'Case Escalated';
        message = `Lead Manager asked: ${(intent.payload as any).question}`;
        route = ROUTES.alerts;
        break;
      case 'ticket.assigned':
        target_role = 'engineer';
        title = 'New Task Assigned';
        message = 'You have been assigned a new runbook task.';
        route = '/tasks';
        break;
      case 'ticket.containment_auth_requested':
        target_role = 'lead_manager';
        title = 'Containment Auth Requested';
        message = 'Engineer requested Gate 2 authorization to begin disruptive actions.';
        route = '/tickets';
        break;
      case 'ticket.containment_auth_granted':
        target_role = 'engineer';
        title = 'Containment Auth Granted';
        message = 'Gate 2 passed. You may proceed with Phase 2 actions.';
        route = `/tasks/${(intent.payload as any).ticketId}`;
        break;
      case 'recommendation.submitted':
        target_role = 'lead_manager';
        title = 'Recommendation Returned';
        message = 'Risk Analyst returned a recommendation for your review.';
        route = '/triage';
        break;
      case 'ticket.accept_final_state':
        target_role = 'all';
        title = 'Case Closed';
        message = 'Final signoff completed.';
        route = '/triage';
        break;
      default:
        // Other events may not need explicit notifications
        return;
    }

    if (title) {
      addNotification({
        trigger: intent.event_type,
        actor,
        target_role,
        case_id: caseId,
        title,
        message,
        route,
      });

      if (target_role === 'all' || target_role === currentRole) {
        pushToast({
          type: 'info',
          message: title,
          duration: 4000,
        });
      }
    }
  },
}));
