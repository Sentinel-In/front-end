/* ============================================================
   AppShell — SPEC §4
   h-screen overflow-hidden flex column.
   Renders TopBar, TabBar, scrollable <main> (Outlet), StatusBar.
   Wraps modal/toast roots. Never unmounts across routes.
   ============================================================ */

import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';
import { VersionBanner } from './VersionBanner';
import { ModalRoot } from '../overlays/ModalRoot';
import { ToastRoot } from '../overlays/ToastRoot';
import { CommandPalette } from '../overlays/CommandPalette';
import { ProvenanceDrawer } from '../overlays/ProvenanceDrawer';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useRoleStore } from '../../store/useRoleStore';

export function AppShell() {
  useKeyboardShortcuts();

  const config = useRoleStore((s) => s.getConfig());

  // Apply density class on mount and role change
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('density-comfortable', 'density-compact', 'density-dense');
    root.classList.add(`density-${config.density}`);
  }, [config.density]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <TopBar />
      <TabBar />
      <VersionBanner />

      {/* Scrollable main content — SPEC §4 */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: 'var(--color-page)',
        }}
      >
        <Outlet />
      </main>

      <StatusBar />

      {/* Overlay roots */}
      <ModalRoot />
      <ToastRoot />
      <CommandPalette />
      <ProvenanceDrawer />
    </div>
  );
}
