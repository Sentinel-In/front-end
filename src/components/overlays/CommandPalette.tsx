/* ============================================================
   CommandPalette — SPEC §9
   Global command palette triggered by Cmd+K.
   Provides quick navigation and actions.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ShieldAlert, Settings, Monitor, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useThemeStore } from '../../store/useThemeStore';

type Command = {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
};

export function CommandPalette() {
  const open = useAppStore((s) => s.commandPaletteOpen);
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const pushToast = useAppStore((s) => s.pushToast);
  const setTheme = useThemeStore((s) => s.setTheme);
  const navigate = useNavigate();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const commands: Command[] = [
    {
      id: 'goto-alerts',
      label: 'Go to Triage Queue',
      icon: ShieldAlert,
      action: () => { navigate('/alerts'); setOpen(false); },
    },
    {
      id: 'goto-settings',
      label: 'Go to Settings',
      icon: Settings,
      action: () => { navigate('/settings'); setOpen(false); },
    },
    {
      id: 'theme-dark',
      label: 'Switch to Dark Theme',
      icon: Moon,
      action: () => { setTheme('dark'); setOpen(false); pushToast({ message: 'Theme set to dark', type: 'info', duration: 1500 }); },
    },
    {
      id: 'theme-light',
      label: 'Switch to Light Theme',
      icon: Sun,
      action: () => { setTheme('light'); setOpen(false); pushToast({ message: 'Theme set to light', type: 'info', duration: 1500 }); },
    },
    {
      id: 'theme-system',
      label: 'Use System Theme',
      icon: Monitor,
      action: () => { setTheme('system'); setOpen(false); pushToast({ message: 'Theme set to system', type: 'info', duration: 1500 }); },
    },
  ];

  const filteredCommands = commands.filter(c => 
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center"
          style={{ paddingTop: '20vh' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            className="relative z-10 w-full"
            style={{
              maxWidth: '560px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
              boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
            }}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3"
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <Search size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search alerts, assets, tickets, or run commands..."
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-dim)',
                  padding: '2px',
                }}
                aria-label="Close command palette"
              >
                <X size={16} />
              </button>
            </div>

            {/* Results */}
            <div
              style={{
                padding: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {filteredCommands.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {filteredCommands.map(cmd => (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className="flex items-center gap-3 w-full"
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-chip)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--color-text)',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <cmd.icon size={16} style={{ color: 'var(--color-text-muted)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{cmd.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>
                    No results found for "{query}"
                  </p>
                </div>
              )}
            </div>
            
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)', fontSize: '11px', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
              Press Esc to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
