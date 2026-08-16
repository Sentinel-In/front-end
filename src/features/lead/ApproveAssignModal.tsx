import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { AlertTriangle, HardDrive } from 'lucide-react';

export function ApproveAssignModal({ caseId }: { caseId: string }) {
  const closeModal = useAppStore(s => s.closeModal);
  const openModal = useAppStore(s => s.openModal);
  const bb = useBlackboardStore(s => s.blackboard);
  const assignTicket = useWorkflowStore(s => s.assignTicket);
  
  const [selectedEngineer, setSelectedEngineer] = useState('t.chen');
  const [selectedRemediations, setSelectedRemediations] = useState<string[]>([]);
  const [changeWindow, setChangeWindow] = useState('next_maintenance');

  if (!bb || bb.case.case_id !== caseId) return <div style={{ padding: '24px' }}>Loading case data...</div>;

  const handleApprove = () => {
    if (selectedRemediations.length === 0) return;
    // Usually we would create a ticket first, but let's mock it using assignTicket for now
    const mockTicketId = 'TKT-001';
    const intent = assignTicket(mockTicketId, selectedEngineer, changeWindow);
    closeModal();
    openModal({
      id: 'case-event-intent-modal',
      title: 'Intent Preview',
      component: 'CaseEventIntentModal',
      props: { intent, onConfirm: () => {} }
    });
  };

  const patchActionAuthorized = !bb.remediation.some(
    r => 'patch_action_authorized' in r && r.patch_action_authorized === false
  );
  

  return (
    <div style={{ padding: '24px' }}>
      
      {!patchActionAuthorized && (
        <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--color-critical) 15%, transparent)', border: '1px solid var(--color-critical)', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle size={18} style={{ color: 'var(--color-critical)', marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-critical)', marginBottom: '4px' }}>Patch Action NOT Authorized</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>This case currently forbids unapproved patching. Proceeding will require emergency override protocols.</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Select Remediations</h4>
        <div className="flex flex-col gap-2">
          {bb.remediation.map(rem => (
            <label key={rem.remediation_id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', background: selectedRemediations.includes(rem.remediation_id) ? 'var(--color-surface-2)' : 'transparent' }}>
              <input 
                type="checkbox" 
                checked={selectedRemediations.includes(rem.remediation_id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedRemediations(prev => [...prev, rem.remediation_id]);
                  else setSelectedRemediations(prev => prev.filter(id => id !== rem.remediation_id));
                }}
                style={{ marginTop: '2px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{(rem as any).action || (rem as any).title || 'Action'}</div>
                  {rem.restart_or_outage !== 'none' && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--color-critical)', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><HardDrive size={10} /> OUTAGE</span>}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>{rem.target}</div>
              </div>
            </label>
          ))}
          {bb.remediation.length === 0 && <div style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>No remediations available.</div>}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Assign Engineer</h4>
        <select value={selectedEngineer} onChange={e => setSelectedEngineer(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
          <option value="t.chen">T. Chen (L2 NetSec)</option>
          <option value="a.smith">A. Smith (L3 DevOps)</option>
        </select>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Change Window</h4>
        <select value={changeWindow} onChange={e => setChangeWindow(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
          <option value="next_maintenance">Next Standard Maintenance</option>
          <option value="emergency_now">Emergency (Immediate)</option>
        </select>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => closeModal()} className="btn-secondary">Cancel</button>
        <button onClick={handleApprove} className="btn-primary" disabled={selectedRemediations.length === 0}>
          Preview Assign
        </button>
      </div>
    </div>
  );
}
