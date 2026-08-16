/* ============================================================
   TopBar — SPEC §9
   Logo, search, notification bell, theme toggle,
   role switcher, avatar.
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Monitor } from 'lucide-react';
import { useRoleStore } from '../../store/useRoleStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useAppStore } from '../../store/useAppStore';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationDropdown } from '../overlays/NotificationDropdown';
import type { ThemeMode } from '../../types';

const THEME_OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'dark', icon: Moon, label: 'Dark' },
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'system', icon: Monitor, label: 'System' },
];

export function TopBar() {
  const navigate = useNavigate();
  const config = useRoleStore((s) => s.getConfig());
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const pushToast = useAppStore((s) => s.pushToast);
  const identity = useRoleStore((s) => s.getIdentity());

  const handleLogoClick = () => {
    navigate(config.landingRoute);
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    pushToast({
      message: `${mode.charAt(0).toUpperCase() + mode.slice(1)} theme.`,
      type: 'info',
      duration: 1500,
    });
  };

  return (
    <header
      className="flex items-center justify-between"
      style={{
        height: '52px',
        padding: '0 20px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
          }}
          aria-label="Go to landing page"
        >
          {/* Shield logo mark */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-soft))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            S
          </div>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
            }}
          >
            Sentinel-In
          </span>
        </button>
      </div>

      {/* Center: Search */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-2"
        style={{
          padding: '6px 14px',
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-ctl)',
          cursor: 'pointer',
          minWidth: '240px',
        }}
        aria-label="Open command palette (Ctrl+K)"
      >
        <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
        <span style={{ color: 'var(--color-text-dim)', fontSize: '13px', flex: 1, textAlign: 'left' }}>
          Search...
        </span>
        <kbd
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-dim)',
            backgroundColor: 'var(--color-surface-3)',
            padding: '1px 5px',
            borderRadius: '4px',
            border: '1px solid var(--color-border-2)',
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <NotificationDropdown />

        {/* Theme toggle — segmented control (SPEC §2b) */}
        <div
          className="flex items-center"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-ctl)',
            padding: '2px',
          }}
          role="radiogroup"
          aria-label="Theme selection"
        >
          {THEME_OPTIONS.map(({ mode, icon: Icon, label }) => {
            const isActive = theme === mode;
            return (
              <button
                key={mode}
                role="radio"
                aria-checked={isActive}
                onClick={() => handleThemeChange(mode)}
                className="flex items-center gap-1"
                style={{
                  padding: '4px 8px',
                  backgroundColor: isActive ? 'var(--color-surface-3)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: isActive ? 'var(--color-text)' : 'var(--color-text-dim)',
                  fontSize: '12px',
                  fontWeight: isActive ? 500 : 400,
                  fontFamily: 'var(--font-sans)',
                }}
                title={label}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Role Switcher */}
        <RoleSwitcher />

        {/* Avatar */}
        <button
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-accent-bg), var(--color-accent))',
            border: '2px solid var(--color-border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
          }}
          aria-label={`User menu: ${identity.name}`}
        >
          {identity.avatar}
        </button>
      </div>
    </header>
  );
}
