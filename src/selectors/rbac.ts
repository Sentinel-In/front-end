import type { CaseSummary, Notification, Role, RoleCapability, Ticket } from '../types';

const LEAD_EXCLUDED_STATES = new Set(['dormant', 'verified']);
const ENGINEER_ACTIVE_STATES = new Set([
  'assigned_to_engineer',
  'phase1_in_execution',
  'awaiting_containment_auth',
  'phase2_in_execution',
  'awaiting_verification',
]);
const ENGINEER_HISTORY_STATES = new Set(['verified', 'rejected', 'returned_to_lead']);

export function selectPortfolioCases(cases: CaseSummary[]): CaseSummary[] {
  return cases;
}

export function selectLeadCases(cases: CaseSummary[]): CaseSummary[] {
  return cases.filter((item) => !LEAD_EXCLUDED_STATES.has(item.workflow_state));
}

export function selectAnalystCases(cases: CaseSummary[], analystId: string): CaseSummary[] {
  return cases.filter((item) =>
    item.workflow_state === 'escalated_to_analyst' && item.assigned_to === analystId,
  );
}

export function selectEngineerTickets(tickets: Ticket[], engineerId: string): Ticket[] {
  return tickets.filter((ticket) =>
    ticket.assigned_to === engineerId && ENGINEER_ACTIVE_STATES.has(ticket.workflow_state),
  );
}

export function selectEngineerHistory(tickets: Ticket[], engineerId: string): Ticket[] {
  return tickets.filter((ticket) =>
    ticket.assigned_to === engineerId && ENGINEER_HISTORY_STATES.has(ticket.workflow_state),
  );
}

export function selectNotificationsForRole(notifications: Notification[], role: Role): Notification[] {
  return notifications.filter((notification) =>
    notification.target_role === role || notification.target_role === 'all',
  );
}

export const AUTHORITATIVE_ROLE_BY_CAPABILITY: Record<RoleCapability, Role> = {
  canViewPortfolio: 'executive',
  canViewRawEvidence: 'risk_analyst',
  canViewEvidenceGraph: 'risk_analyst',
  canApproveP0: 'executive',
  canApproveRoutine: 'lead_manager',
  canAuthorizeContainment: 'lead_manager',
  canEscalate: 'lead_manager',
  canAuthorRecommendation: 'risk_analyst',
  canResolveContradiction: 'risk_analyst',
  canAssignTicket: 'lead_manager',
  canExecuteRunbook: 'engineer',
  canRecordVerification: 'engineer',
  canRequestReinvocation: 'risk_analyst',
  canExportBrief: 'executive',
};

export function getAuthoritativeRole(capability: RoleCapability): Role {
  return AUTHORITATIVE_ROLE_BY_CAPABILITY[capability];
}
