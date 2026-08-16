import { useEffect } from 'react';
import { useCaseIndexStore } from '../../store/useCaseIndexStore';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { CheckSquare, AlertTriangle } from 'lucide-react';
import { selectLeadCases } from '../../selectors/rbac';

export function LeadTicketsPage() {
  const { cases, fetchCases } = useCaseIndexStore();
  const leadCases = selectLeadCases(cases);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Group by workflow state
  const columns = [
    { id: 'unassigned', title: 'Unassigned' },
    { id: 'assigned', title: 'Assigned' },
    { id: 'awaiting_approval', title: 'Needs Approval' },
    { id: 'escalated_to_analyst', title: 'With Analyst' }
  ];

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: '24px' }}>
        <CheckSquare style={{ color: 'var(--color-text-muted)' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text)' }}>Tickets & Oversight</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: '16px', flex: 1, minHeight: 0 }}>
        {columns.map(col => {
          const colCases = leadCases.filter(c => c.workflow_state === col.id);
          
          return (
            <div key={col.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-surface-2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', textTransform: 'uppercase' }}>{col.title}</h3>
                <span style={{ fontSize: '12px', background: 'var(--color-surface-3)', padding: '2px 8px', borderRadius: '12px', color: 'var(--color-text-muted)' }}>
                  {colCases.length}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                {colCases.map(c => (
                  <div key={c.case_id} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '12px' }}>
                    <div className="flex items-start justify-between" style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text)' }}>{c.case_id}</span>
                      <PriorityBadge priority={c.priority} rule={undefined} explanation={""} />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '12px', lineHeight: 1.4 }}>
                      {c.title}
                    </div>
                    
                    {c.priority === 'P0' && (
                      <div className="flex items-center gap-1" style={{ fontSize: '11px', color: 'var(--color-critical)', marginTop: '8px' }}>
                        <AlertTriangle size={12} /> Overdue / Blocked
                      </div>
                    )}
                  </div>
                ))}
                {colCases.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '13px' }}>
                    No cases
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
