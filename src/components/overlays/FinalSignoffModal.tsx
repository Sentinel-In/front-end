import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export function FinalSignoffModal({ ticketId, caseId }: { ticketId: string, caseId: string }) {
  const closeModal = useAppStore(s => s.closeModal);
  const openModal = useAppStore(s => s.openModal);
  const signFinalAcceptance = useWorkflowStore(s => s.signFinalAcceptance);
  const bb = useBlackboardStore(s => s.blackboard);

  const [rationale, setRationale] = useState('');

  if (!bb || bb.case.case_id !== caseId) {
    return <div style={{ padding: '24px' }}>Loading case data...</div>;
  }

  // In a real app we'd load verification states from the ticket, but here we assume all passed for demo, or we can mock a failure if needed.
  const verifications = bb.verification.map(v => ({ ...v, status: 'passed' }));
  const hasFailures = verifications.some(v => v.status === 'failed');

  const handleSignoff = () => {
    if (hasFailures) return;
    const intent = signFinalAcceptance(ticketId);
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
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>Verification Outcomes</h4>
        
        {hasFailures && (
          <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--color-critical) 15%, transparent)', border: '1px solid var(--color-critical)', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-critical)', marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-critical)', marginBottom: '4px' }}>Signoff Blocked</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>One or more verifications failed. This ticket cannot be signed off and should be returned.</div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {verifications.map((v) => (
            <div key={v.verification_id} style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{v.scope}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Expected: {v.expected_result}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: v.status === 'passed' ? 'var(--color-safe)' : 'var(--color-critical)' }}>
                {v.status === 'passed' ? (
                  <><CheckCircle2 size={14} /> Passed</>
                ) : (
                  <><AlertTriangle size={14} /> Failed</>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Signoff Note (Optional)</h4>
        <textarea 
          placeholder="Add closing remarks..."
          value={rationale}
          onChange={e => setRationale(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '60px', fontSize: '13px', resize: 'vertical' }}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => closeModal()} className="btn-secondary">Cancel</button>
        <button onClick={handleSignoff} className="btn-primary" disabled={hasFailures}>
          Sign Final Acceptance
        </button>
      </div>
    </div>
  );
}
