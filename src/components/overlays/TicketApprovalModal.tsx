import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { AlertTriangle, HardDrive } from 'lucide-react';

export function TicketApprovalModal({ approvalId, caseId }: { approvalId: string, caseId: string }) {
  const closeModal = useAppStore(s => s.closeModal);
  const openModal = useAppStore(s => s.openModal);
  const grantApproval = useWorkflowStore(s => s.grantApproval);
  const bb = useBlackboardStore(s => s.blackboard);

  // In a real app we'd load if not matched, but for modals we assume bb is loaded by the caller.
  const [rationale, setRationale] = useState('');

  if (!bb || bb.case.case_id !== caseId) {
    return <div style={{ padding: '24px' }}>Loading case data...</div>;
  }

  const patchAuthorized = bb.remediation.some(r => 'patch_action_authorized' in r && r.patch_action_authorized);
  const phase2Rems = bb.remediation.filter(r => !r.remediation_id.includes('recon') && !r.remediation_id.includes('investigate'));

  const handleApprove = () => {
    if (rationale.trim().length < 5) return;
    const intent = grantApproval(approvalId, rationale);
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
      {!patchAuthorized && (
        <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', border: '1px solid var(--color-warning)', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle size={18} style={{ color: 'var(--color-warning)', marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-warning)', marginBottom: '4px' }}>Investigation & Configuration — Not A Patch</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>This ticket does not authorize software patching.</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>Phase 2 Disruptive Actions</h4>
        <div className="flex flex-col gap-3">
          {phase2Rems.map((rem: any) => (
            <div key={rem.remediation_id} style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-surface-2)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{rem.action || rem.title || 'Action'}</span>
                {rem.restart_or_outage !== 'none' && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--color-critical)', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HardDrive size={10} /> OUTAGE
                  </span>
                )}
              </div>
              {rem.rollback && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Rollback: Available</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Rationale</h4>
        <textarea 
          placeholder="Enter authorization rationale..."
          value={rationale}
          onChange={e => setRationale(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '80px', fontSize: '13px', resize: 'vertical' }}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => closeModal()} className="btn-secondary">Cancel</button>
        <button onClick={handleApprove} className="btn-primary" disabled={rationale.trim().length < 5}>
          Authorise Execution
        </button>
      </div>
    </div>
  );
}
