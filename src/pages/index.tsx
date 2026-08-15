/* ============================================================
   Page Exports — SPEC-002 Blackboard Pivot
   ============================================================ */

import { Link } from 'react-router-dom';
import { useRoleStore } from '../store/useRoleStore';
import {
  Clock, AlertTriangle, Home
} from 'lucide-react';

// === Shared Page Shell for Placeholders ===

interface PagePlaceholderProps {
  title: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  phase: number;
  description: string;
  children?: React.ReactNode;
}

function PagePlaceholder({ title, icon: Icon, phase, description, children }: PagePlaceholderProps) {
  const config = useRoleStore((s) => s.getConfig());

  return (
    <div style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: 'var(--density-card-padding)', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Icon size={28} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>{title}</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 16px', lineHeight: '1.6' }}>{description}</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'var(--color-surface-2)', borderRadius: 'var(--radius-pill)', fontSize: '12px', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
          Phase {phase} · {config.identity.shortTitle} · {config.density}
        </div>
        {children}
      </div>
    </div>
  );
}

export { DashboardPage } from './DashboardPage';

// === Asset Impact Report (Phase B) ===
export { AssetImpactReportPage } from './AssetImpactReportPage';

export { EvidenceExplorerPage } from './EvidenceExplorerPage';

// === Case Timeline (Phase E) ===
export function CaseTimelinePage() {
  return <PagePlaceholder title="Case Timeline" icon={Clock} phase={12} description="Decisions, budgets, and ledger head." />;
}

// === Gaps & Blockers (Phase E) ===
export function GapsPage() {
  return <PagePlaceholder title="Gaps & Blockers" icon={AlertTriangle} phase={12} description="Frontier nodes, open gaps, and blockers preventing case closure." />;
}

// === Settings (Existing) ===
export { SettingsPage } from './SettingsPage';

// === Not Found ===
export function NotFoundPage() {
  return (
    <div style={{ padding: '32px 24px', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '48px 32px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'color-mix(in srgb, var(--color-critical) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertTriangle size={28} style={{ color: 'var(--color-critical)' }} />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>404 — Route Not Found</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 24px' }}>This route doesn't exist. Check the URL or navigate home.</p>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'var(--color-accent)', color: 'white', textDecoration: 'none', borderRadius: 'var(--radius-ctl)', fontSize: '13px', fontWeight: 500 }}>
          <Home size={14} /> Go Home
        </Link>
      </div>
    </div>
  );
}
