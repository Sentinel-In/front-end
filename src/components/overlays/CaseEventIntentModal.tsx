import { Database, Check } from 'lucide-react';
import { Button, JsonViewer } from '../primitives';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import type { CaseEventIntent } from '../../types';

interface CaseEventIntentModalProps {
  intent: CaseEventIntent;
  onConfirm: () => void;
}

export function CaseEventIntentModal({ intent, onConfirm }: CaseEventIntentModalProps) {
  const closeModal = useAppStore((s) => s.closeModal);
  const commitEvent = useWorkflowStore((s) => s.commitEvent);
  const pushToast = useAppStore((s) => s.pushToast);

  const handleCommit = () => {
    commitEvent(intent);
    onConfirm();
    closeModal('case-event-intent-modal');
    pushToast({
      message: `Ledger event ${intent.event_type} committed.`,
      type: 'success',
      duration: 3000,
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <div className="flex items-center gap-3 mb-4" style={{ color: 'var(--color-accent)' }}>
        <Database size={24} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Ledger Write Intent</h3>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '16px', lineHeight: 1.5 }}>
        Your decision will be recorded to the immutable case ledger. The backend reducer will process this event and update the read-only blackboard.
      </p>
      
      <div style={{ marginBottom: '24px' }}>
        <JsonViewer data={intent} />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => closeModal('case-event-intent-modal')}>Cancel</Button>
        <Button variant="primary" onClick={handleCommit} icon={<Check size={14} />}>
          Sign and Commit Event
        </Button>
      </div>
    </div>
  );
}
