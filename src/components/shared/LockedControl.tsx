import React from 'react';
import { Lock } from 'lucide-react';
import { ROLE_CONFIGS, useRoleStore } from '../../store/useRoleStore';
import { useAppStore } from '../../store/useAppStore';
import { getAuthoritativeRole } from '../../selectors/rbac';
import type { RoleCapability } from '../../types';

interface LockedControlProps {
  capability: RoleCapability;
  children: React.ReactNode;
}

export function LockedControl({ capability, children }: LockedControlProps) {
  const capabilities = useRoleStore((s) => s.getCapabilities());
  const setRole = useRoleStore((s) => s.setRole);
  const openModal = useAppStore((s) => s.openModal);
  const closeModal = useAppStore((s) => s.closeModal);

  const hasCapability = capabilities[capability];
  const requiredRoleValue = getAuthoritativeRole(capability);
  const requiredRoleName = ROLE_CONFIGS[requiredRoleValue].identity.title;

  if (hasCapability) {
    return <>{children}</>;
  }

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    openModal({
      id: 'locked-control-modal',
      title: 'Action Requires Authorisation',
      component: 'LockedControlModal',
      props: {
        requiredRoleName,
        onSwitchRole: () => {
          setRole(requiredRoleValue);
          closeModal('locked-control-modal');
        }
      }
    });
  };

  return (
    <div onClickCapture={handleLockedClick} style={{ display: 'inline-block', position: 'relative', opacity: 0.6, cursor: 'not-allowed' }}>
      <div style={{ pointerEvents: 'none' }}>
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '50%',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)'
        }}
      >
        <Lock size={12} />
      </div>
    </div>
  );
}
