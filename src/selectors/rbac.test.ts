import { describe, expect, it } from 'vitest';
import type { CaseSummary, Ticket } from '../types';
import { seededTickets } from '../mock/workflowFixtures';
import {
  getAuthoritativeRole,
  selectAnalystCases,
  selectEngineerTickets,
  selectLeadCases,
} from './rbac';

const cases = [
  { case_id: 'active', workflow_state: 'triage', assigned_to: null },
  { case_id: 'analyst-mine', workflow_state: 'escalated_to_analyst', assigned_to: 'analyst-1' },
  { case_id: 'analyst-other', workflow_state: 'escalated_to_analyst', assigned_to: 'analyst-2' },
  { case_id: 'dormant', workflow_state: 'dormant', assigned_to: null },
  { case_id: 'verified', workflow_state: 'verified', assigned_to: null },
] as CaseSummary[];

describe('RBAC selectors', () => {
  it('keeps dormant and verified cases out of the Lead active queue', () => {
    expect(selectLeadCases(cases).map((item) => item.case_id)).toEqual([
      'active', 'analyst-mine', 'analyst-other',
    ]);
  });

  it('returns only escalations assigned to the current Analyst', () => {
    expect(selectAnalystCases(cases, 'analyst-1').map((item) => item.case_id)).toEqual([
      'analyst-mine',
    ]);
  });

  it('returns only the Engineer own active tickets', () => {
    const anotherEngineer = {
      ...seededTickets[1],
      ticket_id: 'ticket-other',
      assigned_to: 'engineer-2',
    } as Ticket;
    expect(selectEngineerTickets([...seededTickets, anotherEngineer], 'engineer-1').map((ticket) => ticket.ticket_id)).toEqual([
      'ticket-39-1',
    ]);
  });

  it('names the authoritative role for locked controls', () => {
    expect(getAuthoritativeRole('canApproveP0')).toBe('executive');
    expect(getAuthoritativeRole('canAuthorizeContainment')).toBe('lead_manager');
    expect(getAuthoritativeRole('canResolveContradiction')).toBe('risk_analyst');
    expect(getAuthoritativeRole('canExecuteRunbook')).toBe('engineer');
  });
});
