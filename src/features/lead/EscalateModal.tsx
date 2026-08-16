import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { openGaps } from '../../selectors/evidence';
import { AlertCircle } from 'lucide-react';

export function EscalateModal({ caseId }: { caseId: string }) {
  const closeModal = useAppStore(s => s.closeModal);
  const openModal = useAppStore(s => s.openModal);
  const bb = useBlackboardStore(s => s.blackboard);
  const escalate = useWorkflowStore(s => s.escalateToAnalyst);
  const [selectedGap, setSelectedGap] = useState<string | null>(null);

  if (!bb || bb.case.case_id !== caseId) return <div style={{ padding: '24px' }}>Loading case data...</div>;

  const gaps = openGaps(bb);

  const handleEscalate = () => {
    if (!selectedGap) return;
    const intent = escalate(caseId, selectedGap);
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
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
        Escalation requires a specific named question or gap. Free-text escalation is not permitted.
      </p>

      {gaps.length === 0 ? (
        <div className="flex items-center gap-2" style={{ padding: '16px', background: 'var(--color-surface-2)', borderRadius: '8px', color: 'var(--color-text-dim)' }}>
          <AlertCircle size={16} /> No open gaps to investigate.
        </div>
      ) : (
        <div className="flex flex-col gap-2" style={{ marginBottom: '24px' }}>
          {gaps.map(g => (
            <label
              key={g.gap_id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                border: `1px solid ${selectedGap === g.gap_id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedGap === g.gap_id ? 'var(--color-accent-bg)' : 'transparent',
              }}
            >
              <input 
                type="radio" 
                name="gap" 
                value={g.gap_id} 
                checked={selectedGap === g.gap_id} 
                onChange={() => setSelectedGap(g.gap_id)}
                style={{ marginTop: '2px' }}
              />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>Gap</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{g.description}</div>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <button onClick={() => closeModal()} className="btn-secondary">Cancel</button>
        <button onClick={handleEscalate} className="btn-primary" disabled={!selectedGap}>
          Preview Escalation
        </button>
      </div>
    </div>
  );
}
