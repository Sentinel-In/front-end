import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { seededTickets } from '../../mock/workflowFixtures';
import { ClipboardList, Clock, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRoleStore } from '../../store/useRoleStore';
import { selectEngineerTickets } from '../../selectors/rbac';

export function EngineerTasksPage() {
  const engineerId = useRoleStore((state) => state.getIdentity().id);
  const engineerTickets = selectEngineerTickets(seededTickets, engineerId);
  
  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: '24px' }}>
        <ClipboardList style={{ color: 'var(--color-text-muted)' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text)' }}>My Tasks</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {engineerTickets.map(t => (
          <Link key={t.ticket_id} to={`/tasks/${t.ticket_id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer', transition: 'border-color 0.2s', border: '1px solid var(--color-border)' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
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
              
              <div style={{ marginTop: 'auto' }}>
                <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  <span>Phase Progress</span>
                  <span>{t.phase_progress.current} / {t.phase_progress.total} Steps</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--color-surface-3)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ width: `${(t.phase_progress.current / t.phase_progress.total) * 100}%`, height: '100%', background: 'var(--color-accent)' }} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
                    <Clock size={12} /> {t.change_window || 'Unscheduled'}
                  </div>
                  
                  {t.workflow_state === 'awaiting_approval' && (
                    <div className="flex items-center gap-1" style={{ fontSize: '11px', color: 'var(--color-warning)' }}>
                      <Lock size={12} /> Gate 1 Blocked
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
