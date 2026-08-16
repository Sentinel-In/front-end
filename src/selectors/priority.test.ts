import { describe, it, expect } from 'vitest';
import { derivePriority } from './priority';
import blackboardData from '../data/blackboard.json';
import type { Blackboard } from '../types';

describe('priority selector', () => {
  it('derives P1 rule 3 for CIAD-2026-0037', () => {
    const bb = blackboardData as unknown as Blackboard;
    const result = derivePriority(bb);
    expect(result.priority).toBe('P1');
    expect(result.rule).toBe(3);
    expect(result.explanation).toBe('Critical severity, applicability 40 < 60');
  });
});
