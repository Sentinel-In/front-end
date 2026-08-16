import { useState } from 'react';
import { ShieldAlert, Info } from 'lucide-react';
import type { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
  rule?: number;
  explanation: string;
  overrideActor?: string;
  overrideReason?: string;
}

export function PriorityBadge({ priority, rule, explanation, overrideActor, overrideReason }: PriorityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const colors = {
    P0: 'var(--color-critical)',
    P1: '#f97316',
    P2: 'var(--color-warning)',
    P3: 'var(--color-success)',
  };

  const bgColors = {
    P0: 'var(--color-critical-bg)',
    P1: 'rgba(249, 115, 22, 0.1)',
    P2: 'var(--color-warning-bg)',
    P3: 'var(--color-success-bg)',
  };

  const color = colors[priority];
  const bg = bgColors[priority];

  const tooltipContent = overrideActor
    ? `${priority} · overridden by ${overrideActor} — ${overrideReason}`
    : `${priority} · rule ${rule} — ${explanation}`;

  return (
    <div
      style={{ display: 'inline-flex', position: 'relative' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="flex items-center gap-1"
        style={{
          padding: '2px 8px',
          backgroundColor: bg,
          color: color,
          borderRadius: 'var(--radius-pill)',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          cursor: 'help',
          border: `1px solid ${color}`,
        }}
      >
        <ShieldAlert size={12} />
        {priority}
      </div>

      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-panel)',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--color-text)',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 400,
          }}
        >
          <Info size={14} style={{ color: 'var(--color-accent)' }} />
          {tooltipContent}
        </div>
      )}
    </div>
  );
}
