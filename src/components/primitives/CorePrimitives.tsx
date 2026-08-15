/* ============================================================
   Core Primitives — SPEC §6
   PriorityTag, CopyableId, Timestamp, ProvenanceTag,
   CountdownTimer, HashLink, EntityChip, StatCard
   ============================================================ */

import { useState } from 'react';
import { Copy, Check, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useCountdown } from '../../hooks/useCountdown';

// === PriorityTag ===

const PRIORITY_COLORS: Record<string, string> = {
  P1: '--color-critical',
  P2: '--color-high',
  P3: '--color-medium',
  P4: '--color-low',
};

interface PriorityTagProps {
  priority: 'P1' | 'P2' | 'P3' | 'P4';
}

export function PriorityTag({ priority }: PriorityTagProps) {
  const colorVar = PRIORITY_COLORS[priority];
  return (
    <span
      style={{
        padding: '1px 6px',
        borderRadius: 'var(--radius-chip)',
        backgroundColor: `color-mix(in srgb, var(${colorVar}) 12%, transparent)`,
        color: `var(${colorVar})`,
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {priority}
    </span>
  );
}

// === CopyableId ===

interface CopyableIdProps {
  value: string;
  label?: string;
}

export function CopyableId({ value, label }: CopyableIdProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <button
      onClick={() => copy(value, label || value)}
      className="inline-flex items-center gap-1"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--color-accent)',
        padding: '1px 2px',
        borderRadius: 'var(--radius-chip)',
      }}
      title={`Copy ${value}`}
    >
      <span>{value}</span>
      {copied ? <Check size={12} style={{ color: 'var(--color-safe)' }} /> : <Copy size={12} style={{ opacity: 0.5 }} />}
    </button>
  );
}

// === Timestamp ===

interface TimestampProps {
  iso: string;
  mode?: 'relative' | 'absolute' | 'mono';
}

export function Timestamp({ iso, mode = 'relative' }: TimestampProps) {
  const [showAbsolute, setShowAbsolute] = useState(false);
  const date = new Date(iso);

  const relative = formatDistanceToNow(date, { addSuffix: true });
  const absolute = format(date, 'dd MMM yyyy HH:mm:ss') + ' IST';

  if (mode === 'mono') {
    return (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-2)' }}>
        {absolute}
      </span>
    );
  }

  return (
    <span
      onMouseEnter={() => setShowAbsolute(true)}
      onMouseLeave={() => setShowAbsolute(false)}
      style={{
        fontSize: '12px',
        color: 'var(--color-text-muted)',
        fontFamily: showAbsolute ? 'var(--font-mono)' : 'var(--font-sans)',
        cursor: 'default',
      }}
      title={absolute}
    >
      {showAbsolute ? absolute : relative}
    </span>
  );
}

// === ProvenanceTag ===

interface ProvenanceTagProps {
  source: string;
  onClick?: () => void;
}

export function ProvenanceTag({ source, onClick }: ProvenanceTagProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1"
      style={{
        background: 'none',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        padding: '1px 4px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--color-text-dim)',
        borderRadius: 'var(--radius-chip)',
      }}
      title={`Source: ${source}`}
    >
      <ExternalLink size={10} />
      {source}
    </button>
  );
}

// === CountdownTimer ===

interface CountdownTimerProps {
  deadline: string;
  variant: 'statutory' | 'sla';
  onClick?: () => void;
}

export function CountdownTimer({ deadline, variant, onClick }: CountdownTimerProps) {
  const totalMs = variant === 'statutory' ? 6 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;
  const { label, state } = useCountdown(deadline, totalMs);

  const isCritical = state === 'critical' || state === 'expired';
  const colorVar = isCritical ? '--color-critical' : variant === 'statutory' ? '--color-high' : '--color-text-muted';

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1"
      style={{
        background: 'none',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        fontWeight: 600,
        color: `var(${colorVar})`,
        padding: '2px 6px',
        borderRadius: 'var(--radius-chip)',
        animation: isCritical && variant === 'statutory' ? 'pulse 1.5s ease-in-out infinite' : undefined,
      }}
      title={`${variant === 'statutory' ? 'CERT-In statutory' : 'Internal SLA'} deadline`}
    >
      <Clock size={12} />
      <span>{label}</span>
      <span style={{ fontSize: '10px', opacity: 0.7 }}>
        {variant === 'statutory' ? 'CERT-In' : 'SLA'}
      </span>
    </button>
  );
}

// === HashLink ===

interface HashLinkProps {
  prev: string;
  curr: string;
  onClick?: () => void;
}

export function HashLink({ prev, curr, onClick }: HashLinkProps) {
  const truncate = (h: string) => h.slice(0, 8) + '…' + h.slice(-6);

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1"
      style={{
        background: 'none',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--color-text-dim)',
        padding: 0,
      }}
      title={`Previous: ${prev}\nCurrent: ${curr}`}
    >
      <span style={{ opacity: 0.5 }}>{truncate(prev)}</span>
      <span style={{ color: 'var(--color-text-muted)' }}>→</span>
      <span>{truncate(curr)}</span>
    </button>
  );
}

// === EntityChip ===

interface EntityChipProps {
  type: 'alert' | 'asset' | 'ticket' | 'advisory' | 'cve' | 'ip';
  id: string;
  label?: string;
  onClick?: () => void;
}

const ENTITY_COLORS: Record<string, string> = {
  alert: '--color-critical',
  asset: '--color-accent',
  ticket: '--color-high',
  advisory: '--color-medium',
  cve: '--color-critical',
  ip: '--color-text-muted',
};

export function EntityChip({ type, id, label, onClick }: EntityChipProps) {
  const colorVar = ENTITY_COLORS[type] || '--color-accent';

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1"
      style={{
        padding: '2px 8px',
        borderRadius: 'var(--radius-chip)',
        backgroundColor: `color-mix(in srgb, var(${colorVar}) 10%, transparent)`,
        border: `1px solid color-mix(in srgb, var(${colorVar}) 20%, transparent)`,
        color: `var(${colorVar})`,
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        background: onClick ? undefined : 'none',
      }}
      title={`${type}: ${id}`}
    >
      {label || id}
    </button>
  );
}

// === StatCard ===

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  target?: string;
  onClick?: () => void;
  variant?: 'default' | 'accent' | 'warning' | 'critical';
}

export function StatCard({ label, value, delta, target, onClick, variant = 'default' }: StatCardProps) {
  const accentMap = {
    default: '--color-text',
    accent: '--color-accent',
    warning: '--color-medium',
    critical: '--color-critical',
  };

  return (
    <button
      onClick={onClick}
      className="card"
      style={{
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        border: onClick ? undefined : '1px solid var(--color-border)',
        width: '100%',
      }}
    >
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: `var(${accentMap[variant]})`, lineHeight: 1.2 }}>
        {value}
      </div>
      {(delta || target) && (
        <div className="flex items-center gap-2" style={{ marginTop: '4px', fontSize: '12px' }}>
          {delta && (
            <span style={{ color: delta.startsWith('+') || delta.startsWith('↑') ? 'var(--color-critical)' : 'var(--color-safe)' }}>
              {delta}
            </span>
          )}
          {target && <span style={{ color: 'var(--color-text-dim)' }}>target: {target}</span>}
        </div>
      )}
    </button>
  );
}
