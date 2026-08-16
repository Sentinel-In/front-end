import type { Blackboard, Priority } from '../types';

export interface PriorityResult {
  priority: Priority;
  rule: 1 | 2 | 3 | 4 | 5 | 6;
  explanation: string;
}

export function derivePriority(bb: Blackboard): PriorityResult {
  let severity = 'Medium';
  const claims = bb.advisory.publisher_claims || [];
  for (const claim of claims) {
    const match = claim.match(/severity:\s*(Critical|High|Medium|Low)/i);
    if (match) {
      severity = match[1];
      // Normalize case
      severity = severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
    }
  }

  const applicability = bb.coverage?.applicability ?? 0;
  const unknownCount = bb.assets?.filter((a) => a.applicability === 'unknown').length || 0;

  if (severity === 'Critical' && applicability >= 60) {
    return { priority: 'P0', rule: 1, explanation: `Critical severity, applicability ${applicability} >= 60` };
  }

  if (severity === 'High' && applicability >= 60) {
    return { priority: 'P1', rule: 2, explanation: `High severity, applicability ${applicability} >= 60` };
  }

  if (severity === 'Critical' && applicability < 60 && unknownCount === 0) {
    return { priority: 'P1', rule: 3, explanation: `Critical severity, applicability ${applicability} < 60` };
  }

  if ((severity === 'Critical' || severity === 'High') && unknownCount > 0) {
    return { priority: 'P2', rule: 4, explanation: `${severity} severity, unknown asset applicability` };
  }

  if (severity === 'Medium' && applicability >= 60) {
    return { priority: 'P2', rule: 5, explanation: `Medium severity, applicability ${applicability} >= 60` };
  }

  return { priority: 'P3', rule: 6, explanation: `Clean baseline or low/medium severity with low applicability` };
}
