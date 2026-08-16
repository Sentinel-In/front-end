import { useEffect } from 'react';
import { useCaseIndexStore } from '../../store/useCaseIndexStore';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { useAppStore } from '../../store/useAppStore';
import { seededRecommendations } from '../../mock/workflowFixtures';
import { Play, CornerUpRight, PauseCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { selectLeadCases } from '../../selectors/rbac';

export function TriagePage() {
  const { cases, fetchCases, filterPriority, filterPhase, setFilterPriority } = useCaseIndexStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const leadCases = selectLeadCases(cases);
  const filteredCases = leadCases.filter(c => {
    if (filterPriority && c.priority !== filterPriority) return false;
    if (filterPhase && c.phase !== filterPhase) return false;
    return true;
  });

  const p0 = leadCases.filter(c => c.priority === 'P0').length;
  const p1 = leadCases.filter(c => c.priority === 'P1').length;
  const p2 = leadCases.filter(c => c.priority === 'P2').length;
  const p3 = leadCases.filter(c => c.priority === 'P3').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>Triage Hub</h1>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button onClick={() => setFilterPriority(filterPriority === 'P0' ? null : 'P0')} style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--color-border)', background: filterPriority === 'P0' ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: '13px', cursor: 'pointer' }}>P0 ({p0})</button>
          <button onClick={() => setFilterPriority(filterPriority === 'P1' ? null : 'P1')} style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--color-border)', background: filterPriority === 'P1' ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: '13px', cursor: 'pointer' }}>P1 ({p1})</button>
          <button onClick={() => setFilterPriority(filterPriority === 'P2' ? null : 'P2')} style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--color-border)', background: filterPriority === 'P2' ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: '13px', cursor: 'pointer' }}>P2 ({p2})</button>
          <button onClick={() => setFilterPriority(filterPriority === 'P3' ? null : 'P3')} style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--color-border)', background: filterPriority === 'P3' ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: '13px', cursor: 'pointer' }}>P3 ({p3})</button>
        </div>

        {/* List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredCases.map(c => (
            <div 
              key={c.case_id} 
              style={{ display: 'grid', gridTemplateColumns: '80px 140px 1fr 100px 100px 100px 120px', gap: '16px', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate(`/reports/asset-impact/${c.case_id}`)}
            >
              <PriorityBadge priority={c.priority} rule={undefined} explanation={""} />
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text)' }}>{c.case_id}</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>{c.phase}</div>
              <div>
                <div style={{ height: '4px', width: '100%', background: 'var(--color-surface-3)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(c.assets.affected / Math.max(c.assets.total, 1)) * 100}%`, background: 'var(--color-critical)' }} />
                  <div style={{ width: `${(c.assets.under_investigation / Math.max(c.assets.total, 1)) * 100}%`, background: 'var(--color-warning)' }} />
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Assets</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>{c.workflow_state.replace(/_/g, ' ')}</div>
              <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                <ActionButtons caseId={c.case_id} state={c.workflow_state} />
              </div>
            </div>
          ))}
          {filteredCases.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No cases match the filters.</div>
          )}
        </div>
      </div>

      {/* Right Rail */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>Returned from Analyst</h2>
        <div className="flex flex-col gap-4">
          {seededRecommendations.map(rec => (
            <div key={rec.case_id} className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{rec.case_id}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }}>
                  {rec.verdict.replace(/_/g, ' ')}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.5, margin: '0 0 16px' }}>
                {rec.summary}
              </p>
              <button style={{ width: '100%', padding: '8px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Act on Recommendation
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionButtons({ caseId, state }: { caseId: string, state: string }) {
  const openModal = useAppStore(s => s.openModal);

  const openApprove = () => openModal({ id: 'approve-assign', title: 'Approve & Assign', component: 'ApproveAssignModal', props: { caseId } });
  const openEscalate = () => openModal({ id: 'escalate', title: 'Escalate to Analyst', component: 'EscalateModal', props: { caseId } });

  if (state === 'awaiting_approval') {
    return (
      <>
        <button onClick={openApprove} title="Approve & Assign" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-safe)' }}><Play size={16} /></button>
        <button onClick={openEscalate} title="Escalate" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-warning)' }}><CornerUpRight size={16} /></button>
      </>
    );
  }
  
  if (state === 'escalated_to_analyst') {
    return <span style={{ fontSize: '11px', color: 'var(--color-warning)' }}>Awaiting Analyst</span>;
  }

  return (
    <>
      <button title="Park Dormant" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><PauseCircle size={16} /></button>
    </>
  );
}
