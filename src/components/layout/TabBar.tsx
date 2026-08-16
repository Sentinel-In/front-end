/* ============================================================
   TabBar — SPEC §3, §9
   Renders tabs based on current role.
   Active tab has animated pill. "More ▾" for overflow.
   ============================================================ */

import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ShieldAlert, Server, Ticket, FileText,
  ScrollText, Newspaper, GitBranch, Settings, MoreHorizontal,
  Search, Clock, AlertTriangle,
} from 'lucide-react';
import { useRoleStore } from '../../store/useRoleStore';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutDashboard,
  ShieldAlert,
  Server,
  Ticket,
  FileText,
  ScrollText,
  Newspaper,
  GitBranch,
  Settings,
  Search,
  Clock,
  AlertTriangle,
};

export function TabBar() {
  const tabs = useRoleStore((s) => s.getTabs());
  const moreTabs = useRoleStore((s) => s.getMoreTabs());
  const config = useRoleStore((s) => s.getConfig());
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMoreActive = moreTabs.some((t) => location.pathname.startsWith(t.route));

  return (
    <nav
      className="flex items-center justify-between"
      style={{
        height: '42px',
        padding: '0 20px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-1" style={{ height: '100%' }}>
        {tabs.map((tab) => {
          const Icon = ICON_MAP[tab.icon];
          const isActive = location.pathname.startsWith(tab.route);

          return (
            <NavLink
              key={tab.id}
              to={tab.route}
              className="flex items-center gap-2"
              style={{
                position: 'relative',
                padding: '6px 14px',
                borderRadius: 'var(--radius-chip)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {Icon && <Icon size={15} />}
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  style={{
                    position: 'absolute',
                    bottom: '-7px',
                    left: '8px',
                    right: '8px',
                    height: '2px',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: '1px',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </NavLink>
          );
        })}

        {/* More ▾ */}
        <div ref={moreRef} style={{ position: 'relative', height: '100%' }}>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex items-center gap-1"
            style={{
              height: '100%',
              padding: '6px 10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              color: isMoreActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontWeight: isMoreActive ? 600 : 400,
              fontFamily: 'var(--font-sans)',
              position: 'relative',
            }}
          >
            <MoreHorizontal size={15} />
            <span>More</span>
            {isMoreActive && (
              <motion.div
                layoutId="tab-indicator"
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: '8px',
                  right: '8px',
                  height: '2px',
                  backgroundColor: 'var(--color-accent)',
                  borderRadius: '1px',
                }}
              />
            )}
          </button>

          {moreOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                width: '200px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-panel)',
                padding: '4px',
                zIndex: 40,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              }}
            >
              {moreTabs.map((tab) => {
                const Icon = ICON_MAP[tab.icon];
                const isActive = location.pathname.startsWith(tab.route);

                return (
                  <NavLink
                    key={tab.id}
                    to={tab.route}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2"
                    style={{
                      padding: '8px 12px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                      borderRadius: 'var(--radius-chip)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: isActive ? 'var(--color-accent-bg)' : 'transparent',
                    }}
                  >
                    {Icon && <Icon size={15} />}
                    <span>{tab.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Role chip (SPEC §3) */}
      <div
        className="flex items-center gap-1"
        style={{
          padding: '3px 10px',
          backgroundColor: 'var(--color-accent-bg)',
          borderRadius: 'var(--radius-pill)',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-accent)',
        }}
      >
        {config.identity.shortTitle} view
      </div>
    </nav>
  );
}
