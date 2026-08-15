/* ============================================================
   Settings Page
   Basic mock configuration UI.
   ============================================================ */

import { Settings, Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { Toggle, Button } from '../components/primitives';
import type { ThemeMode } from '../types';

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  const handleThemeChange = (newMode: ThemeMode) => {
    setTheme(newMode);
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={20} style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Settings</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>Application preferences and integrations</p>
        </div>
      </div>

      <div className="card flex flex-col gap-6">
        
        {/* Theme Settings */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 12px' }}>Appearance</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Customize the interface theme.</p>
          
          <div className="flex items-center gap-3">
            <Button
              variant={theme === 'light' ? 'primary' : 'secondary'}
              onClick={() => handleThemeChange('light')}
              icon={<Sun size={14} />}
            >
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'secondary'}
              onClick={() => handleThemeChange('dark')}
              icon={<Moon size={14} />}
            >
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'primary' : 'secondary'}
              onClick={() => handleThemeChange('system')}
              icon={<Monitor size={14} />}
            >
              System
            </Button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

        {/* Notifications (Mock) */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 12px' }}>Notifications</h3>
          <div className="flex flex-col gap-4">
            <Toggle checked={true} onChange={() => {}} label="Email alerts for Critical incidents" />
            <Toggle checked={false} onChange={() => {}} label="Slack/Teams notifications" />
            <Toggle checked={true} onChange={() => {}} label="Daily summary reports" />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

        {/* Danger Zone */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-critical)', margin: '0 0 12px' }}>Danger Zone</h3>
          <Button variant="danger" onClick={() => alert('Action unavailable in mock environment.')}>
            Reset Local Data
          </Button>
        </div>

      </div>
    </div>
  );
}
