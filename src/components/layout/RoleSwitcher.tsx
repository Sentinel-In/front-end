/* ============================================================
   RoleSwitcher — SPEC §3, §9
   Dropdown with 3 roles, descriptions, and switch behaviour.
   ============================================================ */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Shield, Radio, Microscope } from 'lucide-react';
import { useRoleStore, ROLE_CONFIGS } from '../../store/useRoleStore';
import { useAppStore } from '../../store/useAppStore';
import type { Role } from '../../types';

const ROLE_ICONS = {
  executive: Shield,
  oncall: Radio,
  analyst: Microscope,
} as const;

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  executive: 'Strategic overview, compliance posture, PDF exports',
  oncall: 'Triage queue, approvals, incident response',
  analyst: 'Deep evidence, ES|QL, audit chain verification',
};

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const role = useRoleStore((s) => s.role);
  const setRole = useRoleStore((s) => s.setRole);
  const config = useRoleStore((s) => s.getConfig());
  const isRouteVisible = useRoleStore((s) => s.isRouteVisible);
  const pushToast = useAppStore((s) => s.pushToast);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newRole: Role) => {
    if (newRole === role) {
      setOpen(false);
      return;
    }

    setRole(newRole);
    const newConfig = ROLE_CONFIGS[newRole];

    // Apply density class
    const root = document.documentElement;
    root.classList.remove('density-comfortable', 'density-compact', 'density-dense');
    root.classList.add(`density-${newConfig.density}`);

    // Navigate: stay put if current route is visible to the new role, else go to landing
    if (!isRouteVisible(location.pathname)) {
      navigate(newConfig.landingRoute);
    }

    // Toast (SPEC §3: "Show a 2s toast")
    const capabilities = newConfig.capabilities;
    const capNote = capabilities.canApprove
      ? 'Approval enabled.'
      : capabilities.canRunEsql
      ? 'ES|QL console enabled.'
      : 'PDF export only.';

    pushToast({
      message: `Now viewing as ${newConfig.identity.shortTitle}. ${capNote}`,
      type: 'info',
      duration: 2000,
    });

    setOpen(false);
  };

  const Icon = ROLE_ICONS[role];

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2"
        style={{
          padding: '6px 10px',
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-ctl)',
          color: 'var(--color-text)',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current role: ${config.identity.shortTitle}. Click to switch role.`}
      >
        <Icon size={14} style={{ color: 'var(--color-accent)' }} />
        <span>{config.identity.shortTitle}</span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--color-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
          }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '280px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-panel)',
            padding: '4px',
            zIndex: 40,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          {(Object.keys(ROLE_CONFIGS) as Role[]).map((r) => {
            const rc = ROLE_CONFIGS[r];
            const RIcon = ROLE_ICONS[r];
            const isActive = r === role;

            return (
              <button
                key={r}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(r)}
                className="flex items-start gap-3 w-full"
                style={{
                  padding: '10px 12px',
                  backgroundColor: isActive ? 'var(--color-accent-bg)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-chip)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <RIcon
                  size={16}
                  style={{
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                    }}
                  >
                    {rc.identity.name}
                    <span
                      style={{
                        color: 'var(--color-text-muted)',
                        fontWeight: 400,
                        marginLeft: '6px',
                      }}
                    >
                      {rc.identity.title}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-dim)',
                      marginTop: '2px',
                    }}
                  >
                    {ROLE_DESCRIPTIONS[r]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
