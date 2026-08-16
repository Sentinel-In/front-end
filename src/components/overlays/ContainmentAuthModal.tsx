import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { ShieldAlert, HardDrive, Shield } from 'lucide-react';

export function ContainmentAuthModal({ ticketId, caseId }: { ticketId: string, caseId: string }) {
  const closeModal = useAppStore(s => s.closeModal);
  const openModal = useAppStore(s => s.openModal);
  const grantContainmentAuth = useWorkflowStore(s => s.grantContainmentAuth);
  const bb = useBlackboardStore(s => s.blackboard);

  const [rationale, setRationale] = useState('');

  if (!bb || bb.case.case_id !== caseId) {
    return <div style={{ padding: '24px' }}>Loading case data...</div>;
  }

  const phase2Rems = bb.remediation.filter(r => !r.remediation_id.includes('recon') && !r.remediation_id.includes('investigate'));

  const handleApprove = () => {
    if (rationale.trim().length < 5) return;
    const intent = grantContainmentAuth(ticketId, rationale);
    closeModal();
    openModal({
      id: 'case-event-intent-modal',
      title: 'Intent Preview',
      component: 'CaseEventIntentModal',
      props: { intent, onConfirm: () => {} }
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      
      <div style={{ padding: '16px', background: 'color-mix(in srgb, var(--color-critical) 10%, transparent)', border: '1px solid var(--color-critical)', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <ShieldAlert size={20} style={{ color: 'var(--color-critical)', marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-critical)', marginBottom: '4px', textTransform: 'uppercase' }}>High Friction Control: Gate 2</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: 1.5 }}>
            You are authorizing containment execution. This action will be logged on the immutable ledger. 
            Once executed, restoring previous state may require emergency rollback procedures.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={14} style={{ color: 'var(--color-safe)' }} /> Phase 1 Findings
        </h4>
        <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: '6px', fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.5 }}>
          Engineer A. Patel confirmed that the target is currently vulnerable and the pre-flight checks are complete. Outage risk is acknowledged.
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>Authorized Phase 2 Actions</h4>
        <div className="flex flex-col gap-3">
          {phase2Rems.map((rem: any) => (
            <div key={rem.remediation_id} style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-surface-2)' }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{rem.action || rem.title || 'Action'}</span>
                {rem.restart_or_outage !== 'none' && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--color-critical)', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HardDrive size={10} /> OUTAGE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Containment Rationale</h4>
        <textarea 
          placeholder="State the justification for executing containment..."
          value={rationale}
          onChange={e => setRationale(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '80px', fontSize: '13px', resize: 'vertical' }}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => closeModal()} className="btn-secondary">Cancel</button>
        <button onClick={handleApprove} className="btn-primary" disabled={rationale.trim().length < 5}>
          Grant Gate 2 Auth
        </button>
      </div>
    </div>
  );
}
