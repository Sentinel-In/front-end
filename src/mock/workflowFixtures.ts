import type { Ticket, Approval, AnalystRecommendation, BoardBrief, Notification } from '../types';

export const seededTickets: Ticket[] = [
  {
    ticket_id: 'ticket-41-1',
    case_id: 'CIAD-2026-0041',
    title: 'Block Legacy Authentication and Revoke Credentials',
    priority: 'P0',
    workflow_state: 'awaiting_approval',
    assigned_to: null,
    assigned_by: null,
    change_window: null,
    phase_progress: { current: 0, total: 4 },
  },
  {
    ticket_id: 'ticket-39-1',
    case_id: 'CIAD-2026-0039',
    title: 'Contain OAuth Application Abuse and Restrict ROPC',
    priority: 'P1',
    workflow_state: 'phase1_in_execution',
    assigned_to: 'engineer-1',
    assigned_by: 'lead-1',
    change_window: 'Emergency',
    phase_progress: { current: 3, total: 4 },
  },
];

export const seededApprovals: Approval[] = [
  {
    approval_id: 'apprv-41-1',
    case_id: 'CIAD-2026-0041',
    type: 'gate1_ticket',
    status: 'pending',
    requested_by: 'lead-1',
    requested_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const seededRecommendations: AnalystRecommendation[] = [
  {
    case_id: 'CIAD-2026-0044',
    verdict: 'need_more_evidence',
    confidence: 0.8,
    summary: 'The scope of identity federation vulnerability is unclear. We need more logs from the tenant boundary.',
    cited_claim_ids: ['claim-cert-service-scope', 'claim-cert-impact'],
    contradictions_addressed: [],
    residual_gaps: [],
    remediation_ids: [],
    escalate_to_executive: false,
  },
];

export const seededBoardBrief: BoardBrief = {
  brief_id: 'brief-q2-2026',
  period: 'Q2 2026',
  status: 'frozen',
  sections: {
    posture: { title: 'Posture', content: 'Our security posture improved following the mitigation of CIAD-2026-0046 (clean baseline confirmed).', edited_by: 'executive-1' },
    duty_of_care: { title: 'Duty of Care', content: 'We responded to CIAD-2026-0037. While currently parked dormant, monitoring remains armed.', edited_by: 'executive-1' },
    unknowns: { title: 'Unknowns', content: 'Residual risk exists around device code phishing variants.', edited_by: 'executive-1' },
    decisions: { title: 'Decisions', content: 'Accepted risk for limited legacy auth on specific legacy scanners.', edited_by: 'executive-1' },
    ask: { title: 'Ask', content: 'Approve Q3 budget for zero-trust migration.', edited_by: 'executive-1' },
  },
  frozen_at: '2026-07-01T00:00:00Z',
  ledger_head_version: 124,
  attested_by: 'executive-1',
};

export const seededNotifications: Notification[] = [
  {
    notification_id: 'notif-1',
    trigger: 'gate1_requested',
    actor: 'lead-manager',
    target_role: 'executive',
    case_id: 'CIAD-2026-0041',
    title: 'Executive Approval Required',
    message: 'CIAD-2026-0041 requires Gate 1 approval to proceed to containment.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read_at: null,
    route: '/dashboard',
  },
  {
    notification_id: 'notif-2',
    trigger: 'analyst_returned',
    actor: 'risk-analyst',
    target_role: 'lead_manager',
    case_id: 'CIAD-2026-0044',
    title: 'Recommendation Returned',
    message: 'Analyst requested more evidence for CIAD-2026-0044.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    read_at: null,
    route: '/triage',
  },
];
