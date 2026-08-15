/* ============================================================
   State Primitives — SPEC §6
   Skeleton, EmptyState, ErrorState, RoleGate,
   EsqlBlock, JsonViewer
   ============================================================ */

import { useState, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Lock, Code, ChevronRight } from 'lucide-react';
import { useRoleStore } from '../../store/useRoleStore';
import type { Role } from '../../types';
import { Button } from './UiPrimitives';

// === Skeleton ===

interface SkeletonProps {
  variant?: 'text' | 'card' | 'row' | 'circle';
  width?: string;
  height?: string;
  count?: number;
}

export function Skeleton({ variant = 'text', width, height, count = 1 }: SkeletonProps) {
  const styles: Record<string, React.CSSProperties> = {
    text:   { width: width || '100%', height: height || '14px', borderRadius: '4px' },
    card:   { width: width || '100%', height: height || '120px', borderRadius: 'var(--radius-card)' },
    row:    { width: width || '100%', height: height || 'var(--density-row-height)', borderRadius: '4px' },
    circle: { width: width || '32px', height: height || '32px', borderRadius: '50%' },
  };

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            ...styles[variant],
            backgroundColor: 'var(--color-surface-2)',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

// === EmptyState ===

interface EmptyStateProps {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
  icon?: ReactNode;
}

export function EmptyState({ title, body, action, icon }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      {icon && (
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          backgroundColor: 'var(--color-surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', color: 'var(--color-text-dim)',
        }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 16px', maxWidth: '360px', marginInline: 'auto' }}>
        {body}
      </p>
      {action && <Button onClick={action.onClick} variant="primary">{action.label}</Button>}
    </div>
  );
}

// === ErrorState ===

interface ErrorStateProps {
  error: string;
  retry: () => void;
}

export function ErrorState({ error, retry }: ErrorStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        backgroundColor: 'color-mix(in srgb, var(--color-critical) 12%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <AlertTriangle size={24} style={{ color: 'var(--color-critical)' }} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>
        Something went wrong
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 16px', fontFamily: 'var(--font-mono)' }}>
        {error}
      </p>
      <Button onClick={retry} variant="secondary" icon={<RefreshCw size={14} />}>
        Retry
      </Button>
    </div>
  );
}

// === RoleGate — SPEC §3 ===

interface RoleGateProps {
  capability: 'canApprove' | 'canSeeRawEvidence' | 'canRunEsql' | 'canExport';
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ capability, fallback, children }: RoleGateProps) {
  const capabilities = useRoleStore((s) => s.getCapabilities());
  const config = useRoleStore((s) => s.getConfig());
  const setRole = useRoleStore((s) => s.setRole);

  if (capabilities[capability]) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <RedactedNote
      currentRole={config.identity.shortTitle}
      onSwitchRole={() => setRole('analyst' as Role)}
    />
  );
}

function RedactedNote({ currentRole, onSwitchRole }: { currentRole: string; onSwitchRole: () => void }) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: '12px 16px',
        backgroundColor: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-panel)',
        fontSize: '13px',
        color: 'var(--color-text-muted)',
      }}
    >
      <Lock size={16} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        Evidence hidden in {currentRole} view — switch to Security Analyst to inspect.
      </div>
      <Button onClick={onSwitchRole} variant="ghost" size="sm">
        Switch role
      </Button>
    </div>
  );
}

// === EsqlBlock ===

interface EsqlBlockProps {
  query: string;
  stats?: { ms: number; hits: number };
  runnable?: boolean;
  onRun?: () => void;
}

export function EsqlBlock({ query, stats, runnable, onRun }: EsqlBlockProps) {
  return (
    <RoleGate capability="canSeeRawEvidence">
      <div style={{
        backgroundColor: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-panel)',
        overflow: 'hidden',
      }}>
        <div className="flex items-center justify-between" style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Code size={14} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>ES|QL</span>
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>
                {stats.ms}ms · {stats.hits} hits
              </span>
            )}
            {runnable && (
              <Button onClick={onRun} variant="ghost" size="sm" icon={<ChevronRight size={12} />}>
                Run
              </Button>
            )}
          </div>
        </div>
        <pre style={{
          padding: '12px',
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-text)',
          overflowX: 'auto',
          lineHeight: '1.6',
        }}>
          {query}
        </pre>
      </div>
    </RoleGate>
  );
}

// === JsonViewer ===

interface JsonViewerProps {
  data: unknown;
  collapsed?: boolean;
}

export function JsonViewer({ data, collapsed = true }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const formatted = JSON.stringify(data, null, 2);

  return (
    <div style={{
      backgroundColor: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-panel)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full"
        style={{
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <ChevronRight
          size={12}
          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
        />
        {isExpanded ? 'Collapse' : 'Expand'} JSON
      </button>
      {isExpanded && (
        <pre style={{
          padding: '12px',
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-text)',
          overflowX: 'auto',
          borderTop: '1px solid var(--color-border)',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          {formatted}
        </pre>
      )}
    </div>
  );
}
