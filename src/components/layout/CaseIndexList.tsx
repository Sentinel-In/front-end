import { useEffect } from 'react';
import { useCaseIndexStore } from '../../store/useCaseIndexStore';
import { PriorityBadge } from '../shared/PriorityBadge';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CaseIndexList() {
  const { cases, isLoading, error, fetchCases } = useCaseIndexStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  if (isLoading) {
    return <div style={{ padding: '24px', color: 'var(--color-text-dim)' }}>Loading case index...</div>;
  }

  if (error) {
    return <div style={{ padding: '24px', color: 'var(--color-error)' }}>Error: {error}</div>;
  }

  if (cases.length === 0) {
    return <div style={{ padding: '24px', color: 'var(--color-text-dim)' }}>No cases found.</div>;
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>Case Index</h2>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {cases.map((c) => (
          <button
            key={c.case_id}
            onClick={() => {
              import('../../store/useRoleStore').then(({ useRoleStore }) => {
                const config = useRoleStore.getState().getConfig();
                const baseRoute = config.landingRoute === '/dashboard' || config.landingRoute === '/triage' 
                  ? '/reports/asset-impact' 
                  : config.landingRoute === '/audit' 
                  ? '/audit'
                  : '/tasks';
                navigate(`${baseRoute}/${c.case_id}`);
              });
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto auto',
              gap: '16px',
              alignItems: 'center',
              padding: '12px 20px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottomWidth: '1px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.2s',
            }}
            className="hover-bg"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{ minWidth: '80px' }}>
              <PriorityBadge priority={c.priority} rule={undefined} explanation={""} />
            </div>
            
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
                  {c.case_id}
                </span>
                <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--color-surface-3)', color: 'var(--color-text-muted)' }}>
                  {c.phase}
                </span>
                {c.workflow_state !== 'dormant' && c.workflow_state !== 'verified' && c.workflow_state !== 'unassigned' && (
                  <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                    {c.workflow_state.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.title}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', textAlign: 'right' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '2px', textTransform: 'uppercase' }}>Assets</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                  <span style={{ color: c.assets.affected > 0 ? 'var(--color-error)' : 'inherit' }}>{c.assets.affected}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}> / {c.assets.total}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '2px', textTransform: 'uppercase' }}>Coverage</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                  {c.coverage.composite}% / {c.applicability.score}%
                </div>
              </div>
            </div>
            
            <ChevronRight size={16} color="var(--color-text-muted)" />
          </button>
        ))}
      </div>
    </div>
  );
}
