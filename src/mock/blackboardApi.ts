import type { Blackboard, CaseSummary, WorkflowState } from '../types';
import { seededCases } from './caseFactory';
import { derivePriority } from '../selectors/priority';
import { compositeCoverage } from '../selectors/coverage';

const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to determine workflow state from mocked data or fallback
function getWorkflowStateForDemo(caseId: string): WorkflowState {
  switch (caseId) {
    case 'CIAD-2026-0041': return 'awaiting_approval';
    case 'CIAD-2026-0039': return 'phase1_in_execution';
    case 'CIAD-2026-0037': return 'dormant';
    case 'CIAD-2026-0044': return 'escalated_to_analyst';
    case 'CIAD-2026-0046': return 'verified';
    default: return 'unassigned';
  }
}

export const blackboardApi = {
  async getBlackboard(caseId: string): Promise<Blackboard> {
    const ms = Math.floor(Math.random() * 300) + 200;
    await delay(ms);
    const found = seededCases.find((c) => c.case.case_id === caseId);
    if (!found) throw new Error(`Case ${caseId} not found`);
    return found;
  },

  async listCases(): Promise<CaseSummary[]> {
    await delay(200);
    return seededCases.map((bb) => {
      const priorityRes = derivePriority(bb);
      const total = bb.assets?.length || 0;
      const affected = bb.assets?.filter(a => a.applicability === 'affected').length || 0;
      const under_investigation = bb.assets?.filter(a => a.applicability === 'under_investigation').length || 0;
      
      return {
        case_id: bb.case.case_id,
        title: bb.advisory.title,
        priority: priorityRes.priority,
        workflow_state: getWorkflowStateForDemo(bb.case.case_id),
        phase: bb.case.derived_phase,
        assets: { total, affected, under_investigation },
        coverage: {
          identity: bb.coverage?.identity ?? 0,
          sources: bb.coverage?.sources ?? 0,
          composite: compositeCoverage(bb),
        },
        applicability: { score: bb.coverage?.applicability ?? 0 },
        open_blockers: bb.blockers?.filter(b => b.status === 'open').length || 0,
        analyst_verdict: bb.case.case_id === 'CIAD-2026-0044' ? 'need_more_evidence' : null,
        assigned_to: bb.case.case_id === 'CIAD-2026-0044' ? 'risk-analyst-1' : null,
        age_days: Math.floor((Date.now() - new Date(bb.case.created_at).getTime()) / (1000 * 3600 * 24)),
      };
    });
  }
};
