/* ============================================================
   useCountdown — SPEC §6
   Ticks every 1s, returns {h, m, s, pct, state}.
   state: 'active' | 'warning' | 'critical' | 'expired'
   ============================================================ */

import { useState, useEffect, useCallback } from 'react';

interface CountdownResult {
  h: number;
  m: number;
  s: number;
  pct: number;
  totalMs: number;
  state: 'active' | 'warning' | 'critical' | 'expired';
  label: string;
}

export function useCountdown(
  deadline: string,
  totalDurationMs = 6 * 60 * 60 * 1000, // default 6h statutory
  warningThresholdMs = 2 * 60 * 60 * 1000, // 2h
): CountdownResult {
  const compute = useCallback(() => {
    const now = Date.now();
    const end = new Date(deadline).getTime();
    const remaining = Math.max(0, end - now);

    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    const pct = Math.min(100, Math.max(0, (remaining / totalDurationMs) * 100));

    let state: CountdownResult['state'] = 'active';
    if (remaining <= 0) state = 'expired';
    else if (remaining <= warningThresholdMs) state = 'critical';
    else if (remaining <= warningThresholdMs * 2) state = 'warning';

    const pad = (n: number) => n.toString().padStart(2, '0');
    const label = remaining <= 0 ? 'Expired' : `${pad(h)}:${pad(m)}:${pad(s)}`;

    return { h, m, s, pct, totalMs: remaining, state, label };
  }, [deadline, totalDurationMs, warningThresholdMs]);

  const [result, setResult] = useState<CountdownResult>(compute);

  useEffect(() => {
    setResult(compute());
    const interval = setInterval(() => setResult(compute()), 1000);
    return () => clearInterval(interval);
  }, [compute]);

  return result;
}
