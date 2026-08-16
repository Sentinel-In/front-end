import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '../primitives';
import { useAppStore } from '../../store/useAppStore';

interface LockedControlModalProps {
  requiredRoleName: string;
  onSwitchRole: () => void;
}

export function LockedControlModal({ requiredRoleName, onSwitchRole }: LockedControlModalProps) {
  const closeModal = useAppStore((s) => s.closeModal);

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <div className="flex items-center gap-3 mb-4" style={{ color: 'var(--color-critical)' }}>
        <ShieldAlert size={24} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Action Requires Authorisation</h3>
      </div>
      <p style={{ fontSize: '14px', color: 'var(--color-text)', marginBottom: '24px', lineHeight: 1.5 }}>
        You do not have the required capability to perform this action. It requires the <strong>{requiredRoleName}</strong> role.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => closeModal()}>Cancel</Button>
        <Button variant="primary" onClick={onSwitchRole} icon={<RefreshCw size={14} />}>
          Switch to {requiredRoleName}
        </Button>
      </div>
    </div>
  );
}
