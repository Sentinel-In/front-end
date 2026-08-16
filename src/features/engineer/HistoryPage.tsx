import { ClipboardCheck } from 'lucide-react';
import { seededTickets } from '../../mock/workflowFixtures';
import { useRoleStore } from '../../store/useRoleStore';
import { selectEngineerHistory } from '../../selectors/rbac';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { Link } from 'react-router-dom';

export function HistoryPage() {
  const engineerId = useRoleStore((state) => state.getIdentity().id);
  const historyTickets = selectEngineerHistory(seededTickets, engineerId);
  
  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: '24px' }}>
        <ClipboardCheck style={{ color: 'var(--color-text-muted)' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text)' }}>Execution History</h1>
      </div>

      {historyTickets.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
          No completed or returned tickets in your history.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {historyTickets.map(t => (
            <Link key={t.ticket_id} to={`/tasks/${t.ticket_id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer', transition: 'border-color 0.2s', border: '1px solid var(--color-border)' }}>
                <div className="flex justify-between items-start" style={{ marginBottom: '12px' }}>
                  <PriorityBadge priority={t.priority} rule={undefined} explanation={""} />
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{t.ticket_id}</div>
                </div>
                
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {t.title}
                </h3>
                
                <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '16px' }}>
                  Case: <span style={{ fontFamily: 'var(--font-mono)' }}>{t.case_id}</span>
                </div>
                
                <div style={{ marginTop: 'auto', padding: '12px', borderRadius: '6px', 
                  background: t.workflow_state === 'verified' ? 'color-mix(in srgb, var(--color-safe) 15%, transparent)' : 'color-mix(in srgb, var(--color-critical) 15%, transparent)',
                  color: t.workflow_state === 'verified' ? 'var(--color-safe)' : 'var(--color-critical)',
                  fontSize: '12px', fontWeight: 500
                }}>
                  {t.workflow_state === 'verified' ? 'Verified & Closed' : 'Failed Signoff / Returned'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
